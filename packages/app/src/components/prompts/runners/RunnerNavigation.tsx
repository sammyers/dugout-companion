import React, { useCallback } from 'react';
import { Box, Button, Stack, Text } from 'grommet';
import { useDispatch } from 'react-redux';

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

  const nextButtonColor = showNext ? 'neutral-3' : 'accent-4';

  return (
    <Box
      direction="row"
      align="center"
      gap="small"
      pad={{ left: 'xlarge' }}
      style={{ position: 'absolute', bottom: 0, right: 0, transform: 'translateX(50%)' }}
    >
      <Box width="xsmall">
        {showPrevious && (
          <Button color="light-4" size="small" label="Previous Runner" onClick={selectPrevious} />
        )}
      </Box>

      <Stack>
        <Box
          height="xsmall"
          width="xsmall"
          background={nextButtonColor}
          round="50%"
          animation="pulse"
        />
        <Button onClick={showNext ? selectNext : undefined} fill>
          <Box justify="center" align="center" round="50%" background={nextButtonColor}>
            <Text weight="bold" textAlign="center">
              {showNext ? 'Next Runner' : 'Done'}
            </Text>
          </Box>
        </Button>
      </Stack>
    </Box>
  );
};

export default RunnerNavigation;
