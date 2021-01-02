import React, { useEffect, ReactNode, useState, useCallback } from 'react';
import { Layer, Box, Button, Heading } from 'grommet';

import HitPrompt from './HitPrompt';
import OutPrompt from './OutPrompt';
import SacrificeFlyPrompt from './SacrificeFlyPrompt';
import FieldersChoicePrompt from './FieldersChoicePrompt';
import DoublePlayPrompt from './DoublePlayPrompt';

import { getBatterName } from 'state/game/selectors';
import { getPrompt, getPlateAppearanceType } from 'state/prompts/selectors';
import { promptActions } from 'state/prompts/slice';
import { useAppSelector, useAppDispatch } from 'utils/hooks';
import { getPlateAppearanceLabel } from 'utils/labels';

const EventDetailPrompt = () => {
  const dispatch = useAppDispatch();

  const [canSubmit, setCanSubmit] = useState(false);

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
      promptView = <HitPrompt {...prompt} setCanSubmit={setCanSubmit} />;
      break;
    case 'out':
      promptView = <OutPrompt {...prompt} setCanSubmit={setCanSubmit} />;
      break;
    case 'sacrificeFly':
      promptView = <SacrificeFlyPrompt {...prompt} setCanSubmit={setCanSubmit} />;
      break;
    case 'fieldersChoice':
      promptView = <FieldersChoicePrompt {...prompt} setCanSubmit={setCanSubmit} />;
      break;
    case 'doublePlay':
      promptView = <DoublePlayPrompt {...prompt} setCanSubmit={setCanSubmit} />;
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
          <Box flex align="end">
            {canSubmit && (
              <Button
                color="status-ok"
                label={`Record ${getPlateAppearanceLabel(paType)}`}
                onClick={handleSubmit}
              />
            )}
          </Box>
        </Box>
        {promptView}
      </Box>
    </Layer>
  );
};

export default EventDetailPrompt;
