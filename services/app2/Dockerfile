# Use official Node.js image
FROM node:18

# Set working directory
WORKDIR /usr/src/worker

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy application files
COPY . .

# Set environment variables
ENV NODE_ENV=production

# This container does not expose ports because it listens to RabbitMQ

# Run the worker process
CMD ["node", "worker.js"]
