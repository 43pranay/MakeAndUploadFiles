# File Upload Worker

This project implements a worker that generates large files, uploads them to AWS S3, and manages tasks using RabbitMQ. It is designed to handle distributed execution and process files efficiently while avoiding memory and storage issues.

## Features
- Generates large files dynamically
- Uploads files to AWS S3
- Uses RabbitMQ for task queueing
- Handles large files efficiently with optimized memory usage
- Deletes temporary files after upload to free up space

## Prerequisites
- Docker & Docker Compose
- Node.js (v16 or later)
- RabbitMQ
- AWS S3 bucket with necessary permissions

## Installation
### 1. Clone the Repository
```sh
git clone https://github.com/43pranay/MakeAndUploadFiles.git
cd MakeAndUploadFiles
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory and configure the following variables:
```ini
RABBITMQ_URL=amqp://rabbitmq
QUEUE_NAME=file_upload_queue
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET_NAME=your_bucket_name
```

### 3. Start Services using Docker Compose
```sh
docker-compose up --build
```

## Usage
### 1. Publishing a Task to RabbitMQ
To queue a file generation and upload task, publish a message to RabbitMQ:
```json
{
  "fileIndex": 1,
  "fileSize": 5,  // File size in GB
  "s3Destination": "uploads/"
}
```

### 2. Running the Worker
The worker will automatically process tasks from RabbitMQ:
```sh
node worker.js
```

### 3. Monitoring RabbitMQ Queues
Check the status of queues using:
```sh
docker exec -it rabbitmq rabbitmqctl list_queues name messages_ready messages_unacknowledged
```

## Troubleshooting
### 1. Out of Space Issue
- Ensure files are not written to `/tmp`, use `/mnt/data` instead.
- Clean up Docker disk usage:
```sh
docker system prune -a -f --volumes
```
- Check disk space availability:
```sh
df -h /mnt/data
```

### 2. Debugging Worker
- Run worker in debug mode:
```sh
node --inspect worker.js
```
- Check RabbitMQ logs:
```sh
docker logs rabbitmq
```

## License
MIT License

