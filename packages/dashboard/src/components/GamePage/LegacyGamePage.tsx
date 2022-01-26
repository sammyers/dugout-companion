import React, { FC, useMemo } from 'react';
import { Box, ColumnConfig, DataTable, Heading } from 'grommet';
import _ from 'lodash';
import { useParams } from 'react-router-dom';

import PlayerLink from '../util/PlayerLink';

import {
  GetLegacyGameDetailsQuery,
  useGetLegacyGameDetailsQuery,
  useGetLegacyGameTitleQuery,
} from '@sammyers/dc-shared';
import { parseLegacyDate, useResponsiveColumns } from '../../utils';
import { format, parse } from 'date-fns';

type BattingLine = NonNullable<GetLegacyGameDetailsQuery['legacyGame']>['battingLines'][number];

interface LegacyBoxScoreProps {
  teamName: string;
  winner: boolean;
  lineup: BattingLine[];
}

const columnDefs: ColumnConfig<BattingLine>[] = [
  {
    property: 'name',
    header: 'Player',
    render: ({ player, legacyPlayer }) => (
      <PlayerLink player={player} legacyPlayer={legacyPlayer} />
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
];

const LegacyBoxScore: FC<LegacyBoxScoreProps> = ({ teamName, winner, lineup }) => {
  const columns = useResponsiveColumns(columnDefs, {
    xsmall: ['doubles', 'triples', 'ops'],
    small: ['doubles', 'triples', 'ops'],
  });

  const totalScore = _.sumBy(lineup, 'runs');

  return (
    <Box
      align="center"
      margin="small"
      pad="small"
      flex="grow"
      background="neutral-5"
      round="small"
      height="min-content"
    >
      <Heading level={4} margin="small" color={winner ? 'status-ok' : 'status-critical'}>
        {teamName} ({totalScore})
      </Heading>
      <DataTable
        fill
        columns={columns}
        data={lineup}
        background={{ body: ['neutral-5', 'neutral-6'] }}
        pad="xsmall"
      />
    </Box>
  );
};

const LegacyGamePage = () => {
  const { id } = useParams();
  const { data } = useGetLegacyGameDetailsQuery({ variables: { id: Number(id) } });

  const [team1, team2] = useMemo(() => {
    if (!data) return [undefined, undefined];

    const { team1, team2, battingLines } = data.legacyGame!;
    const battingLinesByTeam = _.groupBy(_.orderBy(battingLines, 'statLineId'), 'legacyTeamId');

    return [
      { teamName: team1!.teamName!, lineup: battingLinesByTeam[team1!.teamId] },
      { teamName: team2!.teamName!, lineup: battingLinesByTeam[team2!.teamId] },
    ];
  }, [data]);

  return (
    <Box>
      <Box direction="row" justify="stretch" wrap>
        {team1 && <LegacyBoxScore {...team1} winner />}
        {team2 && <LegacyBoxScore {...team2} winner={false} />}
      </Box>
    </Box>
  );
};

export default LegacyGamePage;

export const LegacyGamePageTitle = () => {
  const { id } = useParams();
  const { data } = useGetLegacyGameTitleQuery({ variables: { id: Number(id) } });

  if (!data) {
    return <>Legacy Game</>;
  }

  const date = parseLegacyDate(data.legacyGame!.gameDate!);
  return (
    <>
      {data.legacyGame?.gameTitle} - {format(date, 'M/d/yyyy')}
    </>
  );
};
