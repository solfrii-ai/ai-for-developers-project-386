FROM node:24.22.3-bookworm-slim AS build

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json

RUN corepack enable && corepack prepare pnpm@12.17.0 --activate
RUN pnpm install --frozen-lockfile

COPY apps apps

RUN pnpm --filter frontend build
RUN pnpm --filter backend build
RUN pnpm --filter backend deploy --prod /out

FROM node:24.22.3-bookworm-slim

ENV NODE_ENV=production
ENV STATIC_DIR=/app/public
ENV PORT=3000

WORKDIR /app

COPY --from=build /out /app
COPY --from=build /app/apps/backend/dist /app/dist
COPY --from=build /app/apps/frontend/dist /app/public

EXPOSE 3000

CMD ["node", "dist/server.js"]
