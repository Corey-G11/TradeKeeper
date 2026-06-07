FROM node:20-alpine

WORKDIR /app

# Install only production deps first (better layer caching)
COPY package.json ./
RUN npm install --omit=dev

COPY . .

# Where the journal backup is persisted (mount a volume here)
ENV DATA_DIR=/data
ENV PORT=8080
VOLUME ["/data"]
EXPOSE 8080

CMD ["npm", "start"]
