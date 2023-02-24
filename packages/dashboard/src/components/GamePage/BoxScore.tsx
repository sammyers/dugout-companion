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
  TeamRole,
} from '@sammyers/dc-shared';

import PlayerLink from '../util/PlayerLink';
import { getOnBasePercentage, getOps } from '../../utils';

type BoxScoreLine = NonNullable<NonNullable<GetGameDetailsQuery['game']>['boxScore']>[number];

interface Props {
  teams: NonNullable<GetGameDetailsQuery['game']>['teams'];
  boxScoreLines: BoxScoreLine[];
  score?: number[];
}

interface PlayerBoxScoreRow extends NonNullable<BoxScoreLine> {
  name: string;
  playerId: string;
  position: FieldingPosition;
}

const hidePropertiesOnSmallScreen = ['doubles', 'triples', 'homeruns'];

const BoxScore: FC<Props> = ({ teams, boxScoreLines, score }) => {
  const size = useContext(ResponsiveContext);

  const columns: ColumnConfig<PlayerBoxScoreRow>[] = useMemo(
    () => [
      {
        property: 'name',
        header: 'Player',
        render: row => (
          <Box direction="row" align="center" gap="xsmall">
            <PlayerLink player={{ id: row.playerId, fullName: row.name }} />
            {size !== 'xsmall' && (
              <Text size="small" color="dark-4">
                {getPositionAbbreviation(row.position)}
              </Text>
            )}
          </Box>
        ),
        footer: 'Team',
      },
      {
        property: 'atBats',
        header: 'AB',
        aggregate: 'sum',
        footer: { aggregate: true },
      },
      {
        property: 'runs',
        header: 'R',
        aggregate: 'sum',
        footer: { aggregate: true },
      },
      {
        property: 'hits',
        header: 'H',
        aggregate: 'sum',
        footer: { aggregate: true },
      },
      {
        property: 'doubles',
        header: '2B',
        aggregate: 'sum',
        footer: { aggregate: true },
      },
      {
        property: 'triples',
        header: '3B',
        aggregate: 'sum',
        footer: { aggregate: true },
      },
      {
        property: 'homeruns',
        header: 'HR',
        aggregate: 'sum',
        footer: { aggregate: true },
      },
      {
        property: 'rbi',
        header: 'RBI',
        aggregate: 'sum',
        footer: { aggregate: true },
      },
      {
        property: 'walks',
        header: 'BB',
        aggregate: 'sum',
        footer: { aggregate: true },
      },
      {
        property: 'obp',
        header: 'OBP',
        render: row => getOnBasePercentage(row).toFixed(3) ?? '',
        // TODO(sam): show team OBP
      },
      {
        property: 'ops',
        header: 'OPS',
        render: row => getOps(row).toFixed(3) ?? '',
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
    return _.sortBy(
      teams.filter(team => !team.soloModeOpponent),
      'role'
    ).map(({ name, role, winner, finalLineup }) => ({
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

  const tieGame = !_.some(teams, team => team.winner);

  return (
    <Box direction="row" justify="stretch" wrap>
      {teamBoxScores.map(team => {
        const displayScore = score && score[team.role === TeamRole.AWAY ? 0 : 1];
        return (
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
            <Heading
              level={4}
              margin="small"
              color={tieGame ? 'accent-4' : team.winner ? 'status-ok' : 'status-critical'}
            >
              {team.name}
              {displayScore ? ` (${displayScore})` : ''}
            </Heading>
            <DataTable
              fill
              columns={responsiveColumns}
              data={team.boxScore}
              background={{ body: ['neutral-5', 'neutral-6'] }}
              pad="xsmall"
            />
          </Box>
        );
      })}
    </Box>
  );
};

export default BoxScore;
