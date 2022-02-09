import { useAddPlayerToGroupMutation, useCreatePlayerMutation } from '@sammyers/dc-shared';
import _ from 'lodash';
import { useEffect, EffectCallback, useCallback } from 'react';
import { useDispatch, createSelectorHook, useStore } from 'react-redux';

import { getUnsyncedMemberships, getUnsyncedPlayers } from 'state/players/selectors';
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
  const [addPlayerToGroup] = useAddPlayerToGroupMutation();

  const syncAllPlayers = useCallback(async () => {
    console.log('syncing players');
    const unsyncedPlayers = getUnsyncedPlayers(getState());
    const unsyncedMemberships = getUnsyncedMemberships(getState());
    if (_.size(unsyncedPlayers)) {
      for (let playerId in unsyncedPlayers) {
        const { groups, ...player } = unsyncedPlayers[playerId];
        const { data } = await createPlayer({
          variables: {
            input: { player: { ...player, playerGroupMemberships: { create: groups } } },
          },
        });
        if (data?.createPlayer?.player) {
          dispatch(playerActions.syncPlayer(data.createPlayer.player.id));
        }
      }
    }
    if (unsyncedMemberships.length) {
      for (let membership of unsyncedMemberships) {
        await addPlayerToGroup({ variables: membership });
        dispatch(playerActions.syncMembership(membership));
      }
    }
  }, [dispatch, getState, createPlayer, addPlayerToGroup]);

  return syncAllPlayers;
};
