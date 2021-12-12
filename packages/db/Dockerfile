FROM toleg/postgres_mysql_fdw:13.3_fdw2.6.0

COPY ./init/ /docker-entrypoint-initdb.d/
COPY ./scripts/prod_setup.sh /docker-entrypoint-initdb.d/000000_setup.sh

RUN ls /docker-entrypoint-initdb.d
