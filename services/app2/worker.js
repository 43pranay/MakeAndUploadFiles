const amqp = require("amqplib");
const AWS = require("aws-sdk");
const { RABBITMQ_URL, QUEUE_NAME } = require("./config");

// Configure LocalStack S3
const s3 = new AWS.S3({
  endpoint: "http://localhost:4566", // LocalStack S3 URL (e.g., http://localhost:4566)
  s3ForcePathStyle: true,
  accessKeyId: "test", // Default for LocalStack
  secretAccessKey: "test", // Default for LocalStack
});

async function uploadStreamToS3(bucket, key, fileSize) {
  return new Promise((resolve, reject) => {
    console.log("Proceed to s3");
    
    const passThrough = new require("stream").PassThrough();
    const buffer = Buffer.alloc(1024 * 1024); // 1MB chunk
    let written = 0;

    const uploadParams = {
      Bucket: bucket,
      Key: key,
      Body: passThrough,
    };
    console.log("Before upload");
    
    s3.upload(uploadParams, (err, data) => {
      if (err) return reject(err);
      resolve(data);
    });
    console.log("After upload");

    function writeChunk() {
      while (written < fileSize * 1024 * 1024 * 1024) {
        if (!passThrough.write(buffer)) break;
        written += buffer.length;
      }
      if (written < fileSize * 1024 * 1024 * 1024) {
        passThrough.once("drain", writeChunk);
      } else {
        passThrough.end();
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

    console.log(`✅ Task Completed for file ${task.fileIndex}`);
    console.log(`   📂 File Size: ${fileSizeCreated} GB`);
    console.log(`   ⏱️ Time to Copy: ${totalCopyTime.toFixed(3)} sec`);
    console.log(`   🚀 Copy Speed: ${copySpeed.toFixed(3)} GBps`);

    channel.ack(msg);
  });
}

startWorker().catch(console.error);
