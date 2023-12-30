FROM selenium/standalone-chrome

WORKDIR /app

USER root
RUN curl -fsSL https://bun.sh/install | BUN_INSTALL=/usr bash

COPY . .

RUN bun i
RUN bunx node-prune

ENV TZ="Asia/Singapore"
CMD bun start