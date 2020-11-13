import React from 'react';
import { Main } from 'grommet';

import GameView from './GameView';
import { useMount, useAppDispatch } from 'utils/hooks';
import { players } from 'state/players/testData';
import { addPlayer } from 'state/players/slice';

const App = () => {
  const dispatch = useAppDispatch();

  useMount(() => {
    players.forEach(player => {
      const [firstName, lastName] = player.split(' ');
      dispatch(addPlayer({ firstName, lastName }));
    });
  });

  return (
    <Main fill>
      <GameView />
    </Main>
  );
};

export default App;
