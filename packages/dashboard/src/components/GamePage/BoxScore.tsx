import React, { FC, useMemo } from 'react';
import { Box, ColumnConfig, DataTable, Text } from 'grommet';

import {
  FieldingPosition,
  GetGameDetailsQuery,
  getPositionAbbreviation,
} from '@sammyers/dc-shared';

type BoxScoreLine = NonNullable<NonNullable<GetGameDetailsQuery['game']>['boxScore']>[number];

interface Props {
  teams: NonNullable<GetGameDetailsQuery['game']>['teams'];
  boxScoreLines: BoxScoreLine[];
}

interface PlayerBoxScoreRow extends NonNullable<BoxScoreLine> {
  name: string;
  playerId: string;
  position: FieldingPosition;
}

const columns: ColumnConfig<PlayerBoxScoreRow>[] = [
  {
    property: 'name',
    header: 'Player',
    render: row => (
      <Box direction="row" align="center" gap="xsmall">
        <Text weight="bold">{row.name}</Text>
        <Text size="small" color="dark-3">
          {getPositionAbbreviation(row.position)}
        </Text>
      </Box>
    ),
  },
  {
    property: 'atBats',
    header: 'AB',
  },
  {
    property: 'runs',
    header: 'R',
  },
  {
    property: 'hits',
    header: 'H',
  },
  {
    property: 'rbi',
    header: 'RBI',
  },
  {
    property: 'walks',
    header: 'BB',
  },
  {
    property: 'onBasePct',
    header: 'OBP',
    render: row => row.onBasePct!.toFixed(3),
  },
  {
    property: 'ops',
    header: 'OPS',
    render: row => row.ops!.toFixed(3),
  },
];

const BoxScore: FC<Props> = ({ teams, boxScoreLines }) => {
  const teamBoxScores = useMemo(() => {
    const battingLineMap = Object.fromEntries(boxScoreLines.map(line => [line!.playerId!, line]));
    return teams.map(({ name, role, finalLineup }) => ({
      name: name!,
      role: role!,
      boxScore: finalLineup!.lineupSpots.map(({ player, position }) => ({
        name: player?.fullName,
        position,
        ...battingLineMap[player!.id],
      })) as PlayerBoxScoreRow[],
    }));
  }, [teams, boxScoreLines]);

  return (
    <Box direction="row" gap="medium" wrap>
      {teamBoxScores.map(team => (
        <DataTable key={team.role} columns={columns} data={team.boxScore} />
      ))}
    </Box>
  );
};

export default BoxScore;
