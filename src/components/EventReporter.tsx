import React, { useCallback, useState, useMemo } from 'react';
import { Box, Button, Layer } from 'grommet';

import { PlateAppearanceType } from 'state/game/types';
import { gameActions } from 'state/game/slice';
import {
  getPlateAppearanceOptions,
  getCurrentBatter,
  getNumOuts,
  getRunners,
  createPlateAppearancePromptSelector,
} from 'state/game/selectors';
import { useAppDispatch, useAppSelector } from 'utils/hooks';
import { getPlateAppearanceLabel } from 'utils/labels';
import EventDetailPrompt from './prompts/EventDetailPrompt';

const EventReporter = () => {
  const dispatch = useAppDispatch();

  const options = useAppSelector(getPlateAppearanceOptions);

  const [pendingPlateAppearance, setPendingPlateAppearance] = useState<PlateAppearanceType>();

  const handleSubmitPlateAppearance = useCallback(() => {
    setPendingPlateAppearance(undefined);
  }, [dispatch, setPendingPlateAppearance]);

  const handleCancelPrompt = useCallback(() => {
    setPendingPlateAppearance(undefined);
  }, [setPendingPlateAppearance]);

  return (
    <Box
      gridArea="reporter"
      direction="row"
      wrap
      align="center"
      justify="center"
      alignContent="center"
    >
      {options.map(paType => (
        <Button
          key={paType}
          label={getPlateAppearanceLabel(paType)}
          onClick={() => setPendingPlateAppearance(paType)}
          margin="small"
        />
      ))}
      {pendingPlateAppearance && (
        <EventDetailPrompt
          paType={pendingPlateAppearance}
          onSubmit={handleSubmitPlateAppearance}
          onCancel={handleCancelPrompt}
        />
      )}
    </Box>
  );
};

export default EventReporter;
