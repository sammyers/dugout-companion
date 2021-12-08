import { useCreatePlayerMutation } from '@sammyers/dc-shared';
import _ from 'lodash';
import { useEffect, EffectCallback } from 'react';
import { useDispatch, createSelectorHook, useStore } from 'react-redux';

import { getUnsyncedPlayers } from 'state/players/selectors';
import { playerActions } from 'state/players/slice';

import { AppState, AppDispatch } from 'state/store';

// eslint-disable-next-line
export const useMount = (effect: EffectCallback) => useEffect(effect, []);

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = createSelectorHook<AppState>();

export const useSyncAllPlayers = () => {
  const dispatch = useAppDispatch();
  const { getState } = useStore<AppState>();
  const [createPlayer] = useCreatePlayerMutation();

  return async () => {
    const unsyncedPlayers = getUnsyncedPlayers(getState());
    if (_.size(unsyncedPlayers)) {
      for (let playerId in unsyncedPlayers) {
        const { data } = await createPlayer({ variables: unsyncedPlayers[playerId] });
        if (data?.createPlayer?.player) {
          dispatch(playerActions.syncPlayer(data.createPlayer.player.id));
        }
      }
    }
  };
};
