import React, { useCallback } from 'react';
import { Box, Button } from 'grommet';
import { Edit, LinkPrevious, Save } from 'grommet-icons';
import { DragDropContext, DragDropContextProps } from 'react-beautiful-dnd';

import { TeamRole } from '@sammyers/dc-shared';

import Lineup from './Lineup';

import { isGameInProgress, isLineupEditable } from 'state/game/selectors';
import { gameActions } from 'state/game/slice';
import { useAppDispatch, useAppSelector } from 'utils/hooks';

const Teams = () => {
  const dispatch = useAppDispatch();

  const gameInProgress = useAppSelector(isGameInProgress);
  const editable = useAppSelector(isLineupEditable);

  const onEdit = useCallback(() => {
    dispatch(gameActions.editLineup());
  }, [dispatch]);

  const onCancel = useCallback(() => {
    dispatch(gameActions.cancelEditingLineup());
  }, [dispatch]);

  const onSave = useCallback(() => {
    dispatch(gameActions.saveLineup());
  }, [dispatch]);

  const handleDragEnd: DragDropContextProps['onDragEnd'] = useCallback(
    ({ source, destination }) => {
      if (!destination) return;
      dispatch(
        gameActions.movePlayer({
          fromTeam: TeamRole[source.droppableId as keyof typeof TeamRole],
          toTeam: TeamRole[destination.droppableId as keyof typeof TeamRole],
          startIndex: source.index,
          endIndex: destination.index,
        })
      );
    },
    [dispatch]
  );

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Box
        direction="row"
        justify="around"
        pad="medium"
        gap="medium"
        flex={{ shrink: 0 }}
        basis="auto"
        style={{ position: 'relative' }}
      >
        {gameInProgress && (
          <Box
            style={{ position: 'absolute', top: 0 }}
            margin={{ horizontal: 'auto', vertical: 'small' }}
            direction="row"
            gap="xsmall"
          >
            {editable ? (
              [
                <Button
                  plain={false}
                  icon={<LinkPrevious />}
                  color="status-critical"
                  onClick={onCancel}
                />,
                <Button primary plain={false} icon={<Save />} color="status-ok" onClick={onSave} />,
              ]
            ) : (
              <Button primary plain={false} icon={<Edit />} onClick={onEdit} />
            )}
          </Box>
        )}
        <Lineup teamRole={TeamRole.AWAY} editable={editable} />
        <Lineup teamRole={TeamRole.HOME} editable={editable} />
      </Box>
    </DragDropContext>
  );
};

export default Teams;
