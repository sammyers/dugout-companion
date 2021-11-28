import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { GameInput } from '@sammyers/dc-shared';
import { getGameForMutation } from 'state/game/selectors';
import { AppDispatch, AppState } from 'state/store';

const { actions: unsavedGameActions, reducer } = createSlice({
  name: 'unsavedGames',
  initialState: {} as Record<string, GameInput>,
  reducers: {
    addUnsavedGame(state, action: PayloadAction<GameInput>) {
      state[action.payload.id!] = action.payload;
    },
    clearUnsavedGame(state, action: PayloadAction<string>) {
      delete state[action.payload];
    },
  },
});

export { unsavedGameActions };

export default reducer;

export const stashCurrentGameToSaveLater =
  () => (dispatch: AppDispatch, getState: () => AppState) => {
    const gameToStash = getGameForMutation(getState());
    dispatch(unsavedGameActions.addUnsavedGame(gameToStash));
  };
