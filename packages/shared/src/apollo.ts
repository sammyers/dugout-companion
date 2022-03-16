import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from '@apollo/client';
import { parse } from 'cookie';

import { AUTH_TOKEN_NAME } from './hooks';

export const createApolloClient = () => {
  const authMiddleWare = new ApolloLink((operation, forward) => {
    const { [AUTH_TOKEN_NAME]: authToken } = parse(document.cookie);
    if (authToken) {
      operation.setContext({
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });
    }

    return forward(operation);
  });

  const httpLink = new HttpLink({ uri: '/graphql' });
  const cache = new InMemoryCache();

  return new ApolloClient({
    link: authMiddleWare.concat(httpLink),
    cache,
  });
};
