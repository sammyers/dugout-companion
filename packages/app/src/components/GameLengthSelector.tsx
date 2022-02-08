import React, { ChangeEvent, useCallback } from 'react';
import { Box, Button, Heading, RangeInput, Text } from 'grommet';
import { Add, Subtract } from 'grommet-icons';

import {
  getCurrentGameLength,
  getMaxGameLength,
  getMinGameLength,
  isGameInExtraInnings,
} from 'state/game/selectors';
import { gameActions } from 'state/game/slice';
import { useAppDispatch, useAppSelector } from 'utils/hooks';

const GameLengthSelector = () => {
  const dispatch = useAppDispatch();

  const minInnings = useAppSelector(getMinGameLength);
  const maxInnings = useAppSelector(getMaxGameLength);
  const currentGameLength = useAppSelector(getCurrentGameLength);
  const inExtraInnings = useAppSelector(isGameInExtraInnings);

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
      <Text size="small" alignSelf="center" color={inExtraInnings ? 'status-critical' : undefined}>
        {inExtraInnings ? 'In extra' : currentGameLength} innings
      </Text>
    </Box>
  );
};

export default GameLengthSelector;
