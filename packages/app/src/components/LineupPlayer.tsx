import React, { useCallback, FC, useMemo } from 'react';
import { Box, Text, Button, Select, ThemeContext, Stack } from 'grommet';
import { Close, PowerCycle } from 'grommet-icons';
import { Draggable } from 'react-beautiful-dnd';

import { FieldingPosition, getPositionAbbreviation, TeamRole } from '@sammyers/dc-shared';

import {
  canReorderPlayer,
  getAvailablePositions,
  getPlayerPosition,
  isGameInProgress,
} from 'state/game/selectors';
import { gameActions } from 'state/game/slice';
import { getPlayerName } from 'state/players/selectors';
import { useAppSelector, useAppDispatch } from 'utils/hooks';

import { LineupSpot } from 'state/game/types';

interface Props extends LineupSpot {
  team: TeamRole;
  index: number;
  editable: boolean;
  atBat: boolean;
  upNextInning: boolean;
  onSubstitute: () => void;
}

const LineupPlayer: FC<Props> = ({
  playerId,
  index,
  team,
  editable,
  atBat,
  upNextInning,
  onSubstitute,
}) => {
  const dispatch = useAppDispatch();

  const name = useAppSelector(state => getPlayerName(state, playerId));
  const position = useAppSelector(state => getPlayerPosition(state, playerId));
  const gameInProgress = useAppSelector(isGameInProgress);
  const canReorder = useAppSelector(state => canReorderPlayer(state, team, index));

  const availablePositions = useAppSelector(state => getAvailablePositions(state, team));
  const positionOptions = useMemo(
    () =>
      availablePositions
        .map(position => ({
          position: position as FieldingPosition | '',
          label: getPositionAbbreviation(position),
        }))
        .concat({ position: '', label: '' }),
    [availablePositions]
  );

  const handleRemove = useCallback(() => {
    dispatch(gameActions.removePlayerFromGame(playerId));
  }, [playerId, dispatch]);

  const handleChangePosition = useCallback(
    ({ value }: { value: FieldingPosition | '' }) => {
      dispatch(gameActions.changePlayerPosition({ playerId, position: value || null }));
    },
    [dispatch, playerId]
  );

  return (
    <Draggable draggableId={playerId} index={index} isDragDisabled={!canReorder}>
      {({ innerRef, draggableProps, dragHandleProps }) => (
        <Box
          ref={innerRef}
          {...draggableProps}
          {...dragHandleProps}
          direction="row"
          height="xxsmall"
          align="center"
          justify="between"
          margin={{ vertical: '2px' }}
        >
          <Stack anchor="top-left" margin={editable ? { right: 'auto' } : undefined}>
            <Box
              round="xsmall"
              pad="small"
              background={
                !editable && atBat ? 'accent-4' : !editable && upNextInning ? 'light-4' : 'initial'
              }
            >
              <Text>{name}</Text>
            </Box>
            {!editable &&
              (atBat ? (
                <Box
                  pad="xsmall"
                  background="neutral-2"
                  round
                  style={{ transform: 'translate(-30%, -50%)' }}
                >
                  <Text size="xsmall">Batting</Text>
                </Box>
              ) : upNextInning ? (
                <Box
                  pad="xsmall"
                  background="neutral-3"
                  round
                  style={{ transform: 'translate(-30%, -50%)' }}
                >
                  <Text size="xsmall">Up Next Inning</Text>
                </Box>
              ) : null)}
          </Stack>
          {editable ? (
            <>
              <ThemeContext.Extend
                value={{
                  global: { size: { xsmall: '108px' }, edgeSize: { small: '8px' } },
                  button: { border: { radius: '50%' } },
                }}
              >
                <Box width="xsmall">
                  <Select
                    value={position ?? ''}
                    options={positionOptions}
                    labelKey="label"
                    valueKey={{ key: 'position', reduce: true }}
                    onChange={handleChangePosition}
                    margin={{ right: 'small' }}
                  />
                </Box>
                {gameInProgress && (
                  <Button
                    icon={<PowerCycle color="accent-2" />}
                    color="accent-2"
                    margin={{ right: 'small' }}
                    onClick={onSubstitute}
                  />
                )}
                <Button icon={<Close color="status-critical" />} onClick={handleRemove} />
              </ThemeContext.Extend>
            </>
          ) : (
            <Text
              weight="bold"
              style={{ fontStyle: 'italic' }}
              margin={{ left: 'medium', right: 'auto' }}
            >
              {position ? getPositionAbbreviation(position) : ''}
            </Text>
          )}
        </Box>
      )}
    </Draggable>
  );
};

export default LineupPlayer;
