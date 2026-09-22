FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
COPY backend/package.json backend/package.json
RUN npm ci
COPY backend backend
RUN npm run build --workspace backend
EXPOSE 3001
CMD ["npm", "run", "start", "--workspace", "backend"]
