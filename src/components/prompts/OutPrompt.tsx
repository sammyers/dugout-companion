import React, { FC, useMemo, useEffect } from 'react';
import { Box } from 'grommet';

import ContactPrompt from './ContactPrompt';
import RunnerPrompt from './RunnerPrompt';
import FielderPrompt from './FielderPrompt';

import { OutOptions, BasePromptProps } from 'state/prompts/types';
import { useAppSelector } from 'utils/hooks';
import { getSelectedContactOption } from 'state/prompts/selectors';

const OutPrompt: FC<OutOptions & BasePromptProps> = ({
  contactOptions,
  getNextOptions,
  setCanSubmit,
}) => {
  const selectedContactType = useAppSelector(getSelectedContactOption);

  useEffect(() => setCanSubmit(!!selectedContactType), [selectedContactType, setCanSubmit]);

  const { fielderOptions, runnerOptions } = useMemo(
    () => (selectedContactType && getNextOptions(selectedContactType.contactType)) ?? {},
    [selectedContactType, getNextOptions]
  );

  return (
    <Box gap="medium">
      <ContactPrompt {...contactOptions} />
      {fielderOptions && <FielderPrompt {...fielderOptions} />}
      {runnerOptions && <RunnerPrompt {...runnerOptions} />}
    </Box>
  );
};

export default OutPrompt;
