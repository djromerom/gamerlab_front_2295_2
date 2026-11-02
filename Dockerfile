# Production multi-stage Dockerfile for React + Vite + TypeScript
# Build stage: installs dependencies and builds the Vite app
FROM node:22.11.0 AS build

WORKDIR /app

# Copy package manifests first to use Docker cache for deps
COPY package*.json ./
COPY package-lock.json ./       

# Install dependencies
RUN npm ci --silent

# Copy the rest of the source code and build
COPY . .

# Build-time env vars (passed as --build-arg). These will be written to a .env
# so Vite can replace import.meta.env.VITE_* during build.
# BuildKit secrets are NOT part of the layer cache key, so VITE_VARS_HASH (a hash of the
# secret values, computed by the pipeline) invalidates this layer when they change.
# Without it a cached build could ship a bundle with stale VITE_* values.
ARG VITE_VARS_HASH=none
RUN --mount=type=secret,id=VITE_ENDPOINT_BACKEND,env=VITE_ENDPOINT_BACKEND \
    --mount=type=secret,id=VITE_SITE_KEY,env=VITE_SITE_KEY \
    echo "VITE vars hash: ${VITE_VARS_HASH}" && npm run build

## Production stage: nginx serving the built files
FROM nginx:1.25.2-alpine AS prod

# Remove default static content
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*

# Copy built files from previous stage
COPY --from=build /app/dist/ .

COPY nginx.conf /etc/nginx/conf.d/default.conf


# Expose the port that nginx listens to (nginx.conf listens on 5173)
EXPOSE 80

# Run nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
