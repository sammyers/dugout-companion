import React, { useCallback } from 'react';
import { Box } from 'grommet';
import _ from 'lodash';

import OptionSelector from '../OptionSelector';

import { getDetailedOutOnPlayOptions, getSelectedOutOnPlayOptions } from 'state/prompts/selectors';
import { promptActions } from 'state/prompts/slice';
import { useAppSelector, useAppDispatch } from 'utils/hooks';
import { usePromptContext } from '../context';

import { OutOnPlayOptions } from 'state/prompts/types';

export const shouldShowOOPPrompt = ({ multiple, runnerIds }: OutOnPlayOptions) =>
  multiple ? runnerIds.length > 2 : runnerIds.length > 1;

const OutOnPlayPrompt = () => {
  const { outOnPlayOptions } = usePromptContext();
  const { multiple, runnerIds } = outOnPlayOptions!;

  const dispatch = useAppDispatch();

  const dontShow = !shouldShowOOPPrompt(outOnPlayOptions!);

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

  const runnerOptions = useAppSelector(state => getDetailedOutOnPlayOptions(state, runnerIds));

  if (dontShow) return null;

  return (
    <Box fill>
      {multiple ? (
        <OptionSelector<string>
          vertical
          multiple
          options={runnerOptions}
          value={selectedOptions}
          onChange={handleChangeMultiple}
        />
      ) : (
        <OptionSelector
          vertical
          options={runnerOptions}
          value={selectedOptions[0]}
          onChange={handleChangeSingle}
        />
      )}
    </Box>
  );
};

export default OutOnPlayPrompt;
