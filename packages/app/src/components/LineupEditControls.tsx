import React, { useCallback } from 'react';
import { Box, Button } from 'grommet';
import { Edit, LinkPrevious, Save } from 'grommet-icons';

import { isLineupEditable } from 'state/game/selectors';
import { gameActions } from 'state/game/slice';
import { useAppDispatch, useAppSelector } from 'utils/hooks';

const LineupEditControls = () => {
  const dispatch = useAppDispatch();

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

  return (
    <Box direction="row" gap="small">
      {editable ? (
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
      )}
    </Box>
  );
};

export default LineupEditControls;
