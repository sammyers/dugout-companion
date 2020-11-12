import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit';
import { persistStore, persistCombineReducers } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import game from './game/slice';
import players from './players/slice';

const reducer = persistCombineReducers(
  {
    key: 'root',
    storage,
    blacklist: ['game'],
  },
  {
    game,
    players,
  }
);

export const store = configureStore({
  reducer,
  middleware: getDefaultMiddleware({ serializableCheck: false }),
});
export const persistor = persistStore(store);

export type AppState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
