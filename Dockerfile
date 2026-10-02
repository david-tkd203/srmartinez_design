# Stage 1: Build the Vite project
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies first for Docker caching
COPY package.json package-lock.json* ./
RUN npm install

# Copy all project files
COPY . .

# Build the project (output will be in the 'dist' folder)
RUN npm run build

# Stage 2: Serve with Node.js Backend
FROM node:22-alpine

WORKDIR /app

# Copy backend dependencies
COPY package.json package-lock.json* ./
RUN npm install --production

# Copy backend source code and seed data
COPY backend ./backend

# Copy built frontend from stage 1
COPY --from=builder /app/dist ./dist

# Create upload directory (it will be created by multer, but let's be safe)
RUN mkdir -p ./dist/videos\ clothes

EXPOSE 3000

CMD ["node", "backend/server.js"]
