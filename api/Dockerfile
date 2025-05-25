FROM node:23-slim

WORKDIR /src/app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm install && \
    npm install pg --save && \
    npm i -g @nestjs/cli

# Copy configuration files
COPY tsconfig*.json ./
COPY . .

CMD ["npm", "run", "start", "&&", "npm", "i"]


EXPOSE 3000