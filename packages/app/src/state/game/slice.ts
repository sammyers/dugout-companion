import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import _ from 'lodash';
import undoable, { includeAction } from 'redux-undo';

import { reorderItemInList, moveItemBetweenLists } from 'utils/common';
import { getOnDeckBatter, getBattingTeamRole, getCurrentBaseForRunner } from './partialSelectors';
import {
  getAvailablePositionsForTeam,
  shouldTeamUseFourOutfielders,
  getCurrentLineup,
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
} from './utils';

import {
  FieldingPosition,
  HalfInning,
  TeamRole,
  ContactQuality,
  PlateAppearanceType,
  BaseType,
} from '@dugout-companion/shared';
import {
  Team,
  AddPlayerPayload,
  MovePlayerPayload,
  ChangePlayerPositionPayload,
  GameStatus,
  LineupSpot,
  AppGameState,
  GameEventContainer,
  PlateAppearance,
  ScoredRunner,
  StolenBaseAttempt,
  LineupChange,
} from './types';

const makeInitialTeamState = (role: TeamRole): Team => ({
  name: '',
  role,
  lineups: [],
  winner: null,
});

const initialState: AppGameState = {
  status: GameStatus.NOT_STARTED,
  teams: [makeInitialTeamState(TeamRole.AWAY), makeInitialTeamState(TeamRole.HOME)],
  inning: 1,
  halfInning: HalfInning.TOP,
  baseRunners: [],
  outs: 0,
  gameEventRecords: [],
  score: [0, 0],
  gameLength: 9,
  playerAtBat: '',
  upNextHalfInning: '',
  nextLineupId: 1,
};

const replaceLineup = (state: AppGameState, role: TeamRole, newLineup: LineupSpot[]) => {
  const team = getTeamWithRole(state.teams, role);
  _.last(team.lineups)!.lineupSpots = newLineup;
};

const makeNewLineup = (state: AppGameState, role: TeamRole, lineupSpots?: LineupSpot[]) => {
  const { nextLineupId, teams } = state;
  const team = getTeamWithRole(teams, role);
  const currentLineup = getCurrentLineup(team);
  const lineupBeforeId = _.last(team.lineups)!.id;
  const newLineup = {
    id: nextLineupId,
    originalClientId: nextLineupId,
    lineupSpots: lineupSpots ?? [...currentLineup],
  };
  team.lineups.push(newLineup);
  applyLineupChange(state, { lineupBeforeId, lineupAfterId: newLineup.id });
  state.nextLineupId++;
};

const getNextAvailablePosition = (team: Team) => {
  const takenPositions = getCurrentLineup(team).map(spot => spot.position);
  const allPositions = getAvailablePositionsForTeam(team);
  return _.first(_.difference(allPositions, takenPositions));
};

const changePlayerPosition = (team: Team, playerId: string, position: FieldingPosition) => {
  const lineup = _.last(team.lineups)!;
  lineup.lineupSpots = _.map(lineup.lineupSpots, spot =>
    spot.playerId === playerId ? { playerId, position } : spot
  );
};

const updatePositions = (team: Team) => {
  const fourOutfielders = shouldTeamUseFourOutfielders(team);
  const lineup = getCurrentLineup(team);
  _.forEach(getCurrentLineup(team), ({ position, playerId }) => {
    if (fourOutfielders && position === FieldingPosition.CENTER_FIELD) {
      if (!_.some(lineup, { position: FieldingPosition.LEFT_CENTER })) {
        changePlayerPosition(team, playerId, FieldingPosition.LEFT_CENTER);
      } else if (!_.some(lineup, { position: FieldingPosition.RIGHT_CENTER })) {
        changePlayerPosition(team, playerId, FieldingPosition.RIGHT_CENTER);
      } else {
        changePlayerPosition(team, playerId, getNextAvailablePosition(team)!);
      }
    } else if (
      !fourOutfielders &&
      [FieldingPosition.RIGHT_CENTER, FieldingPosition.LEFT_CENTER].includes(position)
    ) {
      if (!_.some(lineup, { position: FieldingPosition.CENTER_FIELD })) {
        changePlayerPosition(team, playerId, FieldingPosition.CENTER_FIELD);
      } else {
        changePlayerPosition(team, playerId, getNextAvailablePosition(team)!);
      }
    }
  });
};

const cleanUpAfterPlateAppearance = (state: AppGameState) => {
  const nextBatter = getOnDeckBatter(state);
  if (state.outs === 3) {
    state.playerAtBat = state.upNextHalfInning!;
    state.upNextHalfInning = nextBatter;
    state.baseRunners = [];
    state.outs = 0;
    if (state.halfInning === HalfInning.BOTTOM) {
      state.inning++;
    }
    state.halfInning = state.halfInning === HalfInning.TOP ? HalfInning.BOTTOM : HalfInning.TOP;
  } else {
    state.playerAtBat = nextBatter;
  }
};

