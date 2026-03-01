const cron = require('node-cron');
const Notification = require('../models/Notification');
const notificationService = require('../services/notificationService');

class NotificationCleanupJob {
  constructor() {
    this.retentionDays = {
      read: 30,        // Keep read notifications for 30 days
      unread: 90,       // Keep unread notifications for 90 days
      expired: 7        // Keep expired notifications for 7 days after expiry
    };
  }

  // Schedule cleanup jobs
  scheduleCleanup() {
    // Run daily at 1 AM
    cron.schedule('0 1 * * *', () => {
      console.log('Running notification cleanup...');
      this.cleanupNotifications();
    });

    // Run weekly on Sunday at 2 AM for deep cleanup
    cron.schedule('0 2 * * 0', () => {
      console.log('Running deep notification cleanup...');
      this.deepCleanup();
    });

    console.log('Notification cleanup jobs scheduled');
  }

  // Main cleanup function
  async cleanupNotifications() {
    try {
      const results = {
        deleted: 0,
        archived: 0,
        errors: []
      };

      // Delete expired notifications
      const expiredDeleted = await this.cleanupExpired();
      results.deleted += expiredDeleted;

      // Archive old read notifications
      const archived = await this.archiveOldRead();
      results.archived += archived;

      // Cleanup old unread notifications
      const unreadDeleted = await this.cleanupOldUnread();
      results.deleted += unreadDeleted;

      console.log('Notification cleanup completed:', results);
      
      // Log results
      await this.logCleanupResults(results);

      return results;
    } catch (error) {
      console.error('Notification cleanup failed:', error);
      throw error;
    }
  }

