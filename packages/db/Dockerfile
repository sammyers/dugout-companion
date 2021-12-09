FROM toleg/postgres_mysql_fdw

COPY ./init/ /docker-entrypoint-initdb.d/
COPY ./scripts/prod_setup.sh /docker-entrypoint-initdb.d/000000_setup.sh

RUN ls /docker-entrypoint-initdb.d
