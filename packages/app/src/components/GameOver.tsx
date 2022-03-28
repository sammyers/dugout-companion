import React, { ChangeEvent, useCallback, useEffect, useState } from 'react';
import { formatISO } from 'date-fns';
import {
  Box,
  Button,
  CheckBox,
  Heading,
  Layer,
  Main,
  Notification,
  Text,
  TextInput,
} from 'grommet';
import { Login, Refresh, Resume, Undo } from 'grommet-icons';
import { Navigate } from 'react-router-dom';
import { ActionCreators } from 'redux-undo';

import {
  GroupPermissionType,
  LoginModal,
  LogOutButton,
  useCurrentUser,
  usePermission,
} from '@sammyers/dc-shared';

import DumpReduxStoreButton from './DumpReduxStoreButton';
import SaveGameButton from './SaveGameButton';

import {
  getCurrentGameLength,
  getGameName,
  getGameStatus,
  getMaxGameLength,
  getScore,
  getTimeEnded,
  getWinningTeamName,
  wasGameSaved,
} from 'state/game/selectors';
import { gameActions } from 'state/game/slice';
import { getCurrentGroupId } from 'state/groups/selectors';
import { getNumUnsavedGames } from 'state/unsavedGames/selectors';
import { stashCurrentGameToSaveLater } from 'state/unsavedGames/slice';
import { useAppDispatch, useAppSelector } from 'utils/hooks';
import { useNetworkStatus } from 'utils/network';

import { GameStatus } from 'state/game/types';

