import React, { useCallback, useState } from 'react';
import { Button } from 'grommet';
import { StatusGood, WifiNone } from 'grommet-icons';
import _ from 'lodash';
import { useStore } from 'react-redux';

import { useCreateGameMutation, useCreatePlayerMutation } from '@sammyers/dc-shared';

import Spinner from './icons/Spinner';

import { getGameForMutation, wasGameSaved } from 'state/game/selectors';
import { gameActions } from 'state/game/slice';
import { getUnsyncedPlayers } from 'state/players/selectors';
import { playerActions } from 'state/players/slice';
import { useAppDispatch, useAppSelector } from 'utils/hooks';
import { useNetworkStatus } from 'utils/network';

import { AppState } from 'state/store';

const SaveGameButton = () => {
  const dispatch = useAppDispatch();

  const online = useNetworkStatus();

  const { getState } = useStore<AppState>();

  const [success, setSuccess] = useState(false);
  const saved = useAppSelector(wasGameSaved);

  const [createGame, { loading: createGameLoading }] = useCreateGameMutation({
    onCompleted: () => setSuccess(true),
  });
  const [createPlayer] = useCreatePlayerMutation();

  const handleClick = useCallback(async () => {
    const unsyncedPlayers = getUnsyncedPlayers(getState());
    if (_.size(unsyncedPlayers)) {
      for (let offlineId in unsyncedPlayers) {
        const { firstName, lastName } = unsyncedPlayers[offlineId];
        const { data } = await createPlayer({ variables: { firstName, lastName } });
        if (data?.createPlayer?.player) {
          dispatch(playerActions.syncPlayer({ offlineId, id: data.createPlayer.player.id }));
        }
      }
    }
    const game = getGameForMutation(getState());
    const { data } = await createGame({ variables: { input: { game } } });
    if (data && data.createGame && data.createGame.game) {
      dispatch(gameActions.setGameSaved());
    }
  }, [getState, createPlayer, createGame, dispatch]);

  return (
    <Button
      color="light-2"
      plain={false}
      primary={success || saved}
      disabled={!online || success || saved}
      icon={
        success || saved ? (
          <StatusGood />
        ) : createGameLoading ? (
          <Spinner />
        ) : !online ? (
          <WifiNone />
        ) : undefined
      }
      label="Save Game"
      onClick={handleClick}
    />
  );
};

export default SaveGameButton;
