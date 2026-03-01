const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

class FileService {
  constructor() {
    this.baseUploadDir = 'uploads';
    this.allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    this.allowedDocTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
  }

  async ensureDir(dirPath) {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  async saveFile(file, subDir = 'general') {
    try {
      const uploadDir = path.join(this.baseUploadDir, subDir);
      await this.ensureDir(uploadDir);

      const fileExt = path.extname(file.originalname);
      const fileName = `${uuidv4()}${fileExt}`;
      const filePath = path.join(uploadDir, fileName);

      // Validate file type
      if (!this.allowedImageTypes.includes(file.mimetype) && !this.allowedDocTypes.includes(file.mimetype)) {
        throw new Error('File type not allowed');
      }

      // Validate file size
      if (file.size > this.maxFileSize) {
        throw new Error('File too large');
      }

      // Save file
      await fs.writeFile(filePath, file.buffer);

      return {
        fileName,
        filePath: `/${filePath.replace(/\\/g, '/')}`,
        size: file.size,
        mimeType: file.mimetype
      };
    } catch (error) {
      console.error('Save file error:', error);
      throw error;
    }
  }

  async saveImage(file, subDir = 'images', options = {}) {
    try {
      const uploadDir = path.join(this.baseUploadDir, subDir);
      await this.ensureDir(uploadDir);

      const fileName = `${uuidv4()}.jpg`;
      const filePath = path.join(uploadDir, fileName);

      // Validate image type
      if (!this.allowedImageTypes.includes(file.mimetype)) {
        throw new Error('File type not allowed. Please upload an image.');
      }

      let image = sharp(file.buffer);

      // Resize if needed
      if (options.resize) {
        image = image.resize(options.resize.width, options.resize.height, {
          fit: options.resize.fit || 'cover',
          withoutEnlargement: true
        });
      }

      // Compress image
      await image
        .jpeg({ quality: options.quality || 80 })
        .toFile(filePath);

      // Create thumbnail
      if (options.createThumbnail) {
        const thumbName = `thumb-${fileName}`;
        const thumbPath = path.join(uploadDir, thumbName);
        await sharp(file.buffer)
          .resize(200, 200, { fit: 'cover' })
          .jpeg({ quality: 60 })
          .toFile(thumbPath);
      }

      return {
        fileName,
        filePath: `/${filePath.replace(/\\/g, '/')}`,
        size: file.size,
        mimeType: 'image/jpeg'
      };
    } catch (error) {
      console.error('Save image error:', error);
      throw error;
    }
  }

  async deleteFile(filePath) {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      await fs.unlink(fullPath);
      return true;
    } catch (error) {
      console.error('Delete file error:', error);
      return false;
    }
  }

  async getFileInfo(filePath) {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      const stats = await fs.stat(fullPath);
      
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isFile: stats.isFile()
      };
    } catch (error) {
      console.error('Get file info error:', error);
      return null;
    }
  }

  async listFiles(subDir = '') {
    try {
      const dirPath = path.join(this.baseUploadDir, subDir);
      await this.ensureDir(dirPath);
      
      const files = await fs.readdir(dirPath);
      
      const filesInfo = await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(dirPath, file);
          const stats = await fs.stat(filePath);
          
          return {
            name: file,
            path: `/${filePath.replace(/\\/g, '/')}`,
            size: stats.size,
            modified: stats.mtime,
            isDirectory: stats.isDirectory()
          };
        })
      );
      
      return filesInfo;
    } catch (error) {
      console.error('List files error:', error);
      return [];
    }
  }

  async cleanupOldFiles(daysOld = 30) {
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - daysOld);
      
      const files = await this.listFiles();
      
      for (const file of files) {
        if (!file.isDirectory && new Date(file.modified) < cutoff) {
          await this.deleteFile(file.path);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Cleanup files error:', error);
      return false;
    }
  }

  async getFileUrl(filePath) {
    return `${process.env.API_URL}${filePath}`;
  }

  validateFile(file, options = {}) {
    const errors = [];

    // Check file exists
    if (!file) {
      errors.push('No file provided');
      return errors;
    }

    // Check file type
    if (options.allowedTypes && !options.allowedTypes.includes(file.mimetype)) {
      errors.push(`File type not allowed. Allowed types: ${options.allowedTypes.join(', ')}`);
    }

    // Check file size
    const maxSize = options.maxSize || this.maxFileSize;
    if (file.size > maxSize) {
      errors.push(`File too large. Max size: ${maxSize / (1024 * 1024)}MB`);
    }

    // Check dimensions for images
    if (options.minWidth || options.minHeight || options.maxWidth || options.maxHeight) {
      // This would need to read the image dimensions
      // For now, we'll skip this validation
    }

    return errors;
  }

  async saveBase64Image(base64Data, subDir = 'images') {
    try {
      const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      
      if (!matches || matches.length !== 3) {
        throw new Error('Invalid base64 data');
      }

      const mimeType = matches[1];
      const buffer = Buffer.from(matches[2], 'base64');

      const file = {
        buffer,
        mimetype: mimeType,
        size: buffer.length,
        originalname: `image-${Date.now()}.jpg`
      };

      return this.saveImage(file, subDir);
    } catch (error) {
      console.error('Save base64 image error:', error);
      throw error;
    }
  }
}

module.exports = new FileService();