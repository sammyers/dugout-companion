import React, { CSSProperties } from 'react';
import { Table, TableBody, TableRow, TableCell, Box, Text } from 'grommet';
import { CaretUpFill, CaretDownFill } from 'grommet-icons';

import { HalfInning, TeamRole } from '@sammyers/dc-shared';

import {
  getScore,
  getBattingTeamRole,
  getNumOuts,
  getHalfInning,
  getInning,
} from 'state/game/selectors';
import { useAppSelector } from 'utils/hooks';

const boldStyle: CSSProperties = { fontWeight: 'bold' };

const awayColor = 'accent-2';
const homeColor = 'accent-3';

const ScoreBug = () => {
  const [awayScore, homeScore] = useAppSelector(getScore);
  const battingTeam = useAppSelector(getBattingTeamRole);
  const halfInning = useAppSelector(getHalfInning);
  const inning = useAppSelector(getInning);
  const numOuts = useAppSelector(getNumOuts);

  return (
    <Box direction="row" gap="medium" align="center">
      <Text color={numOuts ? 'status-critical' : 'light-1'} style={boldStyle}>
        {numOuts} {numOuts === 1 ? 'out' : 'outs'}
      </Text>
      <Box direction="row" align="center">
        {halfInning === HalfInning.TOP ? (
          <CaretUpFill color={awayColor} />
        ) : (
          <CaretDownFill color={homeColor} />
        )}
        <Text>{inning}</Text>
      </Box>
      <Table>
        <TableBody>
          <TableRow style={battingTeam === TeamRole.AWAY ? boldStyle : undefined}>
            <TableCell scope="row">
              <Text color={awayColor}>Away</Text>
            </TableCell>
            <TableCell>
              <Text color={awayColor}>{awayScore}</Text>
            </TableCell>
          </TableRow>
          <TableRow style={battingTeam === TeamRole.HOME ? boldStyle : undefined}>
            <TableCell scope="row">
              <Text color={homeColor}>Home</Text>
            </TableCell>
            <TableCell>
              <Text color={homeColor}>{homeScore}</Text>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Box>
  );
};

export default ScoreBug;