const updateScore = (state: AppGameState, runs: number = 1) => {
  const index = _.findIndex(state.teams, { role: getBattingTeamRole(state) });
  state.score[index] += runs;
};

export const makeGameEvent = ({
  plateAppearance = null,
  stolenBaseAttempt = null,
  lineupChange = null,
}: Partial<GameEventContainer>): GameEventContainer => ({
  plateAppearance,
  stolenBaseAttempt,
  lineupChange,
});

const recordAndApplyGameEvent = (
  state: AppGameState,
  callback: (
    state: AppGameState,
    recordRunnersScored: (runnersScored: string[], battedIn?: boolean) => void
  ) => GameEventContainer
) => {
  const getRecordedGameState = ({
    playerAtBat,
    inning,
    halfInning,
    outs,
    baseRunners,
    score,
  }: AppGameState) => ({
    playerAtBat,
    inning,
    halfInning,
    outs,
    baseRunners: { ...baseRunners },
    score: [...score],
  });
  const gameStateBefore = getRecordedGameState(state);

  const scoredRunners: ScoredRunner[] = [];
  const recordRunnersScored = (runners: string[], battedIn = true) => {
    scoredRunners.push(...runners.map(runnerId => ({ runnerId, battedIn })));
  };

  const gameEvent = callback(state, recordRunnersScored);
  state.gameEventRecords.push({
    gameEvent,
    scoredRunners,
    gameStateBefore,
    gameStateAfter: getRecordedGameState(state),
  });
};

export const applyLineupChange = (state: AppGameState, lineupChange: LineupChange) => {
  recordAndApplyGameEvent(state, () => makeGameEvent({ lineupChange }));
};

export const applyStolenBaseAttempt = (
  state: AppGameState,
  stolenBaseAttempt: StolenBaseAttempt
) => {
  recordAndApplyGameEvent(state, (state, recordRunnersScored) => {
    const startBase = getCurrentBaseForRunner(state, stolenBaseAttempt.runnerId);
    const runners = runnersToMap(state.baseRunners);
    if (stolenBaseAttempt.success) {
      const endBase = getNewBase(startBase);
      delete runners[startBase];
      if (endBase) {
        runners[endBase] = stolenBaseAttempt.runnerId;
      } else {
        // runner scored
        updateScore(state);
        recordRunnersScored([stolenBaseAttempt.runnerId], false);
      }
    } else {
      delete runners[startBase];
      state.outs++;
    }
    state.baseRunners = runnersFromMap(runners);
    return makeGameEvent({ stolenBaseAttempt });
  });
};

