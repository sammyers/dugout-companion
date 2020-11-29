import React, { FC, useMemo, useEffect } from 'react';

import PromptAccordion, { PromptAccordionPanel } from './PromptAccordion';
import PlateAppearancePreview from './PlateAppearancePreview';
import ContactPanel from './panels/ContactPanel';
import RunnerPrompt from './subprompts/RunnerPrompt';

import { getSelectedContactOption } from 'state/prompts/selectors';
import { useAppSelector } from 'utils/hooks';

import { HitOptions, BasePromptProps } from 'state/prompts/types';
import { Box } from 'grommet';

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
      <PromptAccordion>
        <ContactPanel contactOptions={contactOptions} fielderOptions={fielderOptions} />
        {runnerOptions && (
          <PromptAccordionPanel label="Runners" preview="">
            <RunnerPrompt {...runnerOptions} />
          </PromptAccordionPanel>
        )}
      </PromptAccordion>
      <PlateAppearancePreview />
    </Box>
  );
};

export default HitPrompt;
