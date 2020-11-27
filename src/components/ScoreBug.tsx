import React, { CSSProperties } from 'react';
import { Table, TableBody, TableRow, TableCell, Box, Text } from 'grommet';

import {
  getScore,
  getBattingTeam,
  getNumOuts,
  getHalfInning,
  getInning,
} from 'state/game/selectors';
import { TeamRole, HalfInning } from 'state/game/types';
import { useAppSelector } from 'utils/hooks';
import { CaretUpFill, CaretDownFill } from 'grommet-icons';

const boldStyle: CSSProperties = { fontWeight: 'bold' };

const ScoreBug = () => {
  const [awayScore, homeScore] = useAppSelector(getScore);
  const battingTeam = useAppSelector(getBattingTeam);
  const halfInning = useAppSelector(getHalfInning);
  const inning = useAppSelector(getInning);
  const numOuts = useAppSelector(getNumOuts);

  return (
    <Box direction="row" gap="medium" align="center">
      <Text>
        {numOuts} {numOuts === 1 ? 'out' : 'outs'}
      </Text>
      <Box direction="row" align="center">
        {halfInning === HalfInning.TOP ? <CaretUpFill /> : <CaretDownFill />}
        <Text>{inning}</Text>
      </Box>
      <Table>
        <TableBody>
          <TableRow style={battingTeam === TeamRole.AWAY ? boldStyle : undefined}>
            <TableCell scope="row">Away</TableCell>
            <TableCell>{awayScore}</TableCell>
          </TableRow>
          <TableRow style={battingTeam === TeamRole.HOME ? boldStyle : undefined}>
            <TableCell scope="row">Home</TableCell>
            <TableCell>{homeScore}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Box>
  );
};

export default ScoreBug;