export const applyPlateAppearance = (state: AppGameState, plateAppearance: PlateAppearance) => {
  recordAndApplyGameEvent(state, (state, recordRunnersScored) => {
    let runners = runnersToMap(state.baseRunners);
    switch (plateAppearance.type) {
      case PlateAppearanceType.HOMERUN:
        updateScore(state, _.size(runners) + 1);
        recordRunnersScored([...(_.values(runners) as string[]), state.playerAtBat]);
        runners = {};
        break;
      case PlateAppearanceType.TRIPLE:
        updateScore(state, _.size(runners));
        recordRunnersScored(_.values(runners) as string[]);
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
        updateScore(state, runnersScored.length);
        recordRunnersScored(runnersScored);
        break;
      case PlateAppearanceType.SACRIFICE_FLY:
        _.times(plateAppearance.runsScoredOnSacFly!, () => {
          const [base, runnerId] = getLeadRunner(runners)!;
          moveRunner(runners, base, null);
          updateScore(state);
          recordRunnersScored([runnerId]);
        });
        state.outs++;
        break;
      case PlateAppearanceType.FIELDERS_CHOICE: {
        removeRunner(runners, plateAppearance.outOnPlayRunners[0].runnerId);
        const runnersScored = moveRunnersOnGroundBall(runners);
        runners[BaseType.FIRST] = state.playerAtBat;
        if (runnersScored.length && state.outs < 2) {
          updateScore(state);
          recordRunnersScored(runnersScored);
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
            updateScore(state, runnersScored.length);
            recordRunnersScored(runnersScored, false);
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
            updateScore(state, runnersScored.length);
            recordRunnersScored(runnersScored);
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
            updateScore(state);
            recordRunnersScored(
              [runnerId],
              plateAppearance.type !== PlateAppearanceType.DOUBLE_PLAY
            );
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

const { actions: gameActions, reducer } = createSlice({
  name: 'game',
  initialState,
  reducers: {
    addPlayerToGame(state, { payload: { teamRole, playerId } }: PayloadAction<AddPlayerPayload>) {
      const team = getTeamWithRole(state.teams, teamRole);
      const lineup = getCurrentLineup(team);
      if (!_.some(lineup, { playerId })) {
        const newSpot = { playerId, position: getNextAvailablePosition(team)! };
        if (state.status === GameStatus.IN_PROGRESS) {
          makeNewLineup(state, teamRole);
        }
        getCurrentLineup(team).push(newSpot);
        updatePositions(team);
      }
    },
    movePlayer(state, { payload }: PayloadAction<MovePlayerPayload>) {
      if (payload.fromTeam === payload.toTeam) {
        const team = getTeamWithRole(state.teams, payload.fromTeam);
        const newLineup = reorderItemInList(
          getCurrentLineup(team),
          payload.startIndex,
          payload.endIndex
        );
        if (state.status === GameStatus.IN_PROGRESS) {
          makeNewLineup(state, payload.fromTeam, newLineup);
        } else {
          replaceLineup(state, payload.fromTeam, newLineup);
        }
      } else {
        const sourceTeam = getTeamWithRole(state.teams, payload.fromTeam);
        const destTeam = getTeamWithRole(state.teams, payload.toTeam);
        const oldSourceLineup = getCurrentLineup(sourceTeam);
        const oldDestLineup = getCurrentLineup(destTeam);
        const [newSourceLineup, newDestLineup] = moveItemBetweenLists(
          oldSourceLineup,
          oldDestLineup,
          payload.startIndex,
          payload.endIndex
        );
        const { playerId, position } = oldSourceLineup[payload.startIndex];
        if (state.status === GameStatus.IN_PROGRESS) {
          makeNewLineup(state, payload.fromTeam, newSourceLineup);
          makeNewLineup(state, payload.toTeam, newDestLineup);
        } else {
          replaceLineup(state, payload.fromTeam, newSourceLineup);
          replaceLineup(state, payload.toTeam, newDestLineup);
        }
        const currentPlayerWithPosition = _.find(oldDestLineup, { position });
        if (
          currentPlayerWithPosition ||
          !getAvailablePositionsForTeam(destTeam).includes(position)
        ) {
          changePlayerPosition(destTeam, playerId, getNextAvailablePosition(destTeam)!);
        }
        updatePositions(sourceTeam);
        updatePositions(destTeam);
      }
    },
    removePlayerFromGame(state, { payload }: PayloadAction<string>) {
      const team = state.teams.find(team => _.some(getCurrentLineup(team), { playerId: payload }))!;
      const newLineup = getCurrentLineup(team).filter(spot => spot.playerId !== payload);
      if (state.status === GameStatus.IN_PROGRESS) {
        makeNewLineup(state, team.role, newLineup);
      } else {
        replaceLineup(state, team.role, newLineup);
      }
      updatePositions(team);
    },
    changePlayerPosition(state, { payload }: PayloadAction<ChangePlayerPositionPayload>) {
      const team = state.teams.find(team =>
        _.some(getCurrentLineup(team), { playerId: payload.playerId })
      )!;
      if (state.status === GameStatus.IN_PROGRESS) {
        makeNewLineup(state, team.role);
      }
      const currentPlayerWithPosition = _.find(getCurrentLineup(team), {
        position: payload.position,
      });
      changePlayerPosition(team, payload.playerId, payload.position);

      if (currentPlayerWithPosition) {
        changePlayerPosition(
          team,
          currentPlayerWithPosition.playerId,
          currentPlayerWithPosition.position
        );
      }
    },
    startGame(state) {
      state.playerAtBat = getCurrentLineup(getTeamWithRole(state.teams, TeamRole.AWAY))[0].playerId;
      state.upNextHalfInning = getCurrentLineup(
        getTeamWithRole(state.teams, TeamRole.HOME)
      )[0].playerId;
      state.status = GameStatus.IN_PROGRESS;
    },
    recordPlateAppearance(state, { payload }: PayloadAction<PlateAppearance>) {
      applyPlateAppearance(state, payload);

      const [awayScore, homeScore] = state.score;
      const homeLeadingAfterTop =
        state.outs === 3 && state.halfInning === HalfInning.TOP && awayScore < homeScore;
      const awayLeadingAfterBottom =
        state.outs === 3 && state.halfInning === HalfInning.BOTTOM && awayScore > homeScore;

      if (
        state.inning >= state.gameLength &&
        (homeLeadingAfterTop ||
          awayLeadingAfterBottom ||
          (state.halfInning === HalfInning.BOTTOM && awayScore < homeScore))
      ) {
        state.status = GameStatus.FINISHED;
      } else {
        cleanUpAfterPlateAppearance(state);
      }
    },
    changeGameLength(state, { payload }: PayloadAction<number>) {
      state.gameLength = payload;
    },
    incrementGameLength(state) {
      state.gameLength += 1;
    },
    decrementGameLength(state) {
      state.gameLength -= 1;
    },
    extendGame(state) {
      state.gameLength = Math.max(state.inning, state.gameLength) + 1;
      state.status = GameStatus.IN_PROGRESS;
      cleanUpAfterPlateAppearance(state);
    },
    resetGame(state) {
      return {
        ...initialState,
        teams: state.teams,
      };
    },
    fullResetGame() {
      return { ...initialState };
    },
  },
});

export { gameActions };
export default undoable(reducer, {
  filter: includeAction(gameActions.recordPlateAppearance.type),
  limit: 10,
  syncFilter: true,
});
