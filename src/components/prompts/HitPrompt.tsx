import React, { FC, useMemo, useEffect } from 'react';
import { Box } from 'grommet';

import ContactPrompt from './ContactPrompt';
import FielderPrompt from './FielderPrompt';
import RunnerPrompt from './RunnerPrompt';

import { HitOptions, BasePromptProps } from 'state/prompts/types';
import { getSelectedContactOption } from 'state/prompts/selectors';
import { useAppSelector } from 'utils/hooks';

const HitPrompt: FC<HitOptions & BasePromptProps> = ({
  contactOptions,
  runnerOptions,
  getNextOptions,
  setCanSubmit,
}) => {
  useEffect(() => setCanSubmit(true), [setCanSubmit]);

  const selectedContactType = useAppSelector(getSelectedContactOption);

  const fielderOptions = useMemo(
    () => selectedContactType && getNextOptions(selectedContactType.contactType),
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

export default HitPrompt;
