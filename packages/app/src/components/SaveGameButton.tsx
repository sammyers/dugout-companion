import React, { useCallback } from 'react';
import { Button } from 'grommet';

import { useCreateEmptyGameMutation, useFillInGameEventsMutation } from '@dugout-companion/shared';

import { getGameEventRecordsForMutation, getGameForMutation } from 'state/game/selectors';
import { useAppDispatch, useAppSelector } from 'utils/hooks';
import { gameActions } from 'state/game/slice';
import { CreatedLineups } from 'state/game/types';

const SaveGameButton = () => {
  const dispatch = useAppDispatch();

  const game = useAppSelector(getGameForMutation);

  const [createGame] = useCreateEmptyGameMutation();
  const [fillInEvents] = useFillInGameEventsMutation();

  const handleClick = useCallback(async () => {
    const { data } = await createGame({ variables: { input: { game } } });
    if (data && data.createGame && data.createGame.game) {
      dispatch(async (dispatch, getState) => {
        dispatch(gameActions.substituteLineupIds(data.createGame!.game as CreatedLineups));
        const patch = getGameEventRecordsForMutation(getState());
        console.log(patch);
        await fillInEvents({
          variables: {
            input: {
              id: data.createGame!.game!.id,
              patch,
            },
          },
        });
      });
    }
  }, [game, createGame, fillInEvents, dispatch]);

  return <Button color="light-2" plain={false} label="Save Game" onClick={handleClick} />;
};

export default SaveGameButton;
