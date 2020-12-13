import React, { useCallback } from 'react';
import { Button } from 'grommet';

import { useCreateEmptyGameMutation, useFillInGameEventsMutation } from '@dugout-companion/shared';

const SaveGameButton = () => {
  const [createGame] = useCreateEmptyGameMutation();

  const handleClick = useCallback(() => {
    // createGame({ variables: {
    //   input: {
    //     game: {
    //     }
    //   }
    // }})
  }, []);

  return <Button color="light-2" plain={false} label="Save Game" onClick={handleClick} />;
};

export default SaveGameButton;
