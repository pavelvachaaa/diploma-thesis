FROM node:22-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends libssl3 \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev
RUN ln -sfn dockerubuntux64 /app/node_modules/@intersystems/intersystems-iris-native/bin/lnxrhx64

COPY src ./src

ENV NODE_ENV=production
ENV QUAL_ADAPTER_PORT=8088

EXPOSE 8088

CMD ["node", "src/index.js"]
