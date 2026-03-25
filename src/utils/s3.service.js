const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const logger = require('./logger');

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Upload a file to S3
 * @param {Object} file - The file object from express-fileupload
 * @param {string} folder - The folder prefix (e.g., 'products', 'categories')
 * @returns {Promise<string>} - The public URL of the uploaded file
 */
const uploadToS3 = async (file, folder) => {
  try {
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const filename = `${folder}/${timestamp}_${safeName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: filename,
      Body: file.data,
      ContentType: file.mimetype,
      // ACL: 'public-read' // Uncomment if you want objects to be public by default (Depends on bucket settings)
    });

    await s3Client.send(command);

    // Generate the public URL
    // If you use a custom domain or CloudFront, you can change the base URL here.
    const url = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${filename}`;
    
    return url;
  } catch (error) {
    logger.error('Error uploading file to S3:', error);
    throw error;
  }
};

module.exports = {
  uploadToS3,
};
