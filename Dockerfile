FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache ffmpeg python3 make g++
COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev
COPY . .
RUN npm run build
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"]