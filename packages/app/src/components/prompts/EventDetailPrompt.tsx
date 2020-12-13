import React, { FC, useMemo, useEffect, ReactNode, useState, createContext } from 'react';
import { Layer, Box, Button, Heading } from 'grommet';

import { PlateAppearanceType } from '@dugout-companion/shared';

import HitPrompt from './HitPrompt';
import OutPrompt from './OutPrompt';
import SacrificeFlyPrompt from './SacrificeFlyPrompt';
import FieldersChoicePrompt from './FieldersChoicePrompt';
import DoublePlayPrompt from './DoublePlayPrompt';

import { createPlateAppearancePromptSelector, getBatterName } from 'state/game/selectors';
import { promptActions } from 'state/prompts/slice';
import { useAppSelector, useAppDispatch } from 'utils/hooks';
import { getPlateAppearanceLabel } from 'utils/labels';

interface Props {
  paType: PlateAppearanceType;
  onSubmit: () => void;
  onCancel: () => void;
}

export const promptContext = createContext(PlateAppearanceType.OUT);

const EventDetailPrompt: FC<Props> = ({ paType, onSubmit, onCancel }) => {
  const dispatch = useAppDispatch();

  const [canSubmit, setCanSubmit] = useState(false);

  const promptSelector = useMemo(() => createPlateAppearancePromptSelector(paType), [paType]);
  const prompt = useAppSelector(promptSelector);
  const batter = useAppSelector(getBatterName);

  useEffect(() => () => void dispatch(promptActions.clearPrompt()), [dispatch]);

  useEffect(() => {
    if (!prompt) {
      onSubmit();
    }
  }, [prompt, onSubmit]);

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
      <Box pad="medium">
        <Heading level={3} margin="none" alignSelf="center">
          {getPlateAppearanceLabel(paType)} by {batter}
        </Heading>
        <promptContext.Provider value={paType}>{promptView}</promptContext.Provider>
        <Box direction="row" margin={{ top: 'medium' }} justify="between" gap="small">
          <Button color="status-critical" label="Cancel" onClick={onCancel} />
          {canSubmit && (
            <Button
              color="status-ok"
              label={`Record ${getPlateAppearanceLabel(paType)}`}
              onClick={onSubmit}
            />
          )}
        </Box>
      </Box>
    </Layer>
  );
};

export default EventDetailPrompt;
