# Multi-stage build for React (Vite) frontend

# Stage 1: Build the production bundle
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependency specifications and install cleanly
COPY package.json package-lock.json ./
RUN npm ci

# Copy source files
COPY . .

# Build argument for backend API URL
# Render makes configured environment variables available as build arguments (ARG)
ARG VITE_API_URL=http://localhost:8080
ENV VITE_API_URL=$VITE_API_URL

# Build Vite application into /app/dist
RUN npm run build

# Stage 2: Serve static production assets with Nginx
FROM nginx:alpine

# Default container PORT for local runs (Render injects PORT at runtime)
ENV PORT=80

# Copy Nginx server configuration template
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static files
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# Replace PORT placeholder with current runtime PORT and start Nginx
CMD ["/bin/sh", "-c", "sed -i \"s/PORT_PLACEHOLDER/${PORT:-80}/g\" /etc/nginx/conf.d/default.conf && exec nginx -g 'daemon off;'"]
