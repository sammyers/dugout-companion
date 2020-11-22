import React, { FC, useMemo, useCallback, useEffect } from 'react';

import { FielderOptions } from 'state/prompts/types';
import { getSelectedFielderOption } from 'state/prompts/selectors';
import { promptActions } from 'state/prompts/slice';
import { useAppSelector, useAppDispatch } from 'utils/hooks';
import OptionSelector from './OptionSelector';

const FielderPrompt: FC<FielderOptions> = ({ options }) => {
  const dispatch = useAppDispatch();

  useEffect(
    () => () => {
      dispatch(promptActions.clearFielderChoice());
    },
    [dispatch]
  );

  const selectedOption = useAppSelector(getSelectedFielderOption);

  const formattedOptions = useMemo(() => options.map(({ label, id }) => ({ label, value: id })), [
    options,
  ]);

  const handleChange = useCallback(
    (value: number) => dispatch(promptActions.setFielderChoice(options[value])),
    [dispatch, options]
  );

  return (
    <OptionSelector options={formattedOptions} value={selectedOption?.id} onChange={handleChange} />
  );
};

export default FielderPrompt;
