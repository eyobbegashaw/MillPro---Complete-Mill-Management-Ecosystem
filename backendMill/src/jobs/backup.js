const cron = require('node-cron');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const mongoose = require('mongoose');
const notificationService = require('../services/notificationService');
const User = require('../models/User');

class BackupJob {
  constructor() {
    this.backupDir = path.join(__dirname, '../../backups');
    this.ensureBackupDir();
  }

  async ensureBackupDir() {
    try {
      await fs.access(this.backupDir);
    } catch {
      await fs.mkdir(this.backupDir, { recursive: true });
    }
  }

  // Schedule backups
  scheduleBackups() {
    // Daily backup at 2 AM
    cron.schedule('0 2 * * *', () => {
      console.log('Running daily backup...');
      this.performBackup('daily');
    });

    // Weekly backup on Sunday at 3 AM
    cron.schedule('0 3 * * 0', () => {
      console.log('Running weekly backup...');
      this.performBackup('weekly');
    });

    // Monthly backup on 1st of month at 4 AM
    cron.schedule('0 4 1 * *', () => {
      console.log('Running monthly backup...');
      this.performBackup('monthly');
    });

    console.log('Backup jobs scheduled');
  }

  // Perform backup
  async performBackup(type = 'daily') {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `backup-${type}-${timestamp}`;
      const backupPath = path.join(this.backupDir, backupFileName);

      // Create backup directory
      await fs.mkdir(backupPath, { recursive: true });

      // Backup database
      await this.backupDatabase(backupPath);

      // Backup uploads
      await this.backupUploads(backupPath);

      // Create metadata
      await this.createMetadata(backupPath, type);

      // Compress backup
      const archivePath = await this.compressBackup(backupPath, backupFileName);

      // Cleanup old backups
      await this.cleanupOldBackups(type);

      // Notify admins
      await this.notifyAdmins(archivePath, type);

      console.log(`Backup completed successfully: ${archivePath}`);
      return archivePath;
    } catch (error) {
      console.error('Backup failed:', error);
      await this.notifyBackupFailure(error);
      throw error;
    }
  }

  // Backup database
  async backupDatabase(backupPath) {
    try {
      const { MONGO_URI } = process.env;
      
      // Get database name from URI
      const dbName = MONGO_URI.split('/').pop().split('?')[0];
      
      // Use mongodump for backup
      const cmd = `mongodump --uri="${MONGO_URI}" --out="${backupPath}/database"`;
      
      const { stdout, stderr } = await execPromise(cmd);
      
      if (stderr) {
        console.error('mongodump stderr:', stderr);
      }

      // Also backup using mongoose models (JSON format)
      await this.backupModelsToJSON(backupPath);

      console.log('Database backup completed');
    } catch (error) {
      console.error('Database backup failed:', error);
      throw error;
    }
  }

  // Backup models to JSON
  async backupModelsToJSON(backupPath) {
    try {
      const collections = mongoose.connection.collections;
      const modelsPath = path.join(backupPath, 'models');
      await fs.mkdir(modelsPath, { recursive: true });

      for (const [name, collection] of Object.entries(collections)) {
        const documents = await collection.find({}).toArray();
        const filePath = path.join(modelsPath, `${name}.json`);
        await fs.writeFile(filePath, JSON.stringify(documents, null, 2));
      }

      console.log('Models backup completed');
    } catch (error) {
      console.error('Models backup failed:', error);
      throw error;
    }
  }

  // Backup uploads
  async backupUploads(backupPath) {
    try {
      const uploadsDir = path.join(__dirname, '../../uploads');
      const backupUploadsDir = path.join(backupPath, 'uploads');

      try {
        await fs.access(uploadsDir);
      } catch {
        console.log('No uploads directory to backup');
        return;
      }

      // Copy uploads directory
      await execPromise(`cp -r "${uploadsDir}" "${backupUploadsDir}"`);

      console.log('Uploads backup completed');
    } catch (error) {
      console.error('Uploads backup failed:', error);
      throw error;
    }
  }

  // Create metadata
  async createMetadata(backupPath, type) {
    try {
      const stats = await this.getDatabaseStats();
      
      const metadata = {
        type,
        timestamp: new Date().toISOString(),
        database: {
          name: mongoose.connection.name,
          collections: stats.collections,
          documents: stats.documents,
          size: stats.size
        },
        system: {
          nodeVersion: process.version,
          platform: process.platform,
          memory: process.memoryUsage()
        },
        environment: process.env.NODE_ENV
      };

      const metadataPath = path.join(backupPath, 'metadata.json');
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

      console.log('Metadata created');
    } catch (error) {
      console.error('Metadata creation failed:', error);
      throw error;
    }
  }

  // Get database stats
  async getDatabaseStats() {
    try {
      const stats = {
        collections: 0,
        documents: 0,
        size: 0
      };

      const collections = mongoose.connection.collections;
      stats.collections = Object.keys(collections).length;

      for (const collection of Object.values(collections)) {
        const count = await collection.countDocuments();
        stats.documents += count;
      }

      // Get database size (approximate)
      const dbStats = await mongoose.connection.db.stats();
      stats.size = dbStats.dataSize;

      return stats;
    } catch (error) {
      console.error('Get database stats failed:', error);
      return stats;
    }
  }

  // Compress backup
  async compressBackup(backupPath, backupFileName) {
    try {
      const archivePath = path.join(this.backupDir, `${backupFileName}.tar.gz`);
      
      // Compress using tar
      await execPromise(`tar -czf "${archivePath}" -C "${this.backupDir}" "${backupFileName}"`);

      // Remove uncompressed directory
      await fs.rm(backupPath, { recursive: true, force: true });

      console.log('Backup compressed:', archivePath);
      return archivePath;
    } catch (error) {
      console.error('Compression failed:', error);
      throw error;
    }
  }

  // Cleanup old backups
  async cleanupOldBackups(type) {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files.filter(f => f.startsWith(`backup-${type}`));

      // Keep different number of backups based on type
      const keepCount = {
        daily: 7,      // Keep last 7 daily backups
        weekly: 4,     // Keep last 4 weekly backups
        monthly: 12    // Keep last 12 monthly backups
      }[type] || 7;

      if (backupFiles.length > keepCount) {
        // Sort by date (oldest first)
        backupFiles.sort();

        // Delete oldest backups
        const toDelete = backupFiles.slice(0, backupFiles.length - keepCount);
        
        for (const file of toDelete) {
          const filePath = path.join(this.backupDir, file);
          await fs.unlink(filePath);
          console.log(`Deleted old backup: ${file}`);
        }
      }
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }

  // Notify admins
  async notifyAdmins(backupPath, type) {
    try {
      const admins = await User.find({ role: 'admin' });
      
      const fileStats = await fs.stat(backupPath);
      const fileSize = (fileStats.size / (1024 * 1024)).toFixed(2); // MB

      for (const admin of admins) {
        await notificationService.createNotification({
          userId: admin._id,
          title: 'Backup Completed',
          message: `${type.charAt(0).toUpperCase() + type.slice(1)} backup completed successfully. Size: ${fileSize}MB`,
          type: 'system',
          priority: 'medium',
          data: {
            backupPath,
            type,
            size: fileSize,
            timestamp: new Date()
          }
        });
      }
    } catch (error) {
      console.error('Notify admins failed:', error);
    }
  }

  // Notify backup failure
  async notifyBackupFailure(error) {
    try {
      const admins = await User.find({ role: 'admin' });

      for (const admin of admins) {
        await notificationService.createNotification({
          userId: admin._id,
          title: '⚠️ Backup Failed',
          message: `Scheduled backup failed: ${error.message}`,
          type: 'system',
          priority: 'urgent',
          data: {
            error: error.message,
            timestamp: new Date()
          }
        });
      }
    } catch (notifyError) {
      console.error('Failed to notify backup failure:', notifyError);
    }
  }

  // Restore from backup
  async restoreBackup(backupFile) {
    try {
      const backupPath = path.join(this.backupDir, backupFile);
      
      // Check if backup exists
      try {
        await fs.access(backupPath);
      } catch {
        throw new Error('Backup file not found');
      }

      // Extract backup
      const extractDir = path.join(this.backupDir, 'restore-temp');
      await fs.mkdir(extractDir, { recursive: true });
      
      await execPromise(`tar -xzf "${backupPath}" -C "${extractDir}"`);

      // Find extracted directory
      const files = await fs.readdir(extractDir);
      const backupDir = files.find(f => f.startsWith('backup-'));
      
      if (!backupDir) {
        throw new Error('Invalid backup format');
      }

      const restorePath = path.join(extractDir, backupDir);

      // Restore database
      await this.restoreDatabase(restorePath);

      // Restore uploads
      await this.restoreUploads(restorePath);

      // Cleanup
      await fs.rm(extractDir, { recursive: true, force: true });

      console.log('Restore completed successfully');
      return true;
    } catch (error) {
      console.error('Restore failed:', error);
      throw error;
    }
  }

  // Restore database
  async restoreDatabase(restorePath) {
    try {
      const dbPath = path.join(restorePath, 'database');
      const { MONGO_URI } = process.env;

      // Use mongorestore
      const cmd = `mongorestore --uri="${MONGO_URI}" --drop "${dbPath}"`;
      
      const { stdout, stderr } = await execPromise(cmd);
      
      if (stderr) {
        console.error('mongorestore stderr:', stderr);
      }

      console.log('Database restore completed');
    } catch (error) {
      console.error('Database restore failed:', error);
      throw error;
    }
  }

  // Restore uploads
  async restoreUploads(restorePath) {
    try {
      const uploadsBackup = path.join(restorePath, 'uploads');
      const uploadsDir = path.join(__dirname, '../../uploads');

      try {
        await fs.access(uploadsBackup);
      } catch {
        console.log('No uploads to restore');
        return;
      }

      // Clear current uploads
      try {
        await fs.rm(uploadsDir, { recursive: true, force: true });
      } catch {}

      // Restore uploads
      await execPromise(`cp -r "${uploadsBackup}" "${uploadsDir}"`);

      console.log('Uploads restore completed');
    } catch (error) {
      console.error('Uploads restore failed:', error);
      throw error;
    }
  }

  // List backups
  async listBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backups = [];

      for (const file of files) {
        if (file.endsWith('.tar.gz')) {
          const filePath = path.join(this.backupDir, file);
          const stats = await fs.stat(filePath);
          
          // Parse backup info from filename
          const matches = file.match(/backup-(\w+)-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3})Z/);
          
          backups.push({
            filename: file,
            type: matches ? matches[1] : 'unknown',
            timestamp: matches ? new Date(matches[2].replace(/-/g, ':')) : stats.mtime,
            size: stats.size,
            created: stats.mtime
          });
        }
      }

      // Sort by date (newest first)
      backups.sort((a, b) => b.timestamp - a.timestamp);

      return backups;
    } catch (error) {
      console.error('List backups failed:', error);
      return [];
    }
  }
}

module.exports = new BackupJob();