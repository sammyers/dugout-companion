import React, { useCallback, ChangeEvent } from 'react';
import { Box, Button, DropButton, Heading, RangeInput, Text } from 'grommet';
import { Add, Erase, PowerReset, Subtract } from 'grommet-icons';
import { PURGE } from 'redux-persist';

import {
  getCurrentGameLength,
  getMaxGameLength,
  getMinGameLength,
  isGameInExtraInnings,
  isGameInProgress,
} from 'state/game/selectors';
import { getCurrentGroupName } from 'state/groups/selectors';
import { gameActions } from 'state/game/slice';
import { useAppDispatch, useAppSelector } from 'utils/hooks';

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

  const minInnings = useAppSelector(getMinGameLength);
  const maxInnings = useAppSelector(getMaxGameLength);
  const currentGameLength = useAppSelector(getCurrentGameLength);
  const inProgress = useAppSelector(isGameInProgress);
  const inExtraInnings = useAppSelector(isGameInExtraInnings);
  const groupName = useAppSelector(getCurrentGroupName);

  const handleChangeGameLength = useCallback(
    ({ target }: ChangeEvent<HTMLInputElement>) => {
      dispatch(gameActions.changeGameLength(parseInt(target.value)));
    },
    [dispatch]
  );

  const handleClickSubtractGameLength = useCallback(
    () => dispatch(gameActions.decrementGameLength()),
    [dispatch]
  );
  const handleClickAddGameLength = useCallback(
    () => dispatch(gameActions.incrementGameLength()),
    [dispatch]
  );

  return (
    <Box pad={{ bottom: 'medium', horizontal: 'small', top: 'small' }} gap="medium">
      <Box>
        <Heading level={4} alignSelf="center" margin={{ top: 'xsmall', bottom: 'medium' }}>
          Current Group: {groupName}
        </Heading>
        <Heading level={5} margin="none" alignSelf="center">
          Game Length
        </Heading>
        <Box direction="row" align="center" gap="xsmall">
          <Button
            icon={<Subtract />}
            onClick={handleClickSubtractGameLength}
            disabled={currentGameLength === minInnings || inExtraInnings}
          />
          <RangeInput
            step={1}
            min={minInnings}
            max={maxInnings}
            value={currentGameLength}
            onChange={handleChangeGameLength}
            disabled={inExtraInnings}
          />
          <Button
            icon={<Add />}
            onClick={handleClickAddGameLength}
            disabled={currentGameLength === maxInnings || inExtraInnings}
          />
        </Box>
        <Text
          size="small"
          alignSelf="center"
          color={inExtraInnings ? 'status-critical' : undefined}
        >
          {inExtraInnings ? 'In extra' : currentGameLength} innings
        </Text>
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
