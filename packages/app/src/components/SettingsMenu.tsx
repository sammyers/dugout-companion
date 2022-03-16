import React, { useCallback } from 'react';
import { Box, Button, CheckBox, DropButton, Heading, Select, Text } from 'grommet';
import { Erase, PowerReset } from 'grommet-icons';
import { PURGE } from 'redux-persist';

import { ManageCurrentUser } from '@sammyers/dc-shared';

import GameLengthSelector from './GameLengthSelector';

import {
  canConfigureSteals,
  canStealBases,
  isGameInProgress,
  isSoloModeActive,
} from 'state/game/selectors';
import { groupActions } from 'state/groups/slice';
import { getAllGroups, getCurrentGroup } from 'state/groups/selectors';
import { gameActions } from 'state/game/slice';
import { useAppDispatch, useAppSelector } from 'utils/hooks';
import { useNetworkStatus } from 'utils/network';

const GroupSelector = () => {
  const dispatch = useAppDispatch();
  const currentGroup = useAppSelector(getCurrentGroup);
  const groups = useAppSelector(getAllGroups);

  const handleChange = useCallback(
    ({ value }: { value: string }) => {
      if (value !== currentGroup?.id) {
        dispatch(groupActions.setCurrentGroup(groups.find(group => group.id === value)!));
      }
    },
    [dispatch, currentGroup, groups]
  );

  return (
    <Select
      margin="small"
      options={groups}
      labelKey="name"
      valueKey={{ key: 'id', reduce: true }}
      value={currentGroup?.id}
      onChange={handleChange}
    />
  );
};

const ResetConfirm = () => {
  const dispatch = useAppDispatch();

  const onConfirm = useCallback(() => {
    dispatch(gameActions.resetGame());
  }, [dispatch]);

  return (
    <Box pad="small" width="small" gap="small">
      <Text textAlign="center" size="small">
        Are you sure you want to reset the game?
      </Text>
      <Button size="small" color="status-critical" label="Reset" onClick={onConfirm} />
    </Box>
  );
};

const PurgeConfirm = () => {
  const dispatch = useAppDispatch();

  const onConfirm = useCallback(() => {
    dispatch({ type: PURGE, result: () => null });
  }, [dispatch]);

  return (
    <Box pad="small" width="small" gap="small">
      <Text textAlign="center" size="small">
        Purge locally persisted state? Don't do this unless you really need to!
      </Text>
      <Button size="small" color="status-critical" label="Purge" onClick={onConfirm} />
    </Box>
  );
};

const SettingsMenu = () => {
  const dispatch = useAppDispatch();
  const online = useNetworkStatus();

  const inProgress = useAppSelector(isGameInProgress);
  const soloMode = useAppSelector(isSoloModeActive);
  const showSteals = useAppSelector(canConfigureSteals);
  const stealsAllowed = useAppSelector(canStealBases);

  return (
    <Box
      pad={{ bottom: 'medium', horizontal: 'small', top: 'small' }}
      gap="medium"
      background="white"
      border={{ color: 'dark-3', side: 'all' }}
      round="xsmall"
      style={{ minWidth: 300 }}
    >
      <Box>
        {online ? (
          <ManageCurrentUser />
        ) : (
          <Box alignSelf="center" margin="small">
            <Text color="dark-4">Offline</Text>
          </Box>
        )}
        {!inProgress && (
          <>
            <Heading level={5} alignSelf="center" margin="none">
              Current Group
            </Heading>
            <GroupSelector />
          </>
        )}
        {!soloMode && <GameLengthSelector />}
        {showSteals && (
          <Box alignSelf="center" margin={{ vertical: 'small' }}>
            <CheckBox
              toggle
              label="Allow Stolen Bases"
              checked={stealsAllowed}
              onChange={e => dispatch(gameActions.setStealsAllowed(e.target.checked))}
            />
          </Box>
        )}
      </Box>
      {inProgress && (
        <DropButton
          label="Reset game"
          icon={<PowerReset color="status-critical" />}
          color="status-critical"
          alignSelf="center"
          dropContent={<ResetConfirm />}
          dropProps={{ align: { top: 'bottom' } }}
        />
      )}
      <DropButton
        label="Purge local data"
        icon={<Erase color="status-critical" />}
        color="status-critical"
        alignSelf="center"
        dropContent={<PurgeConfirm />}
        dropProps={{ align: { top: 'bottom' } }}
      />
    </Box>
  );
};

export default SettingsMenu;
