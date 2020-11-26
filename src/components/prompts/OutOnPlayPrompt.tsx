import React, { FC, useCallback, useEffect } from 'react';
import { Box, Heading } from 'grommet';
import _ from 'lodash';

import OptionSelector from './OptionSelector';

import { getSelectedOutOnPlayOptions } from 'state/prompts/selectors';
import { promptActions } from 'state/prompts/slice';
import { getPlayerOptionsForSelector } from 'state/players/selectors';
import { useAppSelector, useAppDispatch } from 'utils/hooks';

import { OutOnPlayOptions } from 'state/prompts/types';

const OutOnPlayPrompt: FC<OutOnPlayOptions> = ({ runnerIds, multiple }) => {
  const dispatch = useAppDispatch();

  const dontShow = multiple ? runnerIds.length === 2 : runnerIds.length === 1;

  useEffect(() => {
    if (dontShow) {
      if (multiple) {
        dispatch(promptActions.setOutOnPlayChoices(runnerIds));
      } else {
        dispatch(promptActions.setOutOnPlayChoices([runnerIds[0]]));
      }
    }
  }, [multiple, dontShow, runnerIds, dispatch]);

  const selectedOptions = useAppSelector(getSelectedOutOnPlayOptions);

  const handleChangeSingle = useCallback(
    (value: string) => {
      dispatch(promptActions.setOutOnPlayChoices([value]));
    },
    [dispatch]
  );

  const handleChangeMultiple = useCallback(
    (value: string[]) => {
      dispatch(promptActions.setOutOnPlayChoices(value.length > 2 ? _.slice(value, 1) : value));
    },
    [dispatch]
  );

  const runnerOptions = useAppSelector(state => getPlayerOptionsForSelector(state, runnerIds));

  if (dontShow) return null;

  let selector;
  if (multiple) {
    selector = (
      <OptionSelector<string>
        multiple
        options={runnerOptions}
        value={selectedOptions}
        onChange={handleChangeMultiple}
      />
    );
  } else {
    selector = (
      <OptionSelector
        options={runnerOptions}
        value={selectedOptions[0]}
        onChange={handleChangeSingle}
      />
    );
  }
  return (
    <Box>
      <Heading level={4} margin={{ top: 'none', bottom: 'xsmall' }} alignSelf="center">
        {multiple ? 'Runners' : 'Runner'} out on play
      </Heading>
      {selector}
    </Box>
  );
};

export default OutOnPlayPrompt;
