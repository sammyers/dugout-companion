#!/bin/bash
source ../../prod.env
for f in ./migrations/committed/*
do
  DATABASE_URL=$DATABASE_URL \
  DATABASE_NAME=$DATABASE_NAME \
  DATABASE_OWNER=$DATABASE_OWNER \
  DATABASE_VISITOR=$DATABASE_VISITOR \
  DATABASE_AUTHENTICATOR=$DATABASE_AUTHENTICATOR \
  node node_modules/.bin/graphile-migrate compile $f > ./init/$(basename $f)
done
