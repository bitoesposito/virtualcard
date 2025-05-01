FROM node:23-slim

WORKDIR /frontend/src/app

COPY package*.json ./

RUN npm install
RUN npm install -g @angular/cli@19.2.7

COPY . .

RUN npm run build

EXPOSE 4200