FROM node:20-alpine AS build
WORKDIR /app
COPY package.json ./
COPY package-lock.json ./
RUN npm install
COPY .eslintignore ./
COPY .eslintrc.cjs ./
COPY .npmrc ./
COPY .prettierignore ./
COPY .prettierrc ./
COPY postcss.config.cjs ./
COPY svelte.config.js ./
COPY tailwind.config.ts ./
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY static/ ./static/
COPY src/ ./src/
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "build"]
