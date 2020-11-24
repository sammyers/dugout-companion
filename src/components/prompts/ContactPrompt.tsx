import React, { FC, useMemo, useCallback, useEffect } from 'react';

import { getSelectedContactOption } from 'state/prompts/selectors';
import { promptActions } from 'state/prompts/slice';
import { useAppSelector, useAppDispatch } from 'utils/hooks';

import { ContactOptions } from 'state/prompts/types';
import OptionSelector from './OptionSelector';

const ContactPrompt: FC<ContactOptions> = ({ options, required }) => {
  const dispatch = useAppDispatch();

  useEffect(
    () => () => {
      dispatch(promptActions.clearContactChoice());
    },
    [dispatch]
  );

  const selectedOption = useAppSelector(getSelectedContactOption);

  const formattedOptions = useMemo(() => options.map(({ label, id }) => ({ label, value: id })), [
    options,
  ]);

  const handleChange = useCallback(
    (value: number) => {
      dispatch(promptActions.setContactChoice(options[value]));
    },
    [dispatch, options]
  );

  return (
    <OptionSelector options={formattedOptions} value={selectedOption?.id} onChange={handleChange} />
  );
};

export default ContactPrompt;