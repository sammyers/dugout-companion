import React, { FC, useContext, useMemo } from 'react';
import {
  Box,
  ColumnConfig,
  DataTable,
  Heading,
  ResponsiveContext,
  Text,
  ThemeContext,
} from 'grommet';
import _ from 'lodash';

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

const hidePropertiesOnSmallScreen = ['doubles', 'triples', 'homeruns'];

const BoxScore: FC<Props> = ({ teams, boxScoreLines }) => {
  const size = useContext(ResponsiveContext);

  const columns: ColumnConfig<PlayerBoxScoreRow>[] = useMemo(
    () => [
      {
        property: 'name',
        header: 'Player',
        render: row => (
          <Box direction="row" align="center" gap="xsmall">
            <Text weight="bold">{row.name}</Text>
            {size !== 'xsmall' && (
              <Text size="small" color="dark-4">
                {getPositionAbbreviation(row.position)}
              </Text>
            )}
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
        property: 'doubles',
        header: '2B',
      },
      {
        property: 'triples',
        header: '3B',
      },
      {
        property: 'homeruns',
        header: 'HR',
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
        render: row => row.onBasePct?.toFixed(3) ?? '',
      },
      {
        property: 'ops',
        header: 'OPS',
        render: row => row.ops?.toFixed(3) ?? '',
      },
    ],
    [size]
  );

  const responsiveColumns = columns.filter(
    column =>
      !hidePropertiesOnSmallScreen.includes(column.property) || !['xsmall', 'small'].includes(size)
  );

  const teamBoxScores = useMemo(() => {
    const battingLineMap = Object.fromEntries(boxScoreLines.map(line => [line!.playerId!, line]));
    return _.sortBy(teams, 'role').map(({ name, role, winner, finalLineup }) => ({
      name: name!,
      role: role!,
      winner,
      boxScore: finalLineup!.lineupSpots.map(({ player, position }) => ({
        name: player?.fullName,
        position,
        ...battingLineMap[player!.id],
      })) as PlayerBoxScoreRow[],
    }));
  }, [teams, boxScoreLines]);

  console.log(teamBoxScores);

  return (
    <Box direction="row" justify="stretch" wrap>
      {teamBoxScores.map(team => (
        <Box
          align="center"
          key={team.role}
          margin="small"
          pad="small"
          flex="grow"
          background="neutral-5"
          round="small"
          height="min-content"
        >
          <Heading level={4} margin="small" color={team.winner ? 'status-ok' : 'status-critical'}>
            {team.name}
          </Heading>
          <ThemeContext.Extend value={{ text: { font: { size: '14px' } } }}></ThemeContext.Extend>
          <DataTable
            fill
            columns={responsiveColumns}
            data={team.boxScore}
            background={{ body: ['neutral-5', 'neutral-6'] }}
            pad="xsmall"
          />
        </Box>
      ))}
    </Box>
  );
};

export default BoxScore;
