import React, { FC, useCallback } from 'react';
import { Box, Button } from 'grommet';
import { Edit, LinkPrevious, Save, Transaction } from 'grommet-icons';
import { DragDropContext, DragDropContextProps } from 'react-beautiful-dnd';

import { TeamRole } from '@sammyers/dc-shared';

import Lineup from './Lineup';

import { isGameInProgress, isLineupEditable } from 'state/game/selectors';
import { gameActions } from 'state/game/slice';
import { useAppDispatch, useAppSelector } from 'utils/hooks';

const ButtonContainer: FC = ({ children }) => (
  <Box
    style={{ position: 'absolute', top: 0 }}
    margin={{ horizontal: 'auto', vertical: 'medium' }}
    direction="row"
    gap="xsmall"
  >
    {children}
  </Box>
);

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

  const handleFlipTeams = useCallback(() => {
    dispatch(gameActions.flipTeams());
  }, [dispatch]);

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
        <Lineup teamRole={TeamRole.AWAY} editable={editable} />
        <ButtonContainer>
          {gameInProgress ? (
            editable ? (
              [
                <Button
                  key="back-button"
                  plain={false}
                  icon={<LinkPrevious />}
                  color="status-critical"
                  onClick={onCancel}
                />,
                <Button
                  key="save-button"
                  primary
                  plain={false}
                  icon={<Save />}
                  color="status-ok"
                  onClick={onSave}
                />,
              ]
            ) : (
              <Button primary plain={false} color="accent-3" icon={<Edit />} onClick={onEdit} />
            )
          ) : (
            <Button plain={false} icon={<Transaction />} onClick={handleFlipTeams} />
          )}
        </ButtonContainer>
        <Lineup teamRole={TeamRole.HOME} editable={editable} />
      </Box>
    </DragDropContext>
  );
};

export default Teams;
