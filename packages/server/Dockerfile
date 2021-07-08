FROM node:alpine

# Set Node.js app folder
RUN mkdir -p /home/node/app/node_modules
WORKDIR /home/node/app

# Copy dependencies
COPY ./package*.json .
RUN chown -R node:node /home/node/app

# Install dependencies
USER node
RUN npm install

# Copy application files
COPY --chown=node:node ./build .

EXPOSE 8080
CMD [ "node", "server.js" ]