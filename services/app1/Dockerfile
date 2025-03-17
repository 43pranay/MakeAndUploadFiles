# Use official Node.js image
FROM node:18

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy application files
COPY . .

# Set environment variables (can also be set in docker-compose.yml)
ENV NODE_ENV=production

# Expose the port (if using API for task submission)
EXPOSE 8000

# Run the application
CMD ["node", "index.js"]
