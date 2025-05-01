# Stage 1: Base image
FROM node:20.11.1-alpine

# Set Node memory limit to avoid heap out of memory errors
ENV NODE_OPTIONS="--max_old_space_size=4096"

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install --legacy-peer-deps --include=dev


ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL
ENV NEXT_TELEMETRY_DISABLED=1

COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start"]