  // Cleanup expired notifications
  async cleanupExpired() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays.expired);

      const result = await Notification.deleteMany({
        expiresAt: { $lt: cutoffDate }
      });

      console.log(`Deleted ${result.deletedCount} expired notifications`);
      return result.deletedCount;
    } catch (error) {
      console.error('Cleanup expired notifications failed:', error);
      throw error;
    }
  }

  // Archive old read notifications
  async archiveOldRead() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays.read);

      // Instead of deleting, mark as archived
      const result = await Notification.updateMany(
        {
          read: true,
          readAt: { $lt: cutoffDate },
          isArchived: { $ne: true }
        },
        {
          isArchived: true,
          archivedAt: new Date()
        }
      );

      console.log(`Archived ${result.modifiedCount} old read notifications`);
      return result.modifiedCount;
    } catch (error) {
      console.error('Archive old read notifications failed:', error);
      throw error;
    }
  }

  // Cleanup old unread notifications
  async cleanupOldUnread() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays.unread);

      const result = await Notification.deleteMany({
        read: false,
        createdAt: { $lt: cutoffDate }
      });

      console.log(`Deleted ${result.deletedCount} old unread notifications`);
      return result.deletedCount;
    } catch (error) {
      console.error('Cleanup old unread notifications failed:', error);
      throw error;
    }
  }

  // Deep cleanup - remove all archived notifications older than 1 year
  async deepCleanup() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);

      const result = await Notification.deleteMany({
        isArchived: true,
        archivedAt: { $lt: cutoffDate }
      });

      console.log(`Deep cleanup deleted ${result.deletedCount} archived notifications`);
      return result.deletedCount;
    } catch (error) {
      console.error('Deep cleanup failed:', error);
      throw error;
    }
  }

  // Cleanup by user
  async cleanupUserNotifications(userId, options = {}) {
    try {
      const { olderThan, onlyRead, onlyUnread } = options;

      const query = { user: userId };

      if (olderThan) {
        query.createdAt = { $lt: olderThan };
      }

      if (onlyRead) {
        query.read = true;
      } else if (onlyUnread) {
        query.read = false;
      }

      const result = await Notification.deleteMany(query);

      console.log(`Cleaned up ${result.deletedCount} notifications for user ${userId}`);
      return result.deletedCount;
    } catch (error) {
      console.error('Cleanup user notifications failed:', error);
      throw error;
    }
  }

  // Cleanup by type
  async cleanupByType(type, olderThan) {
    try {
      const query = { type };

      if (olderThan) {
        query.createdAt = { $lt: olderThan };
      }

      const result = await Notification.deleteMany(query);

      console.log(`Cleaned up ${result.deletedCount} ${type} notifications`);
      return result.deletedCount;
    } catch (error) {
      console.error('Cleanup by type failed:', error);
      throw error;
    }
  }

  // Get notification stats
  async getNotificationStats() {
    try {
      const stats = await Notification.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            read: { $sum: { $cond: ['$read', 1, 0] } },
            unread: { $sum: { $cond: ['$read', 0, 1] } },
            archived: { $sum: { $cond: ['$isArchived', 1, 0] } },
            byType: {
              $push: {
                type: '$type',
                count: 1
              }
            }
          }
        },
        {
          $project: {
            _id: 0,
            total: 1,
            read: 1,
            unread: 1,
            archived: 1,
            byType: {
              $reduce: {
                input: '$byType',
                initialValue: {},
                in: {
                  $mergeObjects: [
                    '$$value',
                    { $arrayToObject: [[{ k: '$$this.type', v: '$$this.count' }]] }
                  ]
                }
              }
            }
          }
        }
      ]);

      // Get oldest and newest notifications
      const [oldest] = await Notification.find().sort('createdAt').limit(1);
      const [newest] = await Notification.find().sort('-createdAt').limit(1);

      return {
        counts: stats[0] || { total: 0, read: 0, unread: 0, archived: 0, byType: {} },
        oldest: oldest?.createdAt,
        newest: newest?.createdAt,
        retention: this.retentionDays
      };
    } catch (error) {
      console.error('Get notification stats failed:', error);
      throw error;
    }
  }

  // Log cleanup results
  async logCleanupResults(results) {
    try {
      const logEntry = {
        timestamp: new Date(),
        type: 'notification-cleanup',
        results
      };

      // Save to database or file
      const fs = require('fs').promises;
      const path = require('path');
      
      const logDir = path.join(__dirname, '../../logs');
      const logFile = path.join(logDir, 'cleanup.log');

      try {
        await fs.access(logDir);
      } catch {
        await fs.mkdir(logDir, { recursive: true });
      }

      let logs = [];
      try {
        const content = await fs.readFile(logFile, 'utf8');
        logs = JSON.parse(content);
      } catch {
        logs = [];
      }

      logs.push(logEntry);
      
      // Keep only last 100 logs
      if (logs.length > 100) {
        logs = logs.slice(-100);
      }

      await fs.writeFile(logFile, JSON.stringify(logs, null, 2));
    } catch (error) {
      console.error('Log cleanup results failed:', error);
    }
  }

  // Update retention settings
  updateRetention(settings) {
    this.retentionDays = {
      ...this.retentionDays,
      ...settings
    };
    console.log('Retention settings updated:', this.retentionDays);
  }

  // Manual cleanup with custom options
  async manualCleanup(options = {}) {
    try {
      const {
        olderThan,
        types = [],
        read = null,
        permanent = false
      } = options;

      const query = {};

      if (olderThan) {
        query.createdAt = { $lt: olderThan };
      }

      if (types.length > 0) {
        query.type = { $in: types };
      }

      if (read !== null) {
        query.read = read;
      }

      let result;
      if (permanent) {
        result = await Notification.deleteMany(query);
      } else {
        result = await Notification.updateMany(query, {
          isArchived: true,
          archivedAt: new Date()
        });
      }

      console.log('Manual cleanup completed:', result);
      return result;
    } catch (error) {
      console.error('Manual cleanup failed:', error);
      throw error;
    }
  }
}

module.exports = new NotificationCleanupJob();