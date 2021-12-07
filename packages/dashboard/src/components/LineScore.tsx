import React, { FC } from 'react';
import { Table, TableBody, TableCell, TableHeader, TableRow, Text } from 'grommet';
import _ from 'lodash';

import { GetGameSummaryQuery } from '@sammyers/dc-shared';

type LineScoreCell = NonNullable<NonNullable<GetGameSummaryQuery['game']>['lineScore']>[number];

const RUNS_WIDTH = '40px';
const HITS_WIDTH = '16px';

interface Props {
  cells: LineScoreCell[];
  teams: NonNullable<GetGameSummaryQuery['game']>['teams'];
}

const LineScore: FC<Props> = ({ cells, teams }) => {
  const { TOP, BOTTOM } = _.groupBy(_.orderBy(cells, 'inning'), 'halfInning');

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableCell scope="col" pad="xsmall"></TableCell>
          {_.times(Math.max(TOP.length, BOTTOM.length), n => (
            <TableCell key={n} scope="col" align="center" pad="xsmall">
              <Text>{n + 1}</Text>
            </TableCell>
          ))}
          <TableCell pad="xsmall" scope="col" align="right" size={RUNS_WIDTH}>
            <Text weight="bold">R</Text>
          </TableCell>
          <TableCell pad="xsmall" scope="col" align="right" size={HITS_WIDTH}>
            <Text weight="bold">H</Text>
          </TableCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {_.zip(_.sortBy(teams, 'role'), [TOP, BOTTOM]).map(([team, innings]) => (
          <TableRow key={team?.name}>
            <TableCell pad="xsmall" scope="row">
              <Text weight="bold">{team?.name}</Text>
            </TableCell>
            {innings!.map(inning => (
              <TableCell pad="xsmall" key={inning?.inning} align="center">
                <Text>{inning!.runs}</Text>
              </TableCell>
            ))}
            <TableCell pad="xsmall" align="right" size={RUNS_WIDTH}>
              <Text weight="bold">{_.sumBy(innings, 'runs')}</Text>
            </TableCell>
            <TableCell pad="xsmall" align="right" size={HITS_WIDTH}>
              <Text weight="bold">{_.sumBy(innings, 'hits')}</Text>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default LineScore;
