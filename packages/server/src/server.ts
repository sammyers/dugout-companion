import express from 'express';
import postgraphile from 'postgraphile';
import SimplifyInflectorPlugin from '@graphile-contrib/pg-simplify-inflector';
import NestedMutationsPlugin from 'postgraphile-plugin-nested-mutations';

const isDev = process.env.NODE_ENV === 'development';

const app = express();

const middleware = postgraphile(process.env.AUTH_DATABASE_URL, 'public', {
  appendPlugins: [SimplifyInflectorPlugin, NestedMutationsPlugin],
  watchPg: isDev,
  graphiql: isDev || !!process.env.ENABLE_GRAPHIQL,
  enhanceGraphiql: true,
  ownerConnectionString: process.env.DATABASE_URL,
  extendedErrors: [
    'severity',
    'detail',
    'hint',
    'position',
    'internalPosition',
    'internalQuery',
    'where',
    'schema',
    'table',
    'column',
    'dataType',
    'constraint',
  ],
  simpleCollections: 'only',
  pgSettings: {
    role: process.env.DATABASE_VISITOR,
  },
  graphileBuildOptions: {
    pgOmitListSuffix: true,
    nestedMutationsSimpleFieldNames: true,
  },
  exportGqlSchemaPath: isDev ? `${__dirname}/../../shared/schema.graphql` : undefined,
  enableCors: true,
});
app.use(middleware);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
