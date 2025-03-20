const amqp = require("amqplib");
const AWS = require("aws-sdk");
const { RABBITMQ_URL, QUEUE_NAME } = require("./config");

// Configure LocalStack S3
const s3 = new AWS.S3({
  endpoint: "http://host.docker.internal:4566", // LocalStack S3 URL (e.g., http://localhost:4566)
  s3ForcePathStyle: true,
  accessKeyId: "test", // Default for LocalStack
  secretAccessKey: "test", // Default for LocalStack
});

async function ensureBucketExists(bucketName) {
  try {
    await s3.headBucket({ Bucket: bucketName }).promise();
    console.log(`✅ Bucket "${bucketName}" already exists.`);
  } catch (err) {
    if (err.code === "NotFound" || err.code === "NoSuchBucket") {
      console.log(`🚀 Bucket "${bucketName}" not found. Creating...`);
      await s3.createBucket({ Bucket: bucketName }).promise();
      console.log(`✅ Bucket "${bucketName}" created.`);
    } else {
      throw err; // If the error is not about a missing bucket, throw it
    }
  }
}

async function uploadStreamToS3(bucket, key, fileSize) {
  await ensureBucketExists(bucket);
  return new Promise((resolve, reject) => {
    console.log("Proceed to s3");

    const passThrough = new require("stream").PassThrough();
    const buffer = Buffer.alloc(1024 * 1024); // 1MB chunk
    let written = 0;
    let uploadedMB = 0;

    const uploadParams = {
      Bucket: bucket,
      Key: key,
      Body: passThrough,
    };
    console.log("Before upload");

    s3.upload(uploadParams, (err, data) => {
      if (err) {
        console.error("Upload failed:", err);
        return reject(err);
      }
      console.log("Upload completed:", data);
      resolve(data);
    });
    console.log("After upload");

    function writeChunk() {
      if (written >= fileSize * 1024 * 1024 * 1024) {
        passThrough.end(); // End the stream when done
        return;
      }

      const canWriteMore = passThrough.write(buffer);
      written += buffer.length;
      uploadedMB++;

      if (uploadedMB % 10 === 0) { // Log every 10MB uploaded
        console.log(`Uploaded: ${uploadedMB} MB`);
      }

      if (canWriteMore) {
        setImmediate(writeChunk); // Continue writing in the next tick
      } else {
        passThrough.once("drain", writeChunk); // Wait for the stream to drain
      }
    }

    writeChunk();
  });
}

async function startWorker() {
  console.log("Started");

  const conn = await amqp.connect(RABBITMQ_URL);
  const channel = await conn.createChannel();
  await channel.assertQueue(QUEUE_NAME, { durable: true });

  console.log("Worker is waiting for tasks...");

  channel.consume(QUEUE_NAME, async (msg) => {
    console.log("Request received=========");

    const task = JSON.parse(msg.content.toString());
    const key = `file_${task.fileIndex}.bin`;

    console.log(`Processing file ${task.fileIndex}`);

    // **Upload Directly to LocalStack S3**
    const startTime = process.hrtime();
    await uploadStreamToS3(task.s3Destination, key, task.fileSize);
    const endTime = process.hrtime(startTime);

    console.log(`File ${task.fileIndex} uploaded successfully.`);

    // **Calculate Metrics**
    const totalCopyTime = endTime[0] + endTime[1] / 1e9; // Convert to seconds
    const fileSizeCreated = task.fileSize; // in GB
    const copySpeed = fileSizeCreated / totalCopyTime; // in GBps

    console.log(`✅ Task Completed for file  ${task.fileIndex}`);
    console.log(`   📂 File Size: ${fileSizeCreated} GB`);
    console.log(`   ⏱️ Time to Copy: ${totalCopyTime.toFixed(3)} sec`);
    console.log(`   🚀 Copy Speed: ${copySpeed.toFixed(3)} GBps`);

    channel.ack(msg);
  });
}

startWorker().catch(console.error);
