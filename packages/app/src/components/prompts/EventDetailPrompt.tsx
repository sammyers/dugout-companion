import React, { useEffect, ReactNode, useCallback } from 'react';
import { Layer, Box, Button, Heading } from 'grommet';

import HitPrompt from './prompts/HitPrompt';
import OutPrompt from './prompts/OutPrompt';
import SacrificeFlyPrompt from './prompts/SacrificeFlyPrompt';
import FieldersChoicePrompt from './prompts/FieldersChoicePrompt';
import DoublePlayPrompt from './prompts/DoublePlayPrompt';

import { getBatterName } from 'state/game/selectors';
import { getPrompt, getPlateAppearanceType } from 'state/prompts/selectors';
import { promptActions } from 'state/prompts/slice';
import { useAppSelector, useAppDispatch } from 'utils/hooks';
import { getPlateAppearanceLabel } from 'utils/labels';

const EventDetailPrompt = () => {
  const dispatch = useAppDispatch();

  const paType = useAppSelector(getPlateAppearanceType)!;
  const prompt = useAppSelector(getPrompt);
  const batter = useAppSelector(getBatterName);

  useEffect(() => () => void dispatch(promptActions.clearPrompt()), [dispatch]);

  const handleSubmit = useCallback(() => {
    dispatch(promptActions.submitPlateAppearance());
  }, [dispatch]);

  useEffect(() => {
    if (!prompt) {
      handleSubmit();
    }
  }, [prompt, handleSubmit]);

  const handleCancelPrompt = useCallback(() => {
    dispatch(promptActions.clearPendingPlateAppearance());
  }, [dispatch]);

  if (!prompt) return null;

  let promptView: ReactNode;
  switch (prompt.kind) {
    case 'hit':
      promptView = <HitPrompt {...prompt} />;
      break;
    case 'out':
      promptView = <OutPrompt {...prompt} />;
      break;
    case 'sacrificeFly':
      promptView = <SacrificeFlyPrompt {...prompt} />;
      break;
    case 'fieldersChoice':
      promptView = <FieldersChoicePrompt {...prompt} />;
      break;
    case 'doublePlay':
      promptView = <DoublePlayPrompt {...prompt} />;
      break;
  }

  return (
    <Layer responsive={false}>
      <Box pad="medium" gap="medium">
        <Box direction="row" justify="around" align="center">
          <Box flex align="start">
            <Button color="status-critical" label="Cancel" onClick={handleCancelPrompt} />
          </Box>
          <Heading level={3} margin="none">
            {getPlateAppearanceLabel(paType)} by {batter}
          </Heading>
          <Box flex align="end" />
        </Box>
        {promptView}
      </Box>
    </Layer>
  );
};

export default EventDetailPrompt;
