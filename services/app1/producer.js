const amqp = require("amqplib");
const { RABBITMQ_URL, QUEUE_NAME } = require("./config");

async function sendToQueue(task) {
  const conn = await amqp.connect(RABBITMQ_URL);
  const channel = await conn.createChannel();
  await channel.assertQueue("file_upload_queue", { durable: true });

  channel.sendToQueue("file_upload_queue", Buffer.from(JSON.stringify(task)), {
    persistent: true,
  });

  console.log(`Task Sent: ${JSON.stringify(task)}`);
  await channel.close();
  await conn.close();
}

module.exports = { sendToQueue };
