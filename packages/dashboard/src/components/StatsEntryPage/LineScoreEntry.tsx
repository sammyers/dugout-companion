import React, { FC } from 'react';
import {
  Box,
  Button,
  Heading,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  TextInput,
} from 'grommet';
import { AddCircle, SubtractCircle } from 'grommet-icons';
import _ from 'lodash';

import { TeamRole } from '@sammyers/dc-shared';

import PageBlockWithDataWarning from './PageBlockWithDataWarning';

import {
  isRunTotalValid,
  useLineScoreEntryStore,
  useStatsEntryStore,
  useTeamNamesStore,
} from './state';

interface LineScoreEntryRowProps {
  teamRole: TeamRole;
  runsPerInning: number[];
  gameLength: number;
}

const LineScoreEntryRow: FC<LineScoreEntryRowProps> = ({ teamRole, runsPerInning, gameLength }) => {
  const teamName = useTeamNamesStore(state => state.names[teamRole]);
  const setRuns = useLineScoreEntryStore(state => state.actions.setRuns);

  return (
    <TableRow>
      <TableCell style={{ whiteSpace: 'nowrap' }}>
        <strong>{teamName || `${_.capitalize(teamRole)} Team`}</strong>
      </TableCell>
      {runsPerInning.map((runs, i) => (
        <TableCell key={i}>
          <TextInput
            min={0}
            type="number"
            value={runs.toString()}
            onChange={e => setRuns(teamRole, i, parseInt(e.target.value) || 0)}
            style={{ minWidth: '60px' }}
          />
        </TableCell>
      ))}
      {gameLength > runsPerInning.length && <TableCell />}
      <TableCell align="right">
        <strong>{_.sum(runsPerInning)}</strong>
      </TableCell>
    </TableRow>
  );
};

const LineScoreEntry = () => {
  const runsPerInning = useLineScoreEntryStore(state => state.runsPerInning);
  const actions = useLineScoreEntryStore(state => state.actions);

  const gameLength = Math.max(runsPerInning.AWAY.length, runsPerInning.HOME.length);

  const stats = useStatsEntryStore(state => state.stats);

  const validRunTotal = isRunTotalValid(runsPerInning, stats);

  return (
    <Box>
      <Heading level={4} margin={{ top: 'small', left: 'medium', bottom: 'none' }}>
        Line Score
      </Heading>
      <PageBlockWithDataWarning
        warning={
          validRunTotal
            ? undefined
            : 'The total runs entered in the line score do not match the box score.'
        }
      >
        <Box direction="row" gap="small">
          <Button
            plain={false}
            size="small"
            label="Remove Inning"
            icon={<SubtractCircle size="small" />}
            color="accent-2"
            onClick={() => actions.removeInning()}
          />
          <Button
            plain={false}
            size="small"
            label="Add Inning"
            icon={<AddCircle size="small" />}
            color="accent-3"
            onClick={() => actions.addInning()}
          />
        </Box>
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell>
                <strong>Inning</strong>
              </TableCell>
              {_.times(runsPerInning.AWAY.length, i => (
                <TableCell key={i}>
                  <strong>{i + 1}</strong>
                </TableCell>
              ))}
              <TableCell>
                <strong>Total</strong>
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            <LineScoreEntryRow
              teamRole={TeamRole.AWAY}
              runsPerInning={runsPerInning.AWAY}
              gameLength={gameLength}
            />
            <LineScoreEntryRow
              teamRole={TeamRole.HOME}
              runsPerInning={runsPerInning.HOME}
              gameLength={gameLength}
            />
          </TableBody>
        </Table>
      </PageBlockWithDataWarning>
    </Box>
  );
};

export default LineScoreEntry;
