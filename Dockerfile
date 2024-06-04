
# Installing dependencies:

FROM node:20.5.1-alpine3.17 AS install-dependencies

WORKDIR /user/src/app

COPY package.json package-lock.json ./

RUN npm install -g npm@7

RUN export NODE_OPTIONS=--max_old_space_size=4096


# Install the application dependencies
RUN npm ci
COPY . .

# Copy the certificate and key files
COPY cert.pem privateKey.key publicKey.pem ./


# Creating a build:

FROM node:20.5.1-alpine3.17 AS create-build

WORKDIR /user/src/app

COPY --from=install-dependencies /user/src/app ./

RUN npm run build

USER node


# Running the application:

FROM node:20.5.1-alpine3.17 AS run

WORKDIR /user/src/app

COPY --from=install-dependencies /user/src/app/node_modules ./node_modules
COPY --from=create-build /user/src/app/dist ./dist
COPY package.json ./

# Copy the certificate and key files
COPY cert.pem privateKey.key publicKey.pem ./

CMD ["npm", "run", "start:prod"]

