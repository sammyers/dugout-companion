import React, { useCallback } from 'react';
import { Box, Button } from 'grommet';

import { PlateAppearanceType } from 'state/game/types';
import { gameActions } from 'state/game/slice';
import { useAppDispatch, useAppSelector } from 'utils/hooks';
import { getPlateAppearanceOptions } from 'state/game/selectors';

const EventReporter = () => {
  const dispatch = useAppDispatch();

  const options = useAppSelector(getPlateAppearanceOptions);

  const reportPlateAppearance = useCallback(
    (paType: PlateAppearanceType) => () => {
      dispatch(
        gameActions.recordGameEvent({
          kind: 'plateAppearance',
          type: paType,
          runnersOutOnPlay: [],
          extraBasesTaken: {},
          extraOutsOnBasepaths: {},
        })
      );
    },
    [dispatch]
  );

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
        <Button key={paType} plain={false} onClick={reportPlateAppearance(paType)} margin="small">
          {paType}
        </Button>
      ))}
    </Box>
  );
};

export default EventReporter;
