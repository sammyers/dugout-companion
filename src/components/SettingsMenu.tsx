import React, { useCallback, ChangeEvent, useState } from 'react';
import { Box, Button, DropButton, Heading, RangeInput, Text } from 'grommet';
import { Add, PowerReset, Subtract } from 'grommet-icons';

import {
  getCurrentGameLength,
  getMaxGameLength,
  getMinGameLength,
  isGameInExtraInnings,
  isGameInProgress,
} from 'state/game/selectors';
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

const SettingsMenu = () => {
  const dispatch = useAppDispatch();

  const minInnings = useAppSelector(getMinGameLength);
  const maxInnings = useAppSelector(getMaxGameLength);
  const currentGameLength = useAppSelector(getCurrentGameLength);
  const inProgress = useAppSelector(isGameInProgress);
  const inExtraInnings = useAppSelector(isGameInExtraInnings);

  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

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
  const handleClickAddGameLength = useCallback(() => dispatch(gameActions.incrementGameLength()), [
    dispatch,
  ]);

  return (
    <Box pad={{ vertical: 'medium', horizontal: 'small' }} gap="medium">
      <Box>
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
          open={resetConfirmOpen}
          onOpen={() => setResetConfirmOpen(true)}
          dropContent={<ResetConfirm />}
          dropProps={{ align: { top: 'bottom' } }}
          onClose={() => setResetConfirmOpen(false)}
        />
      )}
    </Box>
  );
};

export default SettingsMenu;
