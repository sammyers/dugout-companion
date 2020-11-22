import React, { useCallback, useState } from 'react';
import { Box, Button } from 'grommet';

import EventDetailPrompt from './prompts/EventDetailPrompt';

import { getPlateAppearanceOptions } from 'state/game/selectors';
import { useAppDispatch, useAppSelector } from 'utils/hooks';
import { getPlateAppearanceLabel } from 'utils/labels';

import { PlateAppearanceType } from 'state/game/types';
import { gameActions } from 'state/game/slice';
import { getPlateAppearanceResult } from 'state/prompts/selectors';

const EventReporter = () => {
  const dispatch = useAppDispatch();

  const options = useAppSelector(getPlateAppearanceOptions);

  const [pendingPlateAppearance, setPendingPlateAppearance] = useState<PlateAppearanceType>();

  const handleSubmitPlateAppearance = useCallback(() => {
    if (pendingPlateAppearance) {
      dispatch((dispatch, getState) => {
        dispatch(
          gameActions.recordGameEvent(getPlateAppearanceResult(getState(), pendingPlateAppearance))
        );
      });
    }
    setPendingPlateAppearance(undefined);
  }, [dispatch, pendingPlateAppearance, setPendingPlateAppearance]);

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
