import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
// import { WebSocketLink } from '@apollo/client/link/ws';
// import { getMainDefinition } from '@apollo/client/utilities';
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistCombineReducers } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import game from './game/slice';
import history from './history/slice';
import players from './players/slice';
import prompts from './prompts/slice';
import unsavedGames from './unsavedGames/slice';

const reducer = persistCombineReducers(
  { key: 'root', storage },
  {
    game,
    history,
    players,
    prompts,
    unsavedGames,
  }
);

const httpLink = new HttpLink({ uri: '/graphql' });

// const wsLink = new WebSocketLink({
//   uri: isDev ? 'ws://localhost:4000/graphql' : `wss://${window.location.host}/graphql`,
//   options: {
//     reconnect: true,
//   },
// });

// const splitLink = split(
//   ({ query }) => {
//     const definition = getMainDefinition(query);
//     return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
//   },
//   wsLink,
//   httpLink
// );

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});

export const store = configureStore({
  reducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      thunk: { extraArgument: apolloClient },
      serializableCheck: false,
      immutableCheck: false,
    }),
});
export const persistor = persistStore(store);

export interface AppState extends ReturnType<typeof store.getState> {}
export type AppDispatch = typeof store.dispatch;
