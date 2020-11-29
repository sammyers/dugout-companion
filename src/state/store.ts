import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit';
import { persistStore, persistCombineReducers } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import game from './game/slice';
import players from './players/slice';
import prompts from './prompts/slice';

const reducer = persistCombineReducers(
  { key: 'root', storage },
  {
    game,
    players,
    prompts,
  }
);

export const store = configureStore({
  reducer,
  middleware: getDefaultMiddleware({ serializableCheck: false, immutableCheck: false }),
});
export const persistor = persistStore(store);

export type AppState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
