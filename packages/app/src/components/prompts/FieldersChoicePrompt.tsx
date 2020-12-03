import React, { FC, useMemo, useEffect } from 'react';
import { Box } from 'grommet';

import PlateAppearancePreview from './PlateAppearancePreview';
import FielderPrompt from './subprompts/FielderPrompt';
import RunnerPrompt from './subprompts/RunnerPrompt';
import OutOnPlayPrompt from './subprompts/OutOnPlayPrompt';

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
    <Box gap="medium" margin={{ top: 'small' }}>
      <Box direction="row" gap="small" align="center">
        <FielderPrompt {...fielderOptions} />
        <OutOnPlayPrompt {...outOnPlayOptions} />
      </Box>
      {runnerOptions && <RunnerPrompt {...runnerOptions} />}
      {canSubmit && <PlateAppearancePreview />}
    </Box>
  );
};

export default FieldersChoicePrompt;
