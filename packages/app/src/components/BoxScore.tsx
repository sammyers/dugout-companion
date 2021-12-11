import React, { FC } from 'react';
import { Box, Card, DataTable, Text } from 'grommet';
import { Navigate } from 'react-router-dom';

import { getPositionAbbreviation, TeamRole } from '@sammyers/dc-shared';

import { isGameInProgress, getPlayerPosition, isGameOver } from 'state/game/selectors';
import { getShortPlayerName } from 'state/players/selectors';
import { getBoxScore } from 'state/stats/selectors';
import { useAppSelector } from 'utils/hooks';

import { BoxScoreRow } from 'state/stats/types';

interface NameCellProps {
  playerId: string;
  lineupSpot: number;
}

const NameCell: FC<NameCellProps> = ({ playerId, lineupSpot }) => {
  const name = useAppSelector(state => getShortPlayerName(state, playerId));
  const position = useAppSelector(state => getPlayerPosition(state, playerId));

  return (
    <Box direction="row" align="center" gap="xsmall">
      <Text size="small" color="dark-3">
        {lineupSpot}
      </Text>
      <Text weight="bold" style={{ whiteSpace: 'nowrap' }}>
        {name}
      </Text>
      <Text style={{ fontStyle: 'italic' }}>
        {position ? getPositionAbbreviation(position) : ''}
      </Text>
    </Box>
  );
};

interface TeamBoxScoreProps {
  rows: BoxScoreRow[];
  team: TeamRole;
}

const TeamBoxScore: FC<TeamBoxScoreProps> = ({ rows, team }) => {
  return (
    <Card pad="small" background="light-1" margin="small">
      <DataTable<BoxScoreRow>
        margin="small"
        columns={[
          {
            property: 'playerId',
            header: <Text>{team === TeamRole.AWAY ? 'Away' : 'Home'} Batters</Text>,
            primary: true,
            render: ({ playerId, lineupSpot }) => (
              <NameCell playerId={playerId} lineupSpot={lineupSpot} />
            ),
          },
          { property: 'atBats', header: 'AB' },
          { property: 'runsScored', header: 'R' },
          { property: 'hits', header: 'H' },
          { property: 'doubles', header: '2B' },
          { property: 'triples', header: '3B' },
          { property: 'homeRuns', header: 'HR' },
          { property: 'runsBattedIn', header: 'RBI' },
          { property: 'walks', header: 'BB' },
          { property: 'leftOnBase', header: 'LOB' },
          { property: 'battingAverage', header: 'AVG' },
          { property: 'onBasePlusSlugging', header: 'OPS' },
        ]}
        data={rows}
      />
    </Card>
  );
};

const BoxScore = () => {
  const gameInProgress = useAppSelector(isGameInProgress);
  const gameOver = useAppSelector(isGameOver);
  const [awayStats, homeStats] = useAppSelector(getBoxScore);

  if (!(gameOver || gameInProgress)) {
    return <Navigate to="/teams" />;
  }

  return (
    <Box flex direction="row" wrap justify="around" align="center">
      <TeamBoxScore rows={awayStats} team={TeamRole.AWAY} />
      <TeamBoxScore rows={homeStats} team={TeamRole.HOME} />
    </Box>
  );
};

export default BoxScore;
