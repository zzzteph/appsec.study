FROM node:20-slim AS build
ENV NG_CLI_ANALYTICS=false
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist/site/browser /usr/share/nginx/html
EXPOSE 80
