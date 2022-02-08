import _ from 'lodash';
import { v4 as uuid4 } from 'uuid';

import {
  getOnDeckBatter,
  getBattingTeamRole,
  getCurrentBaseForRunner,
  isBattingTeamSoloModeOpponent,
} from './partialSelectors';
import {
  getTeamWithRole,
  runnersToMap,
  getNewBase,
  runnersFromMap,
  getDefaultRunnersAfterPlateAppearance,
  getLeadRunner,
  moveRunner,
  removeRunner,
  moveRunnersOnGroundBall,
  getBaseNumber,
  getBaseForRunner,
  isPlayerInLineup,
  getCurrentLineup,
  getAvailablePositionsForLineup,
} from './utils';

import {
  FieldingPosition,
  HalfInning,
  TeamRole,
  ContactQuality,
  PlateAppearanceType,
  BaseType,
} from '@sammyers/dc-shared';
import {
  LineupSpot,
  AppGameState,
  GameEventContainer,
  PlateAppearance,
  ScoredRunner,
  StolenBaseAttempt,
  GameState,
  GameStatus,
  Team,
  SoloModeInning,
} from './types';

const replaceLineup = (state: AppGameState, role: TeamRole, newLineup: LineupSpot[]) => {
  const team = getTeamWithRole(state.teams, role);
  _.last(team.lineups)!.lineupSpots = newLineup;
};

export const getNextAvailablePosition = (lineup: LineupSpot[], addingPlayer = false) => {
  const takenPositions = _.map(lineup, 'position');
  const allPositions = getAvailablePositionsForLineup(lineup, addingPlayer);
  return _.first(_.difference(allPositions, takenPositions)) ?? null;
};

export const changePlayerPosition = (
  lineup: LineupSpot[],
  playerId: string,
  position: FieldingPosition | null = getNextAvailablePosition(lineup)
) =>
  lineup.map(spot => ({
    playerId: spot.playerId,
    position: spot.playerId === playerId ? position : spot.position,
  }));

export const updatePositions = (lineup: LineupSpot[]): LineupSpot[] => {
  const fourOutfielders = lineup.length > 9;
  const takenPositions = _.countBy(lineup, 'position');
  const positionsNotTaken = getAvailablePositionsForLineup(lineup).filter(
    position => !takenPositions[position]
  );
  return _.map(lineup, ({ playerId, position }) => {
    if (fourOutfielders && position === FieldingPosition.CENTER_FIELD) {
      const newPosition = _.find(
        [
          FieldingPosition.LEFT_CENTER,
          FieldingPosition.RIGHT_CENTER,
          getNextAvailablePosition(lineup),
        ],
        pos => !(pos! in takenPositions)
      )!;
      if (newPosition) {
        takenPositions[newPosition] = 1;
      }
      return {
        playerId,
        position: newPosition,
      };
    } else if (
      !fourOutfielders &&
      [FieldingPosition.RIGHT_CENTER, FieldingPosition.LEFT_CENTER].includes(
        position as FieldingPosition
      )
    ) {
      const newPosition = _.find(
        [FieldingPosition.CENTER_FIELD, getNextAvailablePosition(lineup)],
        pos => !(pos! in takenPositions)
      )!;
      if (newPosition) {
        takenPositions[newPosition] = 1;
      }
      return {
        playerId,
        position: newPosition,
      };
    } else if (_.get(takenPositions, position!, 0) > 1) {
      takenPositions[position!] -= 1;
      if (!positionsNotTaken.length) {
        return { playerId, position: null };
      }
      const newPosition = positionsNotTaken.pop()!;
      takenPositions[newPosition] = 1;
      return { playerId, position: newPosition };
    } else if (!position && positionsNotTaken.length) {
      const newPosition = positionsNotTaken.pop()!;
      takenPositions[newPosition] = 1;
      return {
        playerId,
        position: newPosition,
      };
    }
    return { playerId, position };
  });
};

export const cleanUpAfterGameEvent = (state: AppGameState, advanceLineup = true) => {
  const gameState = state.gameState!;
  const currentBatter = gameState.playerAtBat;
  const nextBatter = isBattingTeamSoloModeOpponent(state)
    ? state.soloModeOpponentBatterId
    : getOnDeckBatter(state);
  if (gameState.outs === 3) {
    gameState.playerAtBat = state.upNextHalfInning!;
    if (advanceLineup) {
      state.upNextHalfInning = nextBatter;
    } else {
      state.upNextHalfInning = currentBatter;
    }
    gameState.baseRunners = [];
    gameState.outs = 0;
    if (gameState.halfInning === HalfInning.BOTTOM) {
      gameState.inning++;
    }
    gameState.halfInning =
      gameState.halfInning === HalfInning.TOP ? HalfInning.BOTTOM : HalfInning.TOP;
  } else if (advanceLineup) {
    gameState.playerAtBat = nextBatter;
  }
};

