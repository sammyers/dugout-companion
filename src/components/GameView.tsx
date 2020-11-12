import React from 'react';
import { Tabs, Tab } from 'grommet';

import Bases from './Bases';
import Teams from './Teams';

const GameView = () => {
  return (
    <Tabs flex>
      <Tab title="Teams">
        <Teams />
      </Tab>
      <Tab title="Field View">
        <Bases />
      </Tab>
    </Tabs>
  );
};

export default GameView;
