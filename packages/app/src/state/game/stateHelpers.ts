import _ from 'lodash';
import { v4 as uuid4 } from 'uuid';

import { getOnDeckBatter, getBattingTeamRole, getCurrentBaseForRunner } from './partialSelectors';
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
  allPositions,
  isPlayerInLineup,
  getCurrentLineup,
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
} from './types';

const replaceLineup = (state: AppGameState, role: TeamRole, newLineup: LineupSpot[]) => {
  const team = getTeamWithRole(state.teams, role);
  _.last(team.lineups)!.lineupSpots = newLineup;
};

const shouldLineupHaveFourOutfielders = (lineup: LineupSpot[], addingPlayer = false) =>
  lineup.length > (addingPlayer ? 8 : 9);
const getAvailablePositionsForLineup = (lineup: LineupSpot[], addingPlayer = false) => {
  if (shouldLineupHaveFourOutfielders(lineup, addingPlayer)) {
    return allPositions.filter(position => position !== FieldingPosition.CENTER_FIELD);
  }
  return allPositions.filter(
    position => ![FieldingPosition.RIGHT_CENTER, FieldingPosition.LEFT_CENTER].includes(position)
  );
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
  const positions = new Set(_.map(lineup, 'position'));
  const positionsNotTaken = getAvailablePositionsForLineup(lineup).filter(
    position => !positions.has(position)
  );
  return _.map(lineup, ({ playerId, position }) => {
    if (fourOutfielders && position === FieldingPosition.CENTER_FIELD) {
      return {
        playerId,
        position: _.find(
          [
            FieldingPosition.LEFT_CENTER,
            FieldingPosition.RIGHT_CENTER,
            getNextAvailablePosition(lineup),
          ],
          pos => !positions.has(pos)
        )!,
      };
    } else if (
      !fourOutfielders &&
      [FieldingPosition.RIGHT_CENTER, FieldingPosition.LEFT_CENTER].includes(
        position as FieldingPosition
      )
    ) {
      return {
        playerId,
        position: _.find(
          [FieldingPosition.CENTER_FIELD, getNextAvailablePosition(lineup)],
          pos => !positions.has(pos)
        )!,
      };
    } else if (!position && positionsNotTaken.length) {
      return {
        playerId,
        position: positionsNotTaken.pop()!,
      };
    }
    return { playerId, position };
  });
};

export const cleanUpAfterPlateAppearance = (state: AppGameState) => {
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
  }: AppGameState): GameState => ({
    playerAtBat,
    inning,
    halfInning,
    outs,
    baseRunners: [...baseRunners],
    score: [...score],
    lineups: state.teams.map(({ role, lineups }) => {
      const { id } = _.last(lineups)!;
      return {
        id,
        team: { role },
      };
    }),
  });
  const gameStateBefore = getRecordedGameState(state);

  const scoredRunners: ScoredRunner[] = [];
  const recordRunnersScored = (runners: string[], battedIn = true) => {
    scoredRunners.push(...runners.map(runnerId => ({ runnerId, battedIn })));
  };

  const gameEvent = callback(state, recordRunnersScored);
  state.gameEventRecords.push({
    eventIndex: state.gameEventRecords.length,
    gameEvent,
    scoredRunners,
    gameStateBefore,
    gameStateAfter: getRecordedGameState(state),
  });
};

const isNotInLineupAnymore = (playerId: string, oldLineup: LineupSpot[], newLineup: LineupSpot[]) =>
  isPlayerInLineup(playerId, oldLineup) && !isPlayerInLineup(playerId, newLineup);

const getNextPlayerAfterLineupChange = (
  removedPlayer: string,
  oldLineup: LineupSpot[],
  newLineup: LineupSpot[]
) => {
  const lineupIndex = oldLineup.findIndex(spot => spot.playerId === removedPlayer);
  console.log(removedPlayer, lineupIndex, _.cloneDeep(oldLineup), _.cloneDeep(newLineup));
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
  recordAndApplyGameEvent(state, state => {
    const { teams } = state;
    const team = getTeamWithRole(teams, role);
    const lineupBeforeId = _.last(team.lineups)!.id;
    const lineupAfterId = uuid4();
    const newLineup = {
      id: lineupAfterId,
      originalClientId: null,
      lineupSpots,
    };
    const oldLineup = getCurrentLineup(team);
    if (isNotInLineupAnymore(state.playerAtBat, oldLineup, lineupSpots)) {
      state.playerAtBat = getNextPlayerAfterLineupChange(
        state.playerAtBat,
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
        removeRunner(runners, plateAppearance.outOnPlayRunners[0]?.runnerId);
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

    return makeGameEvent({ plateAppearance });
  });
};
