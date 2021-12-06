import React, { useCallback } from 'react';
import { Box, Button } from 'grommet';

import EventDetailPrompt from './prompts/EventDetailPrompt';

import { getPlateAppearanceOptions } from 'state/game/selectors';
import { getPlateAppearanceType } from 'state/prompts/selectors';
import { promptActions } from 'state/prompts/slice';
import { useAppDispatch, useAppSelector } from 'utils/hooks';

import { getPlateAppearanceLabel, PlateAppearanceType } from '@sammyers/dc-shared';

const buttonGroups = [
  {
    color: 'status-critical',
    types: [
      PlateAppearanceType.OUT,
      PlateAppearanceType.FIELDERS_CHOICE,
      PlateAppearanceType.DOUBLE_PLAY,
    ],
  },
  {
    color: 'status-ok',
    types: [
      PlateAppearanceType.SINGLE,
      PlateAppearanceType.DOUBLE,
      PlateAppearanceType.TRIPLE,
      PlateAppearanceType.HOMERUN,
    ],
  },
  {
    color: 'neutral-3',
    types: [PlateAppearanceType.WALK, PlateAppearanceType.SACRIFICE_FLY],
  },
];

const EventReporter = () => {
  const dispatch = useAppDispatch();

  const options = useAppSelector(getPlateAppearanceOptions);
  const pendingPlateAppearance = useAppSelector(getPlateAppearanceType);

  const handleClickPlateAppearance = useCallback(
    (paType: PlateAppearanceType) => () => {
      dispatch(promptActions.setPendingPlateAppearance(paType));
    },
    [dispatch]
  );

  return (
    <Box gridArea="reporter" align="center" justify="center">
      {buttonGroups.map(({ color, types }) => (
        <Box key={color} direction="row" align="center" justify="center" alignContent="center" wrap>
          {types
            .filter(paType => options.includes(paType))
            .map(paType => (
              <Button
                key={paType}
                color={color}
                primary
                label={getPlateAppearanceLabel(paType)}
                onClick={handleClickPlateAppearance(paType)}
                margin="small"
              />
            ))}
        </Box>
      ))}
      {pendingPlateAppearance && <EventDetailPrompt />}
    </Box>
  );
};

export default EventReporter;