const GameOver = () => {
  const dispatch = useAppDispatch();

  const groupId = useAppSelector(getCurrentGroupId)!;
  const online = useNetworkStatus();
  const { currentUser } = useCurrentUser();
  const canSaveGames = usePermission(GroupPermissionType.SAVE_GAMES, groupId);

  const gameStatus = useAppSelector(getGameStatus);
  const winningTeamName = useAppSelector(getWinningTeamName);
  const gameName = useAppSelector(getGameName);
  const timeEnded = useAppSelector(getTimeEnded);
  const [awayScore, homeScore] = useAppSelector(getScore);
  const gameLength = useAppSelector(getCurrentGameLength);
  const maxGameLength = useAppSelector(getMaxGameLength);
  const saved = useAppSelector(wasGameSaved);
  const numUnsavedGames = useAppSelector(getNumUnsavedGames);

  useEffect(() => {
    if (gameStatus === GameStatus.FINISHED && !timeEnded) {
      dispatch(gameActions.setTimeEnded(formatISO(new Date())));
    }
  }, [gameStatus, timeEnded, dispatch]);

  const [keepTeams, setKeepTeams] = useState(true);

  const handleChangeName = useCallback(
    ({ currentTarget }: ChangeEvent<HTMLInputElement>) =>
      dispatch(gameActions.changeGameName(currentTarget.value)),
    [dispatch]
  );

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showConfirmNewGame, setShowConfirmNewGame] = useState(false);
  const [showConfirmExtendGame, setShowConfirmExtendGame] = useState(false);

  const onClickResetGame = useCallback(() => {
    if (!saved) {
      dispatch(stashCurrentGameToSaveLater());
    }
    if (keepTeams) {
      dispatch(gameActions.resetGame());
    } else {
      dispatch(gameActions.fullResetGame());
    }
    setShowConfirmNewGame(false);
  }, [saved, keepTeams, dispatch, setShowConfirmNewGame]);

  const onClickExtendGame = useCallback(() => {
    dispatch(gameActions.extendGame());
    setShowConfirmExtendGame(false);
  }, [dispatch]);

  const undo = useCallback(() => {
    dispatch(ActionCreators.undo());
  }, [dispatch]);

  if (gameStatus === GameStatus.IN_PROGRESS) {
    return <Navigate to="/field" />;
  }
  if (gameStatus === GameStatus.NOT_STARTED) {
    return <Navigate to="/teams" />;
  }

  return (
    <Main flex background="brand" justify="center" align="center">
      {showConfirmNewGame && (
        <Layer onClickOutside={() => setShowConfirmNewGame(false)} background="transparent">
          <Box pad="medium" background="light-2" round gap="small">
            <Heading level={3} margin={{ vertical: 'small' }}>
              New Game
            </Heading>
            <Text>Are you sure you want to start a new game?</Text>
            {!saved && (
              <Box margin="small">
                <Notification
                  status="warning"
                  title="The current game will be stashed locally. It will be uploaded along with the next game you save."
                />
              </Box>
            )}
            <Box direction="row" gap="medium" margin={{ top: 'small' }}>
              <Button
                color="status-critical"
                plain={false}
                label="Cancel"
                onClick={() => setShowConfirmNewGame(false)}
              />
              <Button
                color="status-ok"
                primary
                plain={false}
                label="Confirm"
                onClick={onClickResetGame}
              />
            </Box>
          </Box>
        </Layer>
      )}
      {showConfirmExtendGame && (
        <Layer onClickOutside={() => setShowConfirmExtendGame(false)} background="transparent">
          <Box pad="medium" background="light-2" round gap="small">
            <Heading level={3} margin={{ vertical: 'small' }}>
              Extend Game
            </Heading>
            <Text>Are you sure you want to play another inning?</Text>
            <Box direction="row" gap="medium" margin={{ top: 'small' }}>
              <Button
                color="status-critical"
                plain={false}
                label="Cancel"
                onClick={() => setShowConfirmExtendGame(false)}
              />
              <Button
                color="status-ok"
                primary
                plain={false}
                label="Confirm"
                onClick={onClickExtendGame}
              />
            </Box>
          </Box>
        </Layer>
      )}
      <LoginModal visible={showLoginModal} onClose={() => setShowLoginModal(false)} />
      <Box align="center">
        <Heading level={2} margin={{ bottom: 'small' }}>
          {winningTeamName
            ? `${winningTeamName} win${winningTeamName.endsWith('s') ? '' : 's'}!`
            : 'Tie game!'}
        </Heading>
        <Heading margin={{ bottom: 'large' }}>
          {awayScore} - {homeScore}
        </Heading>
      </Box>
      <Box gap="medium" style={{ maxWidth: '35%' }}>
        <Box gap="xsmall">
          {!saved && (
            <TextInput
              value={gameName!}
              onChange={handleChangeName}
              placeholder="Title this game"
            />
          )}
          {online &&
            (!currentUser ? (
              <>
                <Notification status="critical" title="You must be logged in to save this game." />
                <Button icon={<Login />} label="Log In" onClick={() => setShowLoginModal(true)} />
              </>
            ) : !canSaveGames ? (
              <Notification status="critical" title="You do not have permission to save games." />
            ) : null)}
          <SaveGameButton disabled={!currentUser || !canSaveGames} />
          {online && numUnsavedGames > 0 && (
            <Notification
              status="normal"
              title={`Will also save ${numUnsavedGames} previous game${
                numUnsavedGames > 1 ? 's' : ''
              }`}
            />
          )}
        </Box>
        <Box gap="xsmall">
          <Box direction="row" gap="small" justify="stretch">
            <Button
              icon={<Refresh />}
              style={{ flex: 1 }}
              color="status-ok"
              plain={false}
              label="New Game"
              onClick={() => (saved ? onClickResetGame() : setShowConfirmNewGame(true))}
            />
            <CheckBox
              toggle
              label="Keep Teams"
              checked={keepTeams}
              onChange={e => setKeepTeams(e.target.checked)}
            />
          </Box>
        </Box>
        {gameLength < maxGameLength && (
          <Button
            icon={<Resume />}
            color="light-1"
            plain={false}
            disabled={saved}
            label="Play another inning"
            onClick={() => setShowConfirmExtendGame(true)}
          />
        )}
        {!saved && (
          <Box style={{ position: 'absolute', top: '72px', left: 0 }} margin="small">
            <Button icon={<Undo />} onClick={undo} label="Undo Last Play" />
          </Box>
        )}
        <Box
          style={{ position: 'absolute', bottom: 0, right: 0 }}
          margin="small"
          direction="row"
          gap="small"
        >
          {!!currentUser && online && <LogOutButton color="status-critical" />}
          <DumpReduxStoreButton />
        </Box>
      </Box>
    </Main>
  );
};

export default GameOver;
