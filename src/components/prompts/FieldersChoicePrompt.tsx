import React, { FC, useMemo, useEffect } from 'react';
import { Box } from 'grommet';

import FielderPrompt from './FielderPrompt';
import RunnerPrompt from './RunnerPrompt';
import OutOnPlayPrompt from './OutOnPlayPrompt';

import { getSelectedOutOnPlayOptions } from 'state/prompts/selectors';
import { useAppSelector } from 'utils/hooks';

import { FieldersChoiceOptions, BasePromptProps } from 'state/prompts/types';

const FieldersChoicePrompt: FC<FieldersChoiceOptions & BasePromptProps> = ({
  fielderOptions,
  outOnPlayOptions,
  getNextOptions,
  setCanSubmit,
}) => {
  const [selectedOutOnPlay] = useAppSelector(getSelectedOutOnPlayOptions);

  const canSubmit = outOnPlayOptions.runnerIds.length > 1 ? !!selectedOutOnPlay : true;

  useEffect(() => setCanSubmit(canSubmit), [canSubmit, setCanSubmit]);

  const runnerOptions = useMemo(() => selectedOutOnPlay && getNextOptions?.(selectedOutOnPlay), [
    getNextOptions,
    selectedOutOnPlay,
  ]);

  return (
    <Box gap="medium">
      <FielderPrompt {...fielderOptions} />
      <OutOnPlayPrompt {...outOnPlayOptions} />
      {runnerOptions && <RunnerPrompt {...runnerOptions} />}
    </Box>
  );
};

export default FieldersChoicePrompt;
