import React, { FC, useCallback } from 'react';
import { Box, Button, Layer, Text } from 'grommet';

import AddPlayer from './AddPlayer';

import { gameActions } from 'state/game/slice';
import { getPlayerName } from 'state/players/selectors';
import { useAppDispatch, useAppSelector } from 'utils/hooks';

interface Props {
  oldPlayerId?: string;
  onClose: () => void;
}

const SubstitutePlayerModal: FC<Props> = ({ oldPlayerId, onClose }) => {
  const dispatch = useAppDispatch();

  const playerName = useAppSelector(state => getPlayerName(state, oldPlayerId ?? ''));

  const handleSelectPlayer = useCallback(
    (newPlayerId: string) => {
      if (oldPlayerId) {
        dispatch(gameActions.substitutePlayer({ newPlayerId, oldPlayerId }));
        // This is kind of a hack but doesn't seem to be hurting anyone so ¯\_(ツ)_/¯
        setTimeout(onClose, 20);
      }
    },
    [oldPlayerId, dispatch, onClose]
  );

  if (oldPlayerId) {
    return (
      <Layer onClickOutside={onClose}>
        <Box pad="medium" gap="medium">
          <Text weight="bold">Substituting for {playerName}</Text>
          <Box gap="xsmall">
            <Text>Choose a player:</Text>
            <AddPlayer placeholder="Search Players" onSelect={handleSelectPlayer} />
          </Box>
          <Button plain={false} color="status-critical" onClick={onClose}>
            Cancel
          </Button>
        </Box>
      </Layer>
    );
  }

  return null;
};

export default SubstitutePlayerModal;
