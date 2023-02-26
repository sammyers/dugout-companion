import React from 'react';
import { Box, Button, Text, TextInput, ThemeContext } from 'grommet';
import { useNavigate, Navigate } from 'react-router-dom';

import { GroupPermissionType, TeamRole, usePermission } from '@sammyers/dc-shared';

import PageBlock from '../util/PageBlock';
import StatsEntryTable from './StatsEntryTable';
import SaveManualEntryGameButton from './SaveManualEntryGameButton';

import { useCurrentGroupId } from '../context';
import { useGameInfoStore } from './state';
import LineScoreEntry from './LineScoreEntry';

const StatsEntryPage = () => {
  const groupId = useCurrentGroupId();
  const canEnterStats = usePermission(GroupPermissionType.SAVE_GAMES, groupId ?? '');

  const gameName = useGameInfoStore(state => state.name);
  const gameDate = useGameInfoStore(state => state.date);
  const gameEndTime = useGameInfoStore(state => state.endTime);

  const gameInfoActions = useGameInfoStore(state => state.actions);

  if (!groupId || canEnterStats == null) {
    return null;
  }

  if (!canEnterStats) {
    return <Navigate to=".." replace />;
  }

  return (
    <ThemeContext.Extend
      value={{ table: { body: { pad: 'xxsmall' }, header: { pad: 'xxsmall' } } }}
    >
      <Box pad={{ bottom: 'xlarge' }}>
        <PageBlock pad="medium">
          <Box direction="row" justify="between" wrap style={{ rowGap: '12px' }}>
            <Box>
              <Text>Game Name</Text>
              <TextInput
                placeholder="Enter a Name"
                size="medium"
                style={{ minWidth: '15rem' }}
                value={gameName}
                onChange={e => gameInfoActions.setName(e.target.value)}
              />
            </Box>
            <Box direction="row" gap="small">
              <Box>
                <Text>Game Date</Text>
                <TextInput
                  type="datetime-local"
                  size="medium"
                  value={gameDate}
                  onChange={e => gameInfoActions.setDate(e.target.value)}
                />
              </Box>
              <Box>
                <Text>End Time</Text>
                <TextInput
                  type="time"
                  size="medium"
                  value={gameEndTime}
                  onChange={e => gameInfoActions.setEndTime(e.target.value)}
                />
              </Box>
            </Box>
            <SaveManualEntryGameButton />
          </Box>
        </PageBlock>
        <LineScoreEntry />
        <StatsEntryTable teamRole={TeamRole.AWAY} />
        <StatsEntryTable teamRole={TeamRole.HOME} />
      </Box>
    </ThemeContext.Extend>
  );
};

export const StatsEntryPageTitle = () => {
  return <>Enter Stats</>;
};

export const StatsEntryPageLink = () => {
  const groupId = useCurrentGroupId();
  const canEnterStats = usePermission(GroupPermissionType.SAVE_GAMES, groupId ?? '');

  const navigate = useNavigate();

  if (!canEnterStats) return null;

  return (
    <Button
      plain={false}
      color="neutral-1"
      alignSelf="center"
      margin={{ top: 'small' }}
      onClick={() => navigate('new-game')}
    >
      Enter Stats
    </Button>
  );
};

export default StatsEntryPage;
