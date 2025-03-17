module.exports = {
    RABBITMQ_URL: process.env.RABBITMQ_URL || "amqp://rabbitmq",
    QUEUE_NAME: process.env.QUEUE_NAME || "file_upload_queue"
  };
  