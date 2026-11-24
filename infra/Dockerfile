FROM node:24-alpine AS dev
RUN apk add --no-cache git
WORKDIR /app
RUN chown node:node /app
USER node
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci
COPY --chown=node:node . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]

FROM dev AS build
ARG VITE_GITHUB_AUTH_URL
ARG VITE_GITHUB_APP_SLUG
RUN npm run build

# ponytail: stock nginx image (root master, unprivileged workers); switch to nginx-unprivileged if the host requires non-root containers.
FROM nginx:1-alpine AS prod
ENV ZMK_CONNECT_SOURCES="'none'"
ENV NGINX_ENVSUBST_FILTER="^ZMK_CONNECT_SOURCES$"
COPY infra/nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
