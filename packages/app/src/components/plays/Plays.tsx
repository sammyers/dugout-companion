import React, { useCallback, useMemo, useState } from 'react';
import { Text, Box, Heading, ThemeContext } from 'grommet';
import _ from 'lodash';
import { Navigate } from 'react-router-dom';

import HalfInningPlays from './HalfInningPlays';

import { getInning, isGameInProgress } from 'state/game/selectors';
import { getAllPlays, getScoringPlays } from 'state/plays/selectors';
import { useAppSelector } from 'utils/hooks';

const Plays = () => {
  const gameStarted = useAppSelector(isGameInProgress);
  const scoringPlays = useAppSelector(getScoringPlays);
  const allPlays = useAppSelector(getAllPlays);
  const currentInning = useAppSelector(getInning);

  const [selectedInning, setSelectedInning] = useState(currentInning);

  const allPlaysForInning = useMemo(
    () => allPlays.filter(({ inning }) => inning === selectedInning),
    [allPlays, selectedInning]
  );

  const selectInning = useCallback(
    (inning: number) => () => {
      setSelectedInning(inning);
    },
    [setSelectedInning]
  );

  if (!gameStarted) {
    return <Navigate to="/teams" />;
  }

  return (
    <Box pad="medium" flex={{ shrink: 0 }} basis="auto" gap="small">
      <Box direction="row" justify="between">
        <Heading level={4} margin="none">
          Scoring
        </Heading>
        <Heading level={4} alignSelf="end" margin="none">
          All Plays
        </Heading>
      </Box>
      <Box direction="row" gap="small">
        <Box gap="small" basis="0" flex>
          {scoringPlays.map(group => (
            <HalfInningPlays key={`${group.inning}_${group.halfInning}`} {...group} />
          ))}
        </Box>
        <Box gap="small" basis="0" flex margin={{ left: 'small' }}>
          {!allPlaysForInning.length && <Text alignSelf="center">No plays yet this inning.</Text>}
          {allPlaysForInning.map(group => (
            <HalfInningPlays key={`${group.inning}_${group.halfInning}`} {...group} />
          ))}
        </Box>
        <ThemeContext.Extend value={{ global: { size: { xxsmall: '32px' } } }}>
          <Box gap="xsmall" flex={false}>
            {_.range(1, currentInning + 1).map(inning => (
              <Box
                key={inning}
                round={{ size: '4px' }}
                border={{ size: 'small' }}
                width="xxsmall"
                height="xxsmall"
                justify="center"
                align="center"
                hoverIndicator={!(inning === selectedInning)}
                background={inning === selectedInning ? 'accent-3' : undefined}
                onClick={selectInning(inning)}
              >
                <Text>{inning}</Text>
              </Box>
            ))}
          </Box>
        </ThemeContext.Extend>
      </Box>
    </Box>
  );
};

export default Plays;
