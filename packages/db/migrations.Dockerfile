FROM ubuntu:20.04

ARG NODEJS_VERSION=17
ARG POSTGRES_VERSION=12

RUN apt-get update && \
    apt-get install -y \
    curl

# Install postgres client tools
RUN apt-get update && \
    apt-get install -y \
    postgresql-client-${POSTGRES_VERSION}

# Install nodejs via nodesource.
RUN curl -fsSL https://deb.nodesource.com/setup_${NODEJS_VERSION}.x | bash -
RUN apt-get install -y nodejs

# Latest version of graphile-migrate
RUN npm install -g graphile-migrate

# Install wait script so we can run only once the db is up
ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.9.0/wait /wait
RUN chmod +x /wait

WORKDIR /migrate

COPY ./migrations/committed /migrate/migrations/committed
COPY ./.gmrc /migrate/.gmrc

ENTRYPOINT ["sh", "-c", "/wait && /usr/bin/graphile-migrate migrate"]
