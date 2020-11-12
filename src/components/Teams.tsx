import React from 'react';
import { Box, Text, TextInput } from 'grommet';
import _ from 'lodash';

import { getPlayerPosition, getLineup } from 'state/game/selectors';
import { TeamRole } from 'state/game/types';
import { getShortPlayerName } from 'state/players/selectors';
import { useAppSelector } from 'utils/hooks';

const LineupPlayer = ({ playerId }: { playerId: string }) => {
  const name = useAppSelector(state => getShortPlayerName(state, playerId));
  const position = useAppSelector(state => getPlayerPosition(state, playerId));

  return (
    <Box direction="row">
      <Box>
        <Text>{name}</Text>
      </Box>
      <Box width="xxsmall">{position}</Box>
    </Box>
  );
};

const Lineup = ({ team }: { team: TeamRole }) => {
  const players = useAppSelector(state => getLineup(state, team));

  return (
    <Box>
      <TextInput />
      <Box direction="row">
        <Box width="xxsmall">
          {_.range(1, 11).map(lineupSpot => (
            <Box height="xxsmall" justify="center">
              <Text>{lineupSpot}</Text>
            </Box>
          ))}
        </Box>
        <Box>
          {players.map(playerId => (
            <LineupPlayer playerId={playerId} />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

const Teams = () => {
  return (
    <Box direction="row" justify="around">
      <Lineup team={TeamRole.AWAY} />
      <Lineup team={TeamRole.HOME} />
    </Box>
  );
};

export default Teams;
