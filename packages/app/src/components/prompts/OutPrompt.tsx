import React, { FC, useMemo, useEffect } from 'react';
import { Box } from 'grommet';

import PromptAccordion, { PromptAccordionPanel } from './PromptAccordion';
import PlateAppearancePreview from './PlateAppearancePreview';
import RunnerPrompt from './subprompts/RunnerPrompt';
import ContactPanel from './panels/ContactPanel';

import { useAppSelector } from 'utils/hooks';
import { getSelectedContactOption } from 'state/prompts/selectors';

import { OutOptions, BasePromptProps } from 'state/prompts/types';

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
      <PromptAccordion>
        <ContactPanel contactOptions={contactOptions} fielderOptions={fielderOptions} />
        {runnerOptions && (
          <PromptAccordionPanel label="Runners" preview="">
            <RunnerPrompt {...runnerOptions} />
          </PromptAccordionPanel>
        )}
      </PromptAccordion>
      {!!selectedContactType && <PlateAppearancePreview />}
    </Box>
  );
};

export default OutPrompt;
