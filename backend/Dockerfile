# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy configuration files
COPY package*.json tsconfig.json ./
COPY prisma ./prisma/

# Install dependencies (ignoring scripts initially to generate client after copying src)
RUN npm install

# Copy source code
COPY src ./src

# Generate Prisma Client
RUN npx prisma generate

# Compile TypeScript to JavaScript (dist/)
RUN npm run build

EXPOSE 5000

# Default environment configurations
ENV NODE_ENV=production
ENV PORT=5000

# Execute server compiled entry point
CMD ["node", "dist/app.js"]
