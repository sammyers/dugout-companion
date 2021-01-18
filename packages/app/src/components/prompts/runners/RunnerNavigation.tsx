import React, { useCallback } from 'react';
import { Box, Button } from 'grommet';
import { useDispatch } from 'react-redux';

import PulseButton from '../PulseButton';

import { canSelectNextRunner, canSelectPreviousRunner } from 'state/prompts/selectors';
import { promptActions } from 'state/prompts/slice';
import { useAppSelector } from 'utils/hooks';

const RunnerNavigation = () => {
  const dispatch = useDispatch();

  const showNext = useAppSelector(canSelectNextRunner);
  const showPrevious = useAppSelector(canSelectPreviousRunner);

  const selectNext = useCallback(() => {
    dispatch(promptActions.selectNextRunner());
  }, [dispatch]);

  const selectPrevious = useCallback(() => {
    dispatch(promptActions.selectPreviousRunner());
  }, [dispatch]);

  const moveToNextStage = useCallback(() => {
    dispatch(promptActions.goToNextStage());
  }, [dispatch]);

  return (
    <Box direction="row" align="center" gap="small" pad={{ left: 'xlarge' }}>
      <Box width="xsmall">
        {showPrevious && (
          <Button color="light-4" size="small" label="Previous Runner" onClick={selectPrevious} />
        )}
      </Box>
      <PulseButton
        label={showNext ? 'Next Runner' : 'Done'}
        color={showNext ? 'neutral-3' : 'accent-4'}
        onClick={showNext ? selectNext : moveToNextStage}
      />
    </Box>
  );
};

export default RunnerNavigation;
