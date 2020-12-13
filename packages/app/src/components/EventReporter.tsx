import React, { useCallback, useState } from 'react';
import { Box, Button } from 'grommet';

import { PlateAppearanceType } from '@dugout-companion/shared';

import EventDetailPrompt from './prompts/EventDetailPrompt';

import { getPlateAppearanceOptions } from 'state/game/selectors';
import { gameActions } from 'state/game/slice';
import { getPlateAppearanceResult } from 'state/prompts/selectors';
import { useAppDispatch, useAppSelector } from 'utils/hooks';
import { getPlateAppearanceLabel } from 'utils/labels';

const buttonGroups = [
  {
    color: 'neutral-4',
    types: [
      PlateAppearanceType.OUT,
      PlateAppearanceType.FIELDERS_CHOICE,
      PlateAppearanceType.DOUBLE_PLAY,
    ],
  },
  {
    color: 'neutral-3',
    types: [
      PlateAppearanceType.SINGLE,
      PlateAppearanceType.DOUBLE,
      PlateAppearanceType.TRIPLE,
      PlateAppearanceType.HOMERUN,
    ],
  },
  {
    color: 'neutral-1',
    types: [PlateAppearanceType.WALK, PlateAppearanceType.SACRIFICE_FLY],
  },
];

const EventReporter = () => {
  const dispatch = useAppDispatch();

  const options = useAppSelector(getPlateAppearanceOptions);

  const [pendingPlateAppearance, setPendingPlateAppearance] = useState<PlateAppearanceType>();

  const handleSubmitPlateAppearance = useCallback(() => {
    if (pendingPlateAppearance) {
      dispatch((dispatch, getState) => {
        dispatch(
          gameActions.recordPlateAppearance(
            getPlateAppearanceResult(getState(), pendingPlateAppearance)
          )
        );
      });
    }
    setPendingPlateAppearance(undefined);
  }, [dispatch, pendingPlateAppearance, setPendingPlateAppearance]);

  const handleCancelPrompt = useCallback(() => {
    setPendingPlateAppearance(undefined);
  }, [setPendingPlateAppearance]);

  return (
    <Box gridArea="reporter" align="center" justify="center">
      {buttonGroups.map(({ color, types }) => (
        <Box direction="row" align="center" justify="center" alignContent="center" wrap>
          {types
            .filter(paType => options.includes(paType))
            .map(paType => (
              <Button
                key={paType}
                color={color}
                label={getPlateAppearanceLabel(paType)}
                onClick={() => setPendingPlateAppearance(paType)}
                margin="small"
              />
            ))}
        </Box>
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
