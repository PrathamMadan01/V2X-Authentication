# Build Stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production Stage
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY --from=builder /app/dist ./dist
# Copy abis if necessary, but TS resolveJsonModule usually inlines or copies it
# Just in case it expects the file structure
# COPY --from=builder /app/src/abis ./dist/abis 

EXPOSE 4000
CMD ["node", "dist/index.js"]
