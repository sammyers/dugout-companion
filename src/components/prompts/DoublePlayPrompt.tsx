import React, { FC, useMemo, useEffect } from 'react';
import { Box } from 'grommet';

import PromptAccordion, { PromptAccordionPanel } from './PromptAccordion';
import PlateAppearancePreview from './PlateAppearancePreview';
import ContactPanel from './panels/ContactPanel';
import RunnerPrompt from './subprompts/RunnerPrompt';
import OutOnPlayPrompt, { shouldShowOOPPrompt } from './subprompts/OutOnPlayPrompt';

import { getSelectedOutOnPlayOptions, getSelectedContactOption } from 'state/prompts/selectors';
import { useAppSelector } from 'utils/hooks';

import { DoublePlayOptions, BasePromptProps } from 'state/prompts/types';

const DoublePlayPrompt: FC<DoublePlayOptions & BasePromptProps> = ({
  contactOptions,
  getNextOptions,
  setCanSubmit,
}) => {
  const selectedContactType = useAppSelector(getSelectedContactOption);
  const selectedOutsOnPlay = useAppSelector(getSelectedOutOnPlayOptions);

  const nextOptions = useMemo(
    () => selectedContactType && getNextOptions(selectedContactType.contactType),
    [getNextOptions, selectedContactType]
  );

  const outsOnPlayFulfilled =
    !!nextOptions &&
    (!nextOptions.outOnPlayOptions ||
      selectedOutsOnPlay.length === (nextOptions.outOnPlayOptions.multiple ? 2 : 1));
  const canSubmit = !!selectedContactType && outsOnPlayFulfilled;

  useEffect(() => setCanSubmit(canSubmit), [canSubmit, setCanSubmit]);

  const runnerOptions = useMemo(
    () =>
      nextOptions &&
      !!selectedOutsOnPlay.length &&
      nextOptions.getNextOptions?.(selectedOutsOnPlay),
    [nextOptions, selectedOutsOnPlay]
  );

  return (
    <Box gap="medium">
      <PromptAccordion>
        <ContactPanel
          contactOptions={contactOptions}
          fielderOptions={nextOptions?.fielderOptions}
        />
        {nextOptions?.outOnPlayOptions &&
          (shouldShowOOPPrompt(nextOptions.outOnPlayOptions) ? (
            <PromptAccordionPanel
              label={`Runner${nextOptions.outOnPlayOptions.multiple ? 's' : ''} out on play`}
              preview=""
            >
              <OutOnPlayPrompt {...nextOptions.outOnPlayOptions} showTitle={false} />
            </PromptAccordionPanel>
          ) : (
            <OutOnPlayPrompt {...nextOptions.outOnPlayOptions} />
          ))}
        {runnerOptions && (
          <PromptAccordionPanel label="Runners" preview="">
            <RunnerPrompt {...runnerOptions} />
          </PromptAccordionPanel>
        )}
      </PromptAccordion>
      {canSubmit && <PlateAppearancePreview />}
    </Box>
  );
};

export default DoublePlayPrompt;
