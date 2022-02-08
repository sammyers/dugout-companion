import React, { FC, useCallback } from 'react';
import { Button, ButtonProps } from 'grommet';
import { useNavigate } from 'react-router-dom';

import { canStartGame } from 'state/game/selectors';
import { gameActions } from 'state/game/slice';
import { useAppDispatch, useAppSelector } from 'utils/hooks';

const StartButton: FC<ButtonProps> = props => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const gameCanStart = useAppSelector(canStartGame);

  const startGame = useCallback(() => {
    dispatch(gameActions.startGame());
    navigate('/field');
  }, [dispatch, navigate]);

  return (
    <Button plain={false} disabled={!gameCanStart} onClick={startGame} {...props}>
      Start Game
    </Button>
  );
};

export default StartButton;
