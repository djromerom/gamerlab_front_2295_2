# Production multi-stage Dockerfile for React + Vite + TypeScript
# Build stage: installs dependencies and builds the Vite app
FROM node:22.11.0 AS build

WORKDIR /app

# Copy package manifests first to use Docker cache for deps
COPY package*.json ./
COPY package-lock.json ./       

# Install dependencies
RUN npm ci --silent

# Build-time env vars (passed as --build-arg). These will be written to a .env
# so Vite can replace import.meta.env.VITE_* during build.

ARG VITE_ENDPOINT_BACKEND
ARG VITE_SITE_KEY

# Write a simple .env file consumed at build time by Vite
RUN printf "VITE_ENDPOINT_BACKEND=%s\nVITE_SITE_KEY=%s\n" "$VITE_ENDPOINT_BACKEND" "$VITE_SITE_KEY" > .env || true

# Copy the rest of the source code and build
COPY . .
RUN npm run build

## Production stage: nginx serving the built files
FROM nginx:1.25.2-alpine AS prod

# Remove default static content
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*

# Copy built files from previous stage
COPY --from=build /app/dist/ ./

# Expose the port that nginx listens to (nginx.conf listens on 5173)
EXPOSE 80

# Run nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
