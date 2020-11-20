import React, { FC, useMemo, useEffect, useState, ReactNode } from 'react';
import { Layer, Box, Button } from 'grommet';

import { createPlateAppearancePromptSelector } from 'state/game/selectors';
import { useAppSelector, useAppDispatch } from 'utils/hooks';

import { PlateAppearanceType } from 'state/game/types';
import RunnerPrompt from './RunnerPrompt';
import { promptActions } from 'state/prompts/slice';
import ContactPrompt from './ContactPrompt';

interface Props {
  paType: PlateAppearanceType;
  onSubmit: () => void;
  onCancel: () => void;
}

const EventDetailPrompt: FC<Props> = ({ paType, onSubmit, onCancel }) => {
  const dispatch = useAppDispatch();

  const promptSelector = useMemo(() => createPlateAppearancePromptSelector(paType), [paType]);
  const prompt = useAppSelector(promptSelector);

  useEffect(() => () => void dispatch(promptActions.clearPrompt()), [dispatch]);

  useEffect(() => {
    if (!prompt) {
      onSubmit();
    }
  }, [prompt, onSubmit]);

  if (!prompt) return null;

  let promptSections: ReactNode;
  switch (prompt.kind) {
    case 'hit':
      promptSections = (
        <>
          <ContactPrompt {...prompt.contactOptions} />
          {prompt.runnerOptions && <RunnerPrompt {...prompt.runnerOptions} />}
        </>
      );
      break;
    case 'out':
      promptSections = (
        <>
          <ContactPrompt {...prompt.contactOptions} />
        </>
      );
  }

  return (
    <Layer>
      <Box pad="small">
        {promptSections}
        <Box direction="row">
          <Button color="status-critical" label="Cancel" onClick={onCancel} />
        </Box>
      </Box>
    </Layer>
  );
};

export default EventDetailPrompt;
