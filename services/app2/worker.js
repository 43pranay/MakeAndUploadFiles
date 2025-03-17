const amqp = require("amqplib");
const fs = require("fs");
const { uploadToS3 } = require("./s3Uploader");
const { RABBITMQ_URL, QUEUE_NAME } = require("./config");

async function generateLargeFile(filePath, fileSize) {
  return new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(filePath);
    const buffer = Buffer.alloc(1024 * 1024); // 1MB chunk
    let written = 0;

    const startTime = process.hrtime(); // Start time for copy

    function write() {
      while (written < fileSize * 1024 * 1024 * 1024) {
        if (!stream.write(buffer)) break;
        written += buffer.length;
      }
      if (written < fileSize * 1024 * 1024 * 1024) {
        stream.once("drain", write);
      } else {
        stream.end();
        const endTime = process.hrtime(startTime); // End time for copy
        resolve(endTime);
      }
    }
    write();
  });
}

async function startWorker() {
  console.log('Started');
  
  const conn = await amqp.connect(RABBITMQ_URL);
  const channel = await conn.createChannel();
  await channel.assertQueue("file_upload_queue", { durable: true });

  console.log("Worker is waiting for tasks...");

  channel.consume("file_upload_queue", async (msg) => {
    console.log('Request received=========');
    
    const task = JSON.parse(msg.content.toString());
    const filePath = `/tmp/file_${task.fileIndex}.bin`;

    console.log(`Processing file ${task.fileIndex}`);

    // Measure file generation time
    const timeToCopy = await generateLargeFile(filePath, task.fileSize);
    console.log(`File ${task.fileIndex} generated in ${timeToCopy[0]}s ${timeToCopy[1] / 1e9}ms`);

    const uploadStartTime = process.hrtime(); // Start time for upload
    await uploadToS3(filePath, task.s3Destination, `file_${task.fileIndex}.bin`);
    const uploadEndTime = process.hrtime(uploadStartTime); // End time for upload

    console.log(`File ${task.fileIndex} uploaded.`);

    // **Calculate Final Metrics**
    const totalCopyTime = timeToCopy[0] + timeToCopy[1] / 1e9; // Convert to seconds
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
