FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY .eslintignore .eslintrc.cjs .npmrc .prettierignore .prettierrc postcss.config.cjs svelte.config.js tailwind.config.ts tsconfig.json vite.config.ts ./
COPY static/ ./static/
COPY src/ ./src/
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY package.json package-lock.json ./
EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "build"]
