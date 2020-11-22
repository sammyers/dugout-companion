import React, { FC, useMemo, useEffect } from 'react';
import { Box } from 'grommet';

import ContactPrompt from './ContactPrompt';
import FielderPrompt from './FielderPrompt';
import RunnerPrompt from './RunnerPrompt';
import OutOnPlayPrompt from './OutOnPlayPrompt';

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
      <ContactPrompt {...contactOptions} />
      {nextOptions?.fielderOptions && <FielderPrompt {...nextOptions.fielderOptions} />}
      {nextOptions?.outOnPlayOptions && <OutOnPlayPrompt {...nextOptions.outOnPlayOptions} />}
      {runnerOptions && <RunnerPrompt {...runnerOptions} />}
    </Box>
  );
};

export default DoublePlayPrompt;
