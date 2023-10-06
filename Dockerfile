# stage build
FROM node:alpine3.18
WORKDIR /builder

# copy everything to the container
COPY . .
# clean install all dependencies
RUN npm ci
# build remix app
RUN npm run build

# stage run
FROM alpine:3.18.3
WORKDIR /app
RUN apk add --update npm
# copy dependency list
COPY --from=0 /builder/package*.json ./
# clean install dependencies, no devDependencies, no prepare script
RUN npm ci --omit=dev --ignore-scripts
# copy artifact to /app
COPY --from=0 /builder/build ./build
COPY --from=0 /builder/public/build ./public/build
EXPOSE 3000
CMD ["npm", "run", "start"]
