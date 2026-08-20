# syntax=docker/dockerfile:1

# ---------- Build stage ----------
FROM node:22-alpine AS build

WORKDIR /app

ENV NODE_ENV=production

# Install dependencies using the committed yarn.lock for reproducible builds.
COPY package.json yarn.lock ./
RUN corepack enable \
    && yarn install --frozen-lockfile

# Build the Nuxt app (produces .output/).
COPY . .
RUN yarn build

# ---------- Runtime stage ----------
FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production \
    NUXT_HOST=0.0.0.0 \
    NUXT_PORT=3000 \
    PORT=3000

# Only the compiled server output is needed at runtime.
COPY --from=build /app/.output ./.output

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
