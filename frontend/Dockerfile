# frontend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package definitions
COPY package*.json ./

# Install packages
RUN npm install

# Copy source configurations
COPY . .

EXPOSE 3000

# Run Vite dev server, binding to all interfaces to support container port forwards
CMD ["npm", "run", "dev"]
