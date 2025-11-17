FROM node:18-alpine

WORKDIR /app

# Disable Husky hooks in Docker/Render builds
ENV HUSKY=0

COPY package*.json ./
# RUN npm ci --only=production

COPY . .

EXPOSE 3000
CMD ["node", "src/index.js"]
