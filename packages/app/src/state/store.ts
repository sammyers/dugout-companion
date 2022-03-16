import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistCombineReducers } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import game from './game/slice';
import groups from './groups/slice';
import history from './history/slice';
import players from './players/slice';
import prompts from './prompts/slice';
import unsavedGames from './unsavedGames/slice';

const reducer = persistCombineReducers(
  { key: 'root', storage },
  {
    game,
    groups,
    history,
    players,
    prompts,
    unsavedGames,
  }
);

export const store = configureStore({
  reducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false,
    }),
});
export const persistor = persistStore(store);

export interface AppState extends ReturnType<typeof store.getState> {}
export type AppDispatch = typeof store.dispatch;
