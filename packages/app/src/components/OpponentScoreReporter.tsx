import React, { useCallback, useState } from 'react';
import { Box, Button, Heading, Text } from 'grommet';
import { Add, Subtract } from 'grommet-icons';

import EndGameNowButton from './EndGameNowButton';

import { gameActions } from 'state/game/slice';
import { useAppDispatch, useAppSelector } from 'utils/hooks';
import { getHalfInning, getScoreAfterSoloModeInning } from 'state/game/selectors';
import { _shouldShowEndGameNowButton } from 'state/game/stateHelpers';

const OpponentScoreReporter = () => {
  const dispatch = useAppDispatch();

  const [runsScored, setRunsScored] = useState(0);

  const halfInning = useAppSelector(getHalfInning);
  const newScore = useAppSelector(state => getScoreAfterSoloModeInning(state, runsScored));
  const showEndGameNowButton = _shouldShowEndGameNowButton(halfInning, newScore);

  const handleEndInning = useCallback(() => {
    dispatch(gameActions.recordSoloModeOpponentInning({ runsScored }));
  }, [dispatch, runsScored]);

  return (
    <Box gridArea="reporter" align="center" justify="center">
      <Heading level={2}>Opposing Team at Bat</Heading>
      <Box>
        <Text textAlign="center">Runs scored:</Text>
        <Box direction="row" align="center" gap="xsmall">
          <Button
            icon={<Subtract />}
            onClick={() => setRunsScored(runs => runs - 1)}
            disabled={runsScored === 0}
          />
          <Heading level={2}>{runsScored}</Heading>
          <Button icon={<Add />} onClick={() => setRunsScored(runs => runs + 1)} />
        </Box>
      </Box>
      <Box gap="medium">
        <Button plain={false} onClick={handleEndInning}>
          End Inning
        </Button>
        {showEndGameNowButton && <EndGameNowButton opponentRunsScored={runsScored} />}
      </Box>
    </Box>
  );
};

export default OpponentScoreReporter;
