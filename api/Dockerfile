FROM node:23-slim

WORKDIR /src/app

COPY package*.json ./
COPY tsconfig*.json ./

RUN npm install
RUN npm install pg --save

COPY . .

CMD ["npm", "run", "start"]

EXPOSE 3000