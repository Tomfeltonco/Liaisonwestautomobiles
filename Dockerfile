FROM node:20

WORKDIR /app

COPY . .

RUN npm install -g pnpm
RUN pnpm install --no-frozen-lockfile

RUN pnpm --filter @workspace/liaison-west build

EXPOSE 3000

CMD ["pnpm", "start"]
