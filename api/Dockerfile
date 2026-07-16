# Debian slim (glibc) rather than alpine: the only native dependency is
# better-sqlite3, which ships prebuilt glibc binaries — no musl compilation.
# Prisma 7 has no query-engine binary, so no engine binary targets are needed.

# ---- build stage ----
FROM node:22-bookworm-slim AS build
WORKDIR /app
# Fallback toolchain in case better-sqlite3 lacks a prebuilt binary for this platform.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
# Schema + config are needed by the postinstall `prisma generate`, so copy them
# before installing.
COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci
COPY . .
RUN npm run build

# ---- runtime stage ----
FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
# Reuse the already-installed prod deps (incl. the compiled better-sqlite3 binary
# and the prisma CLI used by `migrate deploy`), then drop dev deps. Avoids
# recompiling the native module in the runtime stage.
COPY --from=build /app/node_modules ./node_modules
RUN npm prune --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 3000
# start:prod runs `prisma migrate deploy` (applies pending migrations to the
# mounted SQLite volume, never dropping data) then boots the server.
CMD ["npm", "run", "start:prod"]
