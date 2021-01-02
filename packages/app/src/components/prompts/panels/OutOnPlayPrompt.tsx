import React, { useCallback } from 'react';
import { Box } from 'grommet';
import _ from 'lodash';

import OptionSelector from '../OptionSelector';

import { getSelectedOutOnPlayOptions } from 'state/prompts/selectors';
import { promptActions } from 'state/prompts/slice';
import { getPlayerOptionsForSelector } from 'state/players/selectors';
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

  const runnerOptions = useAppSelector(state => getPlayerOptionsForSelector(state, runnerIds));

  if (dontShow) return null;

  return (
    <Box>
      {multiple ? (
        <OptionSelector<string>
          multiple
          options={runnerOptions}
          value={selectedOptions}
          onChange={handleChangeMultiple}
        />
      ) : (
        <OptionSelector
          options={runnerOptions}
          value={selectedOptions[0]}
          onChange={handleChangeSingle}
        />
      )}
    </Box>
  );
};

export default OutOnPlayPrompt;
