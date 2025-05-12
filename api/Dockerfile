FROM node:23-slim

WORKDIR /src/app

COPY package*.json ./
COPY tsconfig*.json ./

RUN npm install
RUN npm install pg --save
RUN npm i -g @nestjs/cli

COPY . .

CMD ["npm", "run", "start"]

EXPOSE 3000