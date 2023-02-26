import React, { FC, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Heading,
  Select,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHeader,
  TableRow,
  Text,
  TextInput,
  ThemeContext,
} from 'grommet';
import { TeamRole, useGetPlayersInGroupQuery } from '@sammyers/dc-shared';
import { isRbiTotalValid, useStatsEntryStore } from './state';
import { useCurrentGroupId } from '../context';
import _ from 'lodash';
import PageBlock from '../util/PageBlock';
import { Close, FormClose, FormTrash, SubtractCircle } from 'grommet-icons';
import PageBlockWithDataWarning from './PageBlockWithDataWarning';

interface Props {
  teamRole: TeamRole;
}

const TABLE_COLUMNS = [
  { key: 'plateAppearances' as const, label: 'PA' },
  { key: 'singles' as const, label: '1B' },
  { key: 'doubles' as const, label: '2B' },
  { key: 'triples' as const, label: '3B' },
  { key: 'homeruns' as const, label: 'HR' },
  { key: 'walks' as const, label: 'BB' },
  { key: 'strikeouts' as const, label: 'K' },
  { key: 'sacFlies' as const, label: 'SAC' },
  { key: 'gidp' as const, label: 'GIDP' },
  { key: 'runs' as const, label: 'R' },
  { key: 'rbi' as const, label: 'RBI' },
  { key: 'stolenBases' as const, label: 'SB' },
];

interface PlayerOption {
  id: string;
  fullName: string;
}

const StatsEntryTable: FC<Props> = ({ teamRole }) => {
  const groupId = useCurrentGroupId();
  const { data: playerData } = useGetPlayersInGroupQuery({ variables: { groupId: groupId ?? '' } });

  const stats = useStatsEntryStore(state => state.stats[teamRole]);
  const statsEntryActions = useStatsEntryStore(state => state.actions);
  const playersAlreadyInGame = useStatsEntryStore(
    state =>
      new Set([
        ...state.stats.AWAY.map(({ playerId }) => playerId),
        ...state.stats.HOME.map(({ playerId }) => playerId),
      ])
  );

  const playerOptions = useMemo(
    () =>
      _.sortBy(
        ((playerData?.group?.players ?? []) as PlayerOption[]).filter(
          player => !playersAlreadyInGame.has(player!.id)
        ),
        'fullName'
      ),
    [playerData, playersAlreadyInGame]
  );
  const playerNameMap = useMemo(
    () =>
      _.reduce(
        playerData?.group?.players ?? [],
        (all, player) => ({
          ...all,
          [player!.id]: player!.fullName!,
        }),
        {} as Record<string, string>
      ),
    [playerData]
  );

  const [searchValue, setSearchValue] = useState('');
  const searchOptions = useMemo(() => {
    console.log('calculating search options');
    return _.take(
      playerOptions.filter(option =>
        option.fullName.toLowerCase().includes(searchValue.toLowerCase())
      ),
      10
    );
  }, [playerOptions, searchValue]);

  const validRbiTotal = isRbiTotalValid(stats);

  return (
    <Box>
      <Heading level={4} margin={{ top: 'small', left: 'medium', bottom: 'none' }}>
        {_.capitalize(teamRole)} Team
      </Heading>
      <PageBlockWithDataWarning
        warning={validRbiTotal ? undefined : 'A team cannot have more RBI than runs scored.'}
      >
        <Box alignSelf="start">
          <TextInput placeholder="Team Name" size="medium" style={{ justifySelf: 'start' }} />
        </Box>
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell scope="col" border="bottom" />
              <TableCell scope="col" border="bottom">
                Player
              </TableCell>
              {TABLE_COLUMNS.map(({ key, label }) => (
                <TableCell width="60px" scope="col" key={key} style={{ textAlign: 'center' }}>
                  {label}
                </TableCell>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats.map(({ playerId, ...values }, i) => (
              <TableRow key={playerId}>
                <TableCell>{i + 1}</TableCell>
                <TableCell>
                  <Box direction="row" align="center">
                    <Text size="large">{playerNameMap[playerId!]}</Text>
                    <Button
                      margin={{ left: 'xsmall' }}
                      icon={<FormTrash color="status-critical" size="medium" />}
                      style={{ padding: '2px' }}
                      onClick={() => statsEntryActions.removePlayer(teamRole, playerId)}
                    />
                  </Box>
                </TableCell>
                {TABLE_COLUMNS.map(({ key }) => (
                  <TableCell key={key} width="60px">
                    <TextInput
                      min={0}
                      type="number"
                      value={values[key].toString()}
                      onChange={e =>
                        statsEntryActions.setValue(
                          teamRole,
                          playerId!,
                          key,
                          parseInt(e.target.value) || 0
                        )
                      }
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell />
              <TableCell>
                <Select
                  style={{ minWidth: '8rem' }}
                  value=""
                  placeholder="Add Player"
                  searchPlaceholder="Player Name"
                  valueKey={{ key: 'id', reduce: true }}
                  options={searchOptions}
                  children={option => option.fullName}
                  onSearch={value => {
                    console.log('searching', value);
                    setSearchValue(value);
                  }}
                  onClose={() => setSearchValue('')}
                  onChange={({ option }) => statsEntryActions.addPlayer(teamRole, option.id)}
                />
              </TableCell>
              {TABLE_COLUMNS.map(({ key }) => (
                <TableCell key={key} />
              ))}
            </TableRow>
          </TableFooter>
        </Table>
      </PageBlockWithDataWarning>
    </Box>
  );
};

export default StatsEntryTable;