export const getCurrentLineupsFromTeams = (teams: Team[]) =>
  teams
    .filter(team => !team.soloModeOpponent)
    .map(({ role, lineups }) => {
      const { id } = _.last(lineups)!;
      return {
        id,
        team: { role },
      };
    });

export const makeGameEvent = ({
  plateAppearance = null,
  stolenBaseAttempt = null,
  lineupChange = null,
  soloModeOpponentInning = null,
}: Partial<GameEventContainer>): GameEventContainer => ({
  plateAppearance,
  stolenBaseAttempt,
  lineupChange,
  soloModeOpponentInning,
});

type RunnersScoredCallback = (
  args: { runnersScored: string[]; battedIn?: boolean } | { runsScored: number }
) => void;

const recordAndApplyGameEvent = (
  state: AppGameState,
  callback: (
    gameState: GameState,
    recordRunnersScored: RunnersScoredCallback,
    teams: Team[]
  ) => GameEventContainer
) => {
  const gameStateToRecord: GameState = {
    ...state.gameState!,
    baseRunners: [...state.gameState!.baseRunners],
    score: [...state.gameState!.score],
    lineups: [...state.gameState!.lineups!],
  };

  state.prevGameStates.push(gameStateToRecord);
  state.gameState!.id = uuid4();

  const scoredRunners: ScoredRunner[] = [];
  const recordRunnersScored: RunnersScoredCallback = args => {
    const index = _.findIndex(state.teams, { role: getBattingTeamRole(state) });
    let runsScored = 0;
    if ('runnersScored' in args) {
      runsScored = args.runnersScored.length;
      scoredRunners.push(
        ...args.runnersScored.map(runnerId => ({ runnerId, battedIn: args.battedIn ?? true }))
      );
    } else {
      runsScored = args.runsScored;
    }
    state.gameState!.score[index] += runsScored;
  };

  const gameEvent = callback(state.gameState!, recordRunnersScored, state.teams);
  state.gameEventRecords.push({
    eventIndex: state.gameEventRecords.length,
    gameEvent,
    scoredRunners,
    gameStateBeforeId: gameStateToRecord.id,
    gameStateAfterId: state.gameState!.id,
  });

  const { score, outs, halfInning, inning } = state.gameState!;
  const [awayScore, homeScore] = score;
  const homeLeadingAfterTop = outs === 3 && halfInning === HalfInning.TOP && awayScore < homeScore;
  const awayLeadingAfterBottom =
    outs === 3 && halfInning === HalfInning.BOTTOM && awayScore > homeScore;

  if (
    inning >= state.gameLength &&
    (homeLeadingAfterTop ||
      awayLeadingAfterBottom ||
      (halfInning === HalfInning.BOTTOM && homeScore > awayScore))
  ) {
    state.prevGameStates.push(state.gameState!);
    state.status = GameStatus.FINISHED;
    const winningScore = _.max(score)!;
    state.teams.forEach((team, i) => {
      team.winner = score[i] === winningScore;
    });
  } else {
    cleanUpAfterGameEvent(state, !!gameEvent.plateAppearance);
  }
};

const isNotInLineupAnymore = (playerId: string, oldLineup: LineupSpot[], newLineup: LineupSpot[]) =>
  isPlayerInLineup(playerId, oldLineup) && !isPlayerInLineup(playerId, newLineup);

const getNextPlayerAfterLineupChange = (
  removedPlayer: string,
  oldLineup: LineupSpot[],
  newLineup: LineupSpot[]
) => {
  const lineupIndex = oldLineup.findIndex(spot => spot.playerId === removedPlayer);
  if (lineupIndex > newLineup.length - 1) {
    return newLineup[0].playerId;
  }
  return newLineup[lineupIndex].playerId;
};

export const applyMidGameLineupChange = (
  state: AppGameState,
  role: TeamRole,
  lineupSpots: LineupSpot[]
) => {
  recordAndApplyGameEvent(state, (gameState, _recordRunnersScored, teams) => {
    const team = getTeamWithRole(teams, role);
    const lineupBeforeId = _.last(team.lineups)!.id;
    const lineupAfterId = uuid4();
    const newLineup = {
      id: lineupAfterId,
      lineupSpots,
    };
    const oldLineup = getCurrentLineup(team);
    if (isNotInLineupAnymore(gameState.playerAtBat, oldLineup, lineupSpots)) {
      gameState.playerAtBat = getNextPlayerAfterLineupChange(
        gameState.playerAtBat,
        oldLineup,
        newLineup.lineupSpots
      );
    }
    if (isNotInLineupAnymore(state.upNextHalfInning!, oldLineup, lineupSpots)) {
      state.upNextHalfInning = getNextPlayerAfterLineupChange(
        state.upNextHalfInning!,
        oldLineup,
        newLineup.lineupSpots
      );
    }

    team.lineups.push(newLineup);
    gameState.lineups = getCurrentLineupsFromTeams(teams);
    return makeGameEvent({ lineupChange: { lineupBeforeId, lineupAfterId } });
  });
};

