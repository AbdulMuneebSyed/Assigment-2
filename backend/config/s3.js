const { S3Client } = require("@aws-sdk/client-s3");

// Configure S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// S3 bucket configuration
const s3Config = {
  bucketName: process.env.S3_BUCKET_NAME,
  region: process.env.AWS_REGION || "us-east-1",
  // Presigned URL expiration time (1 hour)
  presignedUrlExpiration: 3600,
  // CloudFront configuration
  cloudFrontDomain: process.env.CLOUDFRONT_DOMAIN || null,
  useCloudFront: process.env.USE_CLOUDFRONT === "true",
};

module.exports = { s3Client, s3Config };
