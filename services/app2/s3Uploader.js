const AWS = require("aws-sdk");

const s3 = new AWS.S3({
  endpoint: "http://localhost:4566", // LocalStack URL
  s3ForcePathStyle: true,  // Required for LocalStack
  accessKeyId: "test",  // Dummy credentials
  secretAccessKey: "test",  // Dummy credentials
  region: "us-east-1"
});

async function uploadToS3(filePath, bucketName, fileName) {
  const fileContent = require("fs").readFileSync(filePath);

  await s3.upload({
    Bucket: bucketName,
    Key: fileName,
    Body: fileContent
  }).promise();

  console.log(`✅ File uploaded to LocalStack S3: ${bucketName}/${fileName}`);
}

module.exports = { uploadToS3 };
