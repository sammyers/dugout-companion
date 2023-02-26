import React, { useCallback, useMemo } from 'react';
import { Button, Spinner } from 'grommet';
import {
  buildGameInput,
  canSaveGame,
  useGameInfoStore,
  useLineScoreEntryStore,
  useStatsEntryStore,
  useTeamNamesStore,
} from './state';
import { useCreateGameMutation } from '@sammyers/dc-shared';
import { useNavigate } from 'react-router-dom';
import { Save } from 'grommet-icons';
import { useCurrentGroupId } from '../context';

const SaveManualEntryGameButton = () => {
  const navigate = useNavigate();

  const groupId = useCurrentGroupId();

  const stats = useStatsEntryStore(state => state.stats);
  const teamNames = useTeamNamesStore(state => state.names);
  const gameInfo = useGameInfoStore(({ actions, ...state }) => state);
  const runsPerInning = useLineScoreEntryStore(state => state.runsPerInning);

  const [createGame, { loading }] = useCreateGameMutation({
    onCompleted: result => {
      if (result.createGame?.game) {
        useStatsEntryStore.persist.clearStorage();
        useTeamNamesStore.persist.clearStorage();
        useGameInfoStore.persist.clearStorage();
        useLineScoreEntryStore.persist.clearStorage();
        navigate(`../game/${result.createGame.game.id}`);
      }
    },
  });

  const enabled = useMemo(
    () => canSaveGame(stats, gameInfo, runsPerInning),
    [stats, gameInfo, runsPerInning]
  );

  const handleClick = useCallback(() => {
    const game = buildGameInput(groupId!, gameInfo, teamNames, stats, runsPerInning);
    console.log(game);
    createGame({ variables: { input: { game } } });
  }, [stats, teamNames, gameInfo]);

  return (
    <Button
      primary
      alignSelf="center"
      color="status-ok"
      plain={false}
      onClick={handleClick}
      disabled={!groupId || !enabled || loading}
      icon={loading ? <Spinner /> : <Save />}
      label="Save New Game"
    />
  );
};

export default SaveManualEntryGameButton;
