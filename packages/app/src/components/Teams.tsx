import React, { useCallback } from 'react';
import { Box } from 'grommet';
import { DragDropContext, DragDropContextProps } from 'react-beautiful-dnd';

import { TeamRole } from '@dugout-companion/shared';

import Lineup from './Lineup';

import { gameActions } from 'state/game/slice';
import { useAppDispatch } from 'utils/hooks';

const Teams = () => {
  const dispatch = useAppDispatch();

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
      >
        <Lineup teamRole={TeamRole.AWAY} />
        <Lineup teamRole={TeamRole.HOME} />
      </Box>
    </DragDropContext>
  );
};

export default Teams;
