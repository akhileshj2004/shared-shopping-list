# Stage 1: Build the React app
FROM node:18-alpine as build-stage

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

# --- ADD THESE TWO LINES HERE ---
ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=${REACT_APP_BACKEND_URL}
# --------------------------------

# Build the React app for production
# REACT_APP_BACKEND_URL is passed as a build argument in docker-compose.yml
RUN npm run build

# Stage 2: Serve the app with Nginx
FROM nginx:alpine as production-stage

# Remove default Nginx welcome page
RUN rm /etc/nginx/conf.d/default.conf

# Add custom Nginx configuration to serve React app
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built React app from the build-stage
COPY --from=build-stage /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
