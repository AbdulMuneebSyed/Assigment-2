const {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { s3Client, s3Config } = require("../config/s3");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");

class S3Service {
  /**
   * Upload a file to S3
   * @param {Object} file - Multer file object or local file info
   * @param {String} folder - S3 folder prefix (e.g., 'videos')
   * @returns {Promise<Object>} - {key, url, bucket}
   */
  async uploadFile(file, folder = "videos") {
    try {
      // Generate unique key
      const fileExtension = path.extname(file.originalname || file.name);
      const uniqueId = crypto.randomUUID();
      const key = `${folder}/${uniqueId}${fileExtension}`;

      // Read file buffer
      let fileBuffer;
      if (file.buffer) {
        // Multer memory storage
        fileBuffer = file.buffer;
      } else if (file.path) {
        // Multer disk storage or local file
        fileBuffer = fs.readFileSync(file.path);
      } else {
        throw new Error("Invalid file object");
      }

      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: s3Config.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: file.mimetype || "video/mp4",
        Metadata: {
          originalName: file.originalname || file.name,
          uploadedAt: new Date().toISOString(),
        },
      });

      await s3Client.send(command);
      console.log(`✅ Uploaded file to S3: ${key}`);

      // Generate URL based on CloudFront or S3
      let url;
      if (s3Config.useCloudFront && s3Config.cloudFrontDomain) {
        url = `https://${s3Config.cloudFrontDomain}/${key}`;
      } else {
        url = `https://d2cmcxnl3ra73v.cloudfront.net/${key}`;
      }

      // Return S3 details
      return {
        key,
        bucket: s3Config.bucketName,
        url,
        size: file.size,
        mimetype: file.mimetype,
      };
    } catch (error) {
      console.error("S3 Upload Error:", error);
      throw new Error(`Failed to upload file to S3: ${error.message}`);
    }
  }

  /**
   * Generate a presigned URL for streaming/downloading
   * @param {String} key - S3 object key
   * @param {Number} expiresIn - Expiration time in seconds
   * @returns {Promise<String>} - Presigned URL or CloudFront URL
   */
  async getPresignedUrl(key, expiresIn = s3Config.presignedUrlExpiration) {
    try {
      // If CloudFront is enabled, return public CloudFront URL
      if (s3Config.useCloudFront && s3Config.cloudFrontDomain) {
        return `https://${s3Config.cloudFrontDomain}/${key}`;
      }

      // Otherwise, generate S3 presigned URL
      const command = new GetObjectCommand({
        Bucket: s3Config.bucketName,
        Key: key,
      });

      const url = await getSignedUrl(s3Client, command, { expiresIn });
      return url;
    } catch (error) {
      console.error("Presigned URL Error:", error);
      throw new Error(`Failed to generate presigned URL: ${error.message}`);
    }
  }

  /**
   * Delete a file from S3
   * @param {String} key - S3 object key
   * @returns {Promise<Boolean>}
   */
  async deleteFile(key) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: s3Config.bucketName,
        Key: key,
      });

      await s3Client.send(command);
      return true;
    } catch (error) {
      console.error("S3 Delete Error:", error);
      throw new Error(`Failed to delete file from S3: ${error.message}`);
    }
  }

  /**
   * Download file from S3 to local temporary path
   * @param {String} key - S3 object key
   * @param {String} localPath - Local file path to save
   * @returns {Promise<String>} - Local file path
   */
  async downloadToLocal(key, localPath) {
    try {
      const command = new GetObjectCommand({
        Bucket: s3Config.bucketName,
        Key: key,
      });

      const response = await s3Client.send(command);
      const fileStream = fs.createWriteStream(localPath);

      return new Promise((resolve, reject) => {
        response.Body.pipe(fileStream);
        fileStream.on("finish", () => resolve(localPath));
        fileStream.on("error", reject);
      });
    } catch (error) {
      console.error("S3 Download Error:", error);
      throw new Error(`Failed to download file from S3: ${error.message}`);
    }
  }

  /**
   * Check if file exists in S3
   * @param {String} key - S3 object key
   * @returns {Promise<Boolean>}
   */
  async fileExists(key) {
    try {
      const command = new HeadObjectCommand({
        Bucket: s3Config.bucketName,
        Key: key,
      });

      await s3Client.send(command);
      return true;
    } catch (error) {
      if (error.name === "NotFound") {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get file metadata from S3
   * @param {String} key - S3 object key
   * @returns {Promise<Object>} - Metadata
   */
  async getFileMetadata(key) {
    try {
      const command = new HeadObjectCommand({
        Bucket: s3Config.bucketName,
        Key: key,
      });

      const response = await s3Client.send(command);
      return {
        size: response.ContentLength,
        contentType: response.ContentType,
        lastModified: response.LastModified,
        metadata: response.Metadata,
      };
    } catch (error) {
      console.error("S3 Metadata Error:", error);
      throw new Error(`Failed to get file metadata: ${error.message}`);
    }
  }
}

module.exports = new S3Service();
