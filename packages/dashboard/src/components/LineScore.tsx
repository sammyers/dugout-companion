import React, { FC } from 'react';
import { Box, Table, TableBody, TableCell, TableHeader, TableRow } from 'grommet';
import _ from 'lodash';

import { GetLineScoreQuery } from '@sammyers/dc-shared';

type LineScoreCell = NonNullable<NonNullable<GetLineScoreQuery['game']>['lineScore']>[number];

const INNING_WIDTH = '16px';
const RUNS_WIDTH = '48px';
const HITS_WIDTH = INNING_WIDTH;

const LineScore: FC<{ cells: LineScoreCell[] }> = ({ cells }) => {
  const { TOP, BOTTOM } = _.groupBy(_.orderBy(cells, 'inning'), 'halfInning');

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableCell scope="col"></TableCell>
          {_.times(Math.max(TOP.length, BOTTOM.length), n => (
            <TableCell key={n} scope="col" align="center" size={INNING_WIDTH}>
              {n + 1}
            </TableCell>
          ))}
          <TableCell scope="col" align="right" size={RUNS_WIDTH}>
            <strong>R</strong>
          </TableCell>
          <TableCell scope="col" align="right" size={HITS_WIDTH}>
            <strong>H</strong>
          </TableCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(
          [
            ['Away', TOP],
            ['Home', BOTTOM],
          ] as [string, typeof TOP][]
        ).map(([name, innings]) => (
          <TableRow key={name}>
            <TableCell scope="row">
              <strong>{name}</strong>
            </TableCell>
            {innings.map(inning => (
              <TableCell key={inning?.inning} align="center" size={INNING_WIDTH}>
                {inning!.runs}
              </TableCell>
            ))}
            <TableCell align="right" size={RUNS_WIDTH}>
              <strong>{_.sumBy(innings, 'runs')}</strong>
            </TableCell>
            <TableCell align="right" size={HITS_WIDTH}>
              <strong>{_.sumBy(innings, 'hits')}</strong>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default LineScore;
