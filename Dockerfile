# Stage 1: Install dependencies, generate Prisma client, and compile TypeScript
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN npm run build

# Stage 2: Minimal production runtime
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV UPLOAD_DIR=/app/uploads

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/dist ./dist
COPY prisma ./prisma

RUN mkdir -p /app/uploads && chown -R node:node /app
USER node

EXPOSE 3000
VOLUME ["/app/uploads"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/src/main.js"]

