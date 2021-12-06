import React, { useCallback, useState } from 'react';
import { Button } from 'grommet';
import { StatusGood, WifiNone } from 'grommet-icons';
import _ from 'lodash';
import { useStore } from 'react-redux';

import { Spinner, useCreateGameMutation, useCreatePlayerMutation } from '@sammyers/dc-shared';

import { getGameForMutation, getGameName, wasGameSaved } from 'state/game/selectors';
import { gameActions } from 'state/game/slice';
import { getUnsyncedPlayers } from 'state/players/selectors';
import { playerActions } from 'state/players/slice';
import { getUnsavedGames } from 'state/unsavedGames/selectors';
import { unsavedGameActions } from 'state/unsavedGames/slice';
import { useAppDispatch, useAppSelector } from 'utils/hooks';
import { useNetworkStatus } from 'utils/network';

import { AppState } from 'state/store';

const SaveGameButton = () => {
  const dispatch = useAppDispatch();

  const online = useNetworkStatus();

  const { getState } = useStore<AppState>();

  const [success, setSuccess] = useState(false);
  const saved = useAppSelector(wasGameSaved);
  const gameName = useAppSelector(getGameName);

  const [createGame, { loading: createGameLoading }] = useCreateGameMutation({
    onCompleted: () => setSuccess(true),
  });
  const [createPlayer] = useCreatePlayerMutation();

  const handleClick = useCallback(async () => {
    const unsyncedPlayers = getUnsyncedPlayers(getState());
    if (_.size(unsyncedPlayers)) {
      for (let playerId in unsyncedPlayers) {
        const { data } = await createPlayer({ variables: unsyncedPlayers[playerId] });
        if (data?.createPlayer?.player) {
          dispatch(playerActions.syncPlayer(data.createPlayer.player.id));
        }
      }
    }
    const unsavedGames = getUnsavedGames(getState());
    _.forEach(unsavedGames, async game => {
      const { data } = await createGame({ variables: { input: { game } } });
      if (data?.createGame?.game) {
        dispatch(unsavedGameActions.clearUnsavedGame(data.createGame.game.id));
      }
    });
    const game = getGameForMutation(getState());
    const { data } = await createGame({ variables: { input: { game } } });
    if (data?.createGame?.game) {
      dispatch(gameActions.setGameSaved());
    }
  }, [getState, createPlayer, createGame, dispatch]);

  return (
    <Button
      color="light-2"
      plain={false}
      primary={success || saved}
      disabled={!online || success || saved || !gameName}
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
