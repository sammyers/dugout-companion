import React, { FC, useMemo, useCallback } from 'react';

import OptionSelector from '../OptionSelector';

import { getSelectedContactOption } from 'state/prompts/selectors';
import { promptActions } from 'state/prompts/slice';
import { useAppSelector, useAppDispatch } from 'utils/hooks';

import { ContactOptions } from 'state/prompts/types';

const ContactPrompt: FC<ContactOptions> = ({ options, required }) => {
  const dispatch = useAppDispatch();

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
