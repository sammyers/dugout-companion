import express from 'express';
import { ApolloServer } from 'apollo-server-express';

import { typeDefs } from '@dugout-companion/shared';

import { resolvers } from './resolvers';

const app = express();
const server = new ApolloServer({ resolvers, typeDefs });
server.applyMiddleware({ app });

app.listen(4000, () => {
  console.log('Server running');
});
