import React, { FC, useCallback, useState } from 'react';
import { Button } from 'grommet';
import { Save, StatusGood, WifiNone } from 'grommet-icons';
import _ from 'lodash';
import { useStore } from 'react-redux';

import { Spinner, useCreateGameMutation } from '@sammyers/dc-shared';

import { getGameForMutation, getGameName, wasGameSaved } from 'state/game/selectors';
import { gameActions } from 'state/game/slice';
import { getUnsavedGames } from 'state/unsavedGames/selectors';
import { unsavedGameActions } from 'state/unsavedGames/slice';
import { useAppDispatch, useAppSelector, useSyncAllPlayers } from 'utils/hooks';
import { useNetworkStatus } from 'utils/network';

import { AppState } from 'state/store';

interface Props {
  disabled?: boolean;
}

const SaveGameButton: FC<Props> = ({ disabled }) => {
  const dispatch = useAppDispatch();

  const online = useNetworkStatus();

  const { getState } = useStore<AppState>();

  const [success, setSuccess] = useState(false);
  const saved = useAppSelector(wasGameSaved);
  const gameName = useAppSelector(getGameName);

  const [createGame, { loading: createGameLoading, error: createGameError }] =
    useCreateGameMutation({
      onCompleted: result => {
        if (result.createGame?.game) {
          setSuccess(true);
        }
      },
      errorPolicy: 'all',
    });
  const syncAllPlayers = useSyncAllPlayers();

  if (createGameError) {
    console.log(createGameError);
  }

  const handleClick = useCallback(async () => {
    await syncAllPlayers();
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
  }, [getState, syncAllPlayers, createGame, dispatch]);

  return (
    <Button
      color="light-2"
      plain={false}
      primary={success || saved}
      disabled={disabled || !online || success || saved || !gameName}
      icon={
        success || saved ? (
          <StatusGood />
        ) : createGameLoading ? (
          <Spinner />
        ) : !online ? (
          <WifiNone />
        ) : (
          <Save />
        )
      }
      label="Save Game"
      onClick={handleClick}
    />
  );
};

export default SaveGameButton;
