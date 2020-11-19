import React, { useCallback, FC } from 'react';
import { Box, Text, Button, Select } from 'grommet';
import { Close } from 'grommet-icons';
import { Draggable } from 'react-beautiful-dnd';

import { getPlayerPosition } from 'state/game/selectors';
import { gameActions } from 'state/game/slice';
import { allPositions } from 'state/game/utils';
import { getShortPlayerName } from 'state/players/selectors';
import { useAppSelector, useAppDispatch } from 'utils/hooks';
import { getPositionAbbreviation } from 'utils/labels';

import { FieldingPosition } from 'state/game/types';

interface Props {
  playerId: string;
  index: number;
}

const positionOptions = allPositions.map(position => ({
  position,
  label: getPositionAbbreviation(position),
}));

const LineupPlayer: FC<Props> = ({ playerId, index }) => {
  const dispatch = useAppDispatch();

  const name = useAppSelector(state => getShortPlayerName(state, playerId));
  const position = useAppSelector(state => getPlayerPosition(state, playerId));

  const handleRemove = useCallback(() => {
    dispatch(gameActions.removePlayerFromGame(playerId));
  }, [playerId, dispatch]);

  const handleChangePosition = useCallback(
    ({ value }: { value: FieldingPosition }) => {
      dispatch(gameActions.changePlayerPosition({ playerId, position: value }));
    },
    [dispatch, playerId]
  );

  return (
    <Draggable draggableId={playerId} index={index}>
      {({ innerRef, draggableProps, dragHandleProps }) => (
        <Box
          ref={innerRef}
          {...draggableProps}
          {...dragHandleProps}
          direction="row"
          height="xxsmall"
          align="center"
          justify="between"
        >
          <Text margin={{ right: 'auto' }}>{name}</Text>
          <Box width="xsmall" margin={{ right: 'small' }}>
            <Select
              value={position}
              options={positionOptions}
              labelKey="label"
              valueKey={{ key: 'position', reduce: true }}
              onChange={handleChangePosition}
            />
          </Box>
          <Button
            plain={false}
            icon={<Close size="small" color="status-critical" />}
            color="status-critical"
            onClick={handleRemove}
          />
        </Box>
      )}
    </Draggable>
  );
};

export default LineupPlayer;
