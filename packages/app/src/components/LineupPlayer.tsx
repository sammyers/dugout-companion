import React, { useCallback, FC, useMemo } from 'react';
import { Box, Text, Button, Select, ThemeContext } from 'grommet';
import { Close } from 'grommet-icons';
import { Draggable } from 'react-beautiful-dnd';

import { FieldingPosition, TeamRole } from '@dugout-companion/shared';

import { getAvailablePositions, getPlayerPosition } from 'state/game/selectors';
import { gameActions } from 'state/game/slice';
import { getPlayerName } from 'state/players/selectors';
import { useAppSelector, useAppDispatch } from 'utils/hooks';
import { getPositionAbbreviation } from 'utils/labels';

import { LineupSpot } from 'state/game/types';

interface Props extends LineupSpot {
  team: TeamRole;
  index: number;
}

const LineupPlayer: FC<Props> = ({ playerId, index, team }) => {
  const dispatch = useAppDispatch();

  const name = useAppSelector(state => getPlayerName(state, playerId));
  const position = useAppSelector(state => getPlayerPosition(state, playerId));

  const availablePositions = useAppSelector(state => getAvailablePositions(state, team));
  const positionOptions = useMemo(
    () =>
      availablePositions.map(position => ({
        position,
        label: getPositionAbbreviation(position),
      })),
    [availablePositions]
  );

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
          <ThemeContext.Extend value={{ global: { size: { xsmall: '108px' } } }}>
            <Box width="xsmall" margin={{ right: 'small' }}>
              <Select
                value={position}
                options={positionOptions}
                labelKey="label"
                valueKey={{ key: 'position', reduce: true }}
                onChange={handleChangePosition}
              />
            </Box>
          </ThemeContext.Extend>
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
