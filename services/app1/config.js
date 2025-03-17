require("dotenv").config();

module.exports = {
  RABBITMQ_URL: process.env.RABBITMQ_URL || "amqp://rabbitmq",
  QUEUE_NAME: process.env.QUEUE_NAME || "file_upload_queue",
  PORT: process.env.PORT || 8000,
};