export const changeLineup = (state: AppGameState, role: TeamRole, newLineup: LineupSpot[]) => {
  if (state.status === GameStatus.IN_PROGRESS) {
    state.lineupDrafts[role] = newLineup;
  } else {
    replaceLineup(state, role, newLineup);
  }
};

export const applyStolenBaseAttempt = (
  state: AppGameState,
  stolenBaseAttempt: StolenBaseAttempt
) => {
  recordAndApplyGameEvent(state, (gameState, recordRunnersScored) => {
    const startBase = getCurrentBaseForRunner(state, stolenBaseAttempt.runnerId);
    const runners = runnersToMap(gameState.baseRunners);
    if (stolenBaseAttempt.success) {
      const endBase = getNewBase(startBase);
      delete runners[startBase];
      if (endBase) {
        runners[endBase] = stolenBaseAttempt.runnerId;
      } else {
        // runner scored
        recordRunnersScored({ runnersScored: [stolenBaseAttempt.runnerId], battedIn: false });
      }
    } else {
      delete runners[startBase];
      gameState.outs++;
    }
    gameState.baseRunners = runnersFromMap(runners);
    return makeGameEvent({ stolenBaseAttempt });
  });
};

export const applySoloModeInning = (
  state: AppGameState,
  soloModeOpponentInning: SoloModeInning
) => {
  recordAndApplyGameEvent(state, (state, recordRunnersScored) => {
    state.outs += 3;
    recordRunnersScored({ runsScored: soloModeOpponentInning.runsScored });
    return makeGameEvent({ soloModeOpponentInning });
  });
};

export const applyPlateAppearance = (state: AppGameState, plateAppearance: PlateAppearance) => {
  recordAndApplyGameEvent(state, (state, recordRunnersScored) => {
    let runners = runnersToMap(state.baseRunners);
    switch (plateAppearance.type) {
      case PlateAppearanceType.HOMERUN:
        recordRunnersScored({
          runnersScored: [...(_.values(runners) as string[]), state.playerAtBat],
        });
        runners = {};
        break;
      case PlateAppearanceType.TRIPLE:
        recordRunnersScored({ runnersScored: _.values(runners) as string[] });
        runners = { [BaseType.THIRD]: state.playerAtBat };
        break;
      case PlateAppearanceType.DOUBLE:
      case PlateAppearanceType.SINGLE:
      case PlateAppearanceType.WALK:
        const [newBaseRunners, runnersScored] = getDefaultRunnersAfterPlateAppearance(
          runners,
          plateAppearance.type,
          state.playerAtBat!
        );
        runners = newBaseRunners;
        recordRunnersScored({ runnersScored });
        break;
      case PlateAppearanceType.SACRIFICE_FLY:
        _.times(plateAppearance.runsScoredOnSacFly!, () => {
          const [base, runnerId] = getLeadRunner(runners)!;
          moveRunner(runners, base, null);
          recordRunnersScored({ runnersScored: [runnerId] });
        });
        state.outs++;
        break;
      case PlateAppearanceType.FIELDERS_CHOICE: {
        removeRunner(runners, plateAppearance.outOnPlayRunners[0]?.runnerId);
        const runnersScored = moveRunnersOnGroundBall(runners);
        runners[BaseType.FIRST] = state.playerAtBat;
        if (runnersScored.length && state.outs < 2) {
          recordRunnersScored({ runnersScored });
        }
        state.outs++;
        break;
      }
      case PlateAppearanceType.DOUBLE_PLAY:
        state.outs += 2;
        plateAppearance.outOnPlayRunners.forEach(({ runnerId }) => {
          removeRunner(runners, runnerId);
        });
        if (plateAppearance.contact === ContactQuality.GROUNDER) {
          const runnersScored = moveRunnersOnGroundBall(runners);
          if (runnersScored.length && state.outs === 0) {
            recordRunnersScored({ runnersScored, battedIn: false });
          }

          if (!_.some(plateAppearance.outOnPlayRunners, { runnerId: state.playerAtBat })) {
            runners[BaseType.FIRST] = state.playerAtBat;
          }
        }
        break;
      case PlateAppearanceType.OUT:
        if (plateAppearance.contact === ContactQuality.GROUNDER) {
          const runnersScored = moveRunnersOnGroundBall(runners);
          if (runnersScored.length && state.outs < 2) {
            recordRunnersScored({ runnersScored });
          }
        }
        state.outs++;
        break;
    }

    _.forEachRight(
      _.sortBy(plateAppearance.basepathMovements, ({ endBase }) => getBaseNumber(endBase)),
      ({ runnerId, endBase, wasSafe }) => {
        const startBase = getBaseForRunner(runners, runnerId);
        if (wasSafe) {
          if (moveRunner(runners, startBase, endBase)) {
            recordRunnersScored({
              runnersScored: [runnerId],
              battedIn: plateAppearance.type !== PlateAppearanceType.DOUBLE_PLAY,
            });
          }
        } else {
          delete runners[startBase];
          state.outs++;
        }
      }
    );

    state.baseRunners = runnersFromMap(runners);

    return makeGameEvent({ plateAppearance });
  });
};
