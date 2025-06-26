# Step 1: Build frontend using Node
FROM node:18 AS build

WORKDIR /app
COPY . .
RUN npm install --legacy-peer-deps
RUN npm run build

# Step 2: Serve it using NGINX
FROM nginx:stable-alpine

COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
