import React, { FC, useMemo, useCallback, ChangeEvent, useEffect } from 'react';
import { RunnerOptions, ContactOptions } from 'state/prompts/types';
import { useAppSelector, useAppDispatch } from 'utils/hooks';
import { getSelectedRunnerOption, getSelectedContactOption } from 'state/prompts/selectors';
import { Box, RadioButtonGroup, Button } from 'grommet';
import { promptActions } from 'state/prompts/slice';

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
    ({ target }: ChangeEvent<HTMLInputElement>) => {
      dispatch(promptActions.setContactChoice(options[parseInt(target.value)]));
    },
    [dispatch, options]
  );

  return (
    <RadioButtonGroup
      name="contact_options"
      options={formattedOptions}
      value={selectedOption?.id}
      onChange={handleChange}
      direction="row"
      gap="xsmall"
    />
  );
};

export default ContactPrompt;
