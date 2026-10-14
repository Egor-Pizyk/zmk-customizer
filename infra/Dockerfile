FROM node:24-alpine AS dev
WORKDIR /app
RUN chown node:node /app
USER node
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci
COPY --chown=node:node . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]

FROM dev AS build
RUN npm run build

# ponytail: stock nginx image (root master, unprivileged workers); switch to nginx-unprivileged if the host requires non-root containers.
FROM nginx:1-alpine AS prod
COPY infra/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
