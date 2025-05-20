FROM node:23-slim

WORKDIR /frontend

COPY package*.json ./

RUN npm install
RUN npm install -g @angular/cli@19.2.10

EXPOSE 4200

CMD ["ng", "serve", "--host", "0.0.0.0", "--disable-host-check", "--poll", "2000"]