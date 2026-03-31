FROM node:22-alpine

WORKDIR /workspace

COPY package.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/contracts/package.json ./packages/contracts/package.json
COPY packages/contracts/src ./packages/contracts/src
RUN npm install

COPY apps/web ./apps/web

WORKDIR /workspace/apps/web

CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0", "--port", "3000"]
