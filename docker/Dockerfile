FROM node:12-alpine3.10

COPY ./ /app

WORKDIR /app
RUN npm i --only=prod

EXPOSE 3000
CMD ["node","index.js"]
