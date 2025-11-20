# Stage 1: Build Angular App
FROM node:22.11.0 AS build

WORKDIR /project

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm ci

ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_ENDPOINT_BACKEND
ARG VITE_SITE_KEY

RUN echo "VITE_SUPABASE_URL=$VITE_SUPABASE_URL" > .env && \
    echo "VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY" >> .env && \
    echo "VITE_ENDPOINT_BACKEND=$VITE_ENDPOINT_BACKEND" >> .env && \
    echo "VITE_SITE_KEY=$VITE_SITE_KEY" >> .env

COPY . ./

# Build the Angular app (without SSR)
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:1.25.2-alpine

WORKDIR /usr/share/nginx/html

# Remove default static content
RUN rm -rf ./*

# Copy built Angular files from the previous stage
COPY --from=build /project/.env .
COPY --from=build /project/dist/ .

# Copy a custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose the default HTTP port
EXPOSE 90

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
