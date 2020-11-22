import React, { FC, useCallback, useEffect } from 'react';
import _ from 'lodash';

import OptionSelector from './OptionSelector';

import { getSelectedOutOnPlayOptions } from 'state/prompts/selectors';
import { promptActions } from 'state/prompts/slice';
import { getPlayerOptionsForSelector } from 'state/players/selectors';
import { useAppSelector, useAppDispatch } from 'utils/hooks';

import { OutOnPlayOptions } from 'state/prompts/types';

const OutOnPlayPrompt: FC<OutOnPlayOptions> = ({ runnerIds, multiple }) => {
  const dispatch = useAppDispatch();

  const dontShow = !multiple && runnerIds.length === 1;

  useEffect(() => {
    if (dontShow) {
      dispatch(promptActions.setOutOnPlayChoices([runnerIds[0]]));
    }
  }, [dontShow, runnerIds, dispatch]);

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

  if (multiple) {
    return (
      <OptionSelector<string>
        multiple
        options={runnerOptions}
        value={selectedOptions}
        onChange={handleChangeMultiple}
      />
    );
  }
  return (
    <OptionSelector
      options={runnerOptions}
      value={selectedOptions[0]}
      onChange={handleChangeSingle}
    />
  );
};

export default OutOnPlayPrompt;
