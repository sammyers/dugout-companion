import React, { useEffect, FC } from 'react';
import { Box, Text } from 'grommet';
import _ from 'lodash';
import { useDispatch } from 'react-redux';

import RunnerNavigation from './RunnerNavigation';
import RunnerOptionGroup from './RunnerOptionGroup';
import RunnersOffBasepaths from './RunnersOffBasepaths';
import SmallRunnerLabel from './SmallRunnerLabel';

import { getShortPlayerName } from 'state/players/selectors';
import {
  getGroupedRunnerOptions,
  getOtherPromptBaserunners,
  getSelectedBase,
  getSelectedRunner,
} from 'state/prompts/selectors';
import { promptActions } from 'state/prompts/slice';
import { useAppSelector } from 'utils/hooks';

import { RunnerOptions } from 'state/prompts/types';
import { BaseType } from '@dugout-companion/shared';

const RunnerPrompt: FC<RunnerOptions> = ({ runnerId }) => {
  const dispatch = useDispatch();

  const options = useAppSelector(getGroupedRunnerOptions);
  const runners = useAppSelector(getOtherPromptBaserunners);
  const selectedRunner = useAppSelector(getSelectedRunner);
  const selectedBase = useAppSelector(getSelectedBase);
  const selectedRunnerName = useAppSelector(state =>
    getShortPlayerName(state, selectedRunner ?? '')
  );

  useEffect(() => {
    // set initial runner
    dispatch(promptActions.setSelectedRunner(runnerId));
  }, [runnerId, dispatch]);

  return (
    <Box fill style={{ position: 'relative' }}>
      {selectedRunner &&
        options.map(({ base, options }) => (
          <RunnerOptionGroup
            key={String(base)}
            runnerId={selectedRunner}
            base={base}
            options={options}
          />
        ))}
      {_.map(runners, (base, runnerId) => (
        <SmallRunnerLabel key={runnerId} runnerId={runnerId} base={base} />
      ))}
      <Box
        pad="small"
        gap="xsmall"
        background="white"
        border
        round="8px"
        align="center"
        style={{
          position: 'absolute',
          top: 0,
          ...(selectedBase !== BaseType.THIRD
            ? { right: 0, transform: 'translate(60%, -30%)' }
            : { left: 0, transform: 'translate(-60%, -30%)' }),
        }}
      >
        <Text size="small">Selected runner:</Text>
        <Text weight="bold">{selectedRunnerName}</Text>
      </Box>
      <RunnerNavigation />
      <RunnersOffBasepaths />
    </Box>
  );
};

export default RunnerPrompt;