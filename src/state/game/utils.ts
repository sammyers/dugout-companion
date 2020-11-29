import _ from 'lodash';

import { getBattingTeam, getCurrentBaseForRunner } from './partialSelectors';

import {
  BaseType,
  PlateAppearanceType,
  BaseRunners,
  FieldingPosition,
  Team,
  GameEvent,
  GameState,
  RecordedPlay,
  ContactType,
} from './types';

export const allPositions = _.keys(FieldingPosition) as FieldingPosition[];

export const shouldTeamUseFourOutfielders = ({ lineup }: Team) => lineup.length > 9;
export const getAvailablePositionsForTeam = (team: Team) => {
  if (shouldTeamUseFourOutfielders(team)) {
    return allPositions.filter(position => position !== FieldingPosition.CENTER_FIELD);
  }
  return allPositions.filter(
    position => ![FieldingPosition.RIGHT_CENTER, FieldingPosition.LEFT_CENTER].includes(position)
  );
};

export const getBaseForRunner = (runners: BaseRunners, runnerId: string) =>
  _.findKey(runners, runner => runner === runnerId) as BaseType;

export const moveRunner = (runners: BaseRunners, startBase: BaseType, endBase: BaseType | null) => {
  if (endBase) {
    runners[endBase] = runners[startBase];
    delete runners[startBase];
    return false;
  } else {
    delete runners[startBase];
    return true;
  }
};

export const removeRunner = (runners: BaseRunners, runnerId: string) => {
  delete runners[getBaseForRunner(runners, runnerId)];
};

// Find the base a runner should occupy if advanced by some number of bases.
// Return null if the runner has scored.
export const getNewBase = (currentBase: BaseType, numAdvanced: number = 1) => {
  if (numAdvanced === -1) return getPreviousBase(currentBase)!;
  if (numAdvanced === 0) return currentBase;
  if (currentBase === BaseType.THIRD) return null;
  if (currentBase === BaseType.SECOND) {
    if (numAdvanced > 1) return null;
    return BaseType.THIRD;
  }
  if (numAdvanced > 2) return null;
  if (numAdvanced === 2) return BaseType.THIRD;
  return BaseType.SECOND;
};

export const getNumBasesForPlateAppearance = (paType: PlateAppearanceType) => {
  switch (paType) {
    case PlateAppearanceType.HOMERUN:
      return 4;
    case PlateAppearanceType.TRIPLE:
      return 3;
    case PlateAppearanceType.DOUBLE:
      return 2;
    case PlateAppearanceType.SINGLE:
    case PlateAppearanceType.WALK:
      return 1;
    default:
      return 0;
  }
};

export const getEndBaseForBatterRunner = (paType: PlateAppearanceType) => {
  switch (paType) {
    case PlateAppearanceType.TRIPLE:
      return BaseType.THIRD;
    case PlateAppearanceType.DOUBLE:
      return BaseType.SECOND;
    case PlateAppearanceType.SINGLE:
    case PlateAppearanceType.WALK:
    case PlateAppearanceType.FIELDERS_CHOICE:
      return BaseType.FIRST;
    default:
      return null;
  }
};

export const getBaseNumber = (base: BaseType | null) =>
  base === null
    ? 4
    : {
        [BaseType.FIRST]: 1,
        [BaseType.SECOND]: 2,
        [BaseType.THIRD]: 3,
      }[base];
export const getPreviousBase = (base: BaseType | null) => {
  switch (base) {
    case null:
      return BaseType.THIRD;
    case BaseType.THIRD:
      return BaseType.SECOND;
    case BaseType.SECOND:
      return BaseType.FIRST;
    case BaseType.FIRST:
      return;
  }
};

export const mustRunnerAdvance = (
  base: BaseType,
  runners: BaseRunners,
  batterEndBase = BaseType.FIRST
): boolean => {
  const prevBase = getPreviousBase(base);

  if (getBaseNumber(base) - getBaseNumber(batterEndBase) <= 0) return true;
  if (!prevBase) return true;
  if (!runners[prevBase]) return false;

  return mustRunnerAdvance(prevBase, runners, batterEndBase);
};

export const getSortedRunners = (runners: BaseRunners) =>
  (_.toPairs(runners) as [BaseType, string][]).sort(
    ([baseA], [baseB]) => getBaseNumber(baseA) - getBaseNumber(baseB)
  );

export const getLeadRunner = (runners: BaseRunners) => _.last(getSortedRunners(runners));

export const forEachRunner = (
  runners: BaseRunners,
  callback: (runnerId: string, base: BaseType) => void | boolean
) => {
  const sortedPairs = getSortedRunners(runners);
  _.forEachRight(sortedPairs, ([base, runnerId]) => callback(runnerId, base));
};

export const getDefaultRunnersAfterPlateAppearance = (
  runners: BaseRunners,
  paType: PlateAppearanceType,
  batterId: string
): [BaseRunners, string[]] => {
  let runnersScored: string[] = [];
  const newRunners = { ...runners };
  const numBasesAdvanced = getNumBasesForPlateAppearance(paType);

  _.times(numBasesAdvanced, i => {
    forEachRunner(newRunners, (runnerId, base) => {
      if (mustRunnerAdvance(base, newRunners, getEndBaseForBatterRunner(paType)!)) {
        if (moveRunner(newRunners, base, getNewBase(base))) {
          runnersScored.push(runnerId);
        }
      }
    });
    if (i === 0 && getEndBaseForBatterRunner(paType)) {
      newRunners[BaseType.FIRST] = batterId;
    }
  });

  return [newRunners, runnersScored];
};

export const moveRunnersOnGroundBall = (runners: BaseRunners) => {
  let runnersScored: string[] = [];
  forEachRunner(runners, (runnerId, base) => {
    if (mustRunnerAdvance(base, runners)) {
      if (moveRunner(runners, base, getNewBase(base))) {
        runnersScored.push(runnerId);
      }
    }
  });
  return runnersScored;
};

export const mustAllRunnersAdvance = (runners: BaseRunners) =>
  _.every(runners, (_runnerId, base) => mustRunnerAdvance(base as BaseType, runners));

const updateScore = (state: GameState, runs: number = 1) => {
  state.score[getBattingTeam(state)] += runs;
};

export const applyGameEvent = (state: GameState, event: GameEvent) => {
  const { atBat, inning, halfInning, outs, runners, score } = state;
  const recordedPlay: RecordedPlay = {
    event: event,
    gameState: {
      atBat: atBat!,
      inning,
      halfInning,
      outs,
      runners: { ...runners },
      score: [...score],
    },
    runnersBattedIn: [],
    runnersScored: [],
    runnersAfter: runners,
    scoreAfter: score,
  };

  const recordRunnersScored = (runners: string[], battedIn = true) => {
    if (battedIn) {
      recordedPlay.runnersBattedIn.push(...runners);
    }
    recordedPlay.runnersScored.push(...runners);
  };

  if (event.kind === 'stolenBaseAttempt') {
    const startBase = getCurrentBaseForRunner(state, event.runnerId);
    if (event.success) {
      const endBase = getNewBase(startBase);
      delete state.runners[startBase];
      if (endBase) {
        state.runners[endBase] = event.runnerId;
      } else {
        // runner scored
        updateScore(state);
        recordRunnersScored([event.runnerId], false);
      }
    } else {
      delete state.runners[startBase];
      state.outs++;
    }
  } else if (event.kind === 'plateAppearance') {
    switch (event.type) {
      case PlateAppearanceType.HOMERUN:
        updateScore(state, _.size(state.runners) + 1);
        recordRunnersScored([...(_.values(state.runners) as string[]), atBat!]);
        state.runners = {};
        break;
      case PlateAppearanceType.TRIPLE:
        updateScore(state, _.size(state.runners));
        recordRunnersScored(_.values(state.runners) as string[]);
        state.runners = { [BaseType.THIRD]: atBat };
        break;
      case PlateAppearanceType.DOUBLE:
      case PlateAppearanceType.SINGLE:
      case PlateAppearanceType.WALK:
        const [newBaseRunners, runnersScored] = getDefaultRunnersAfterPlateAppearance(
          state.runners,
          event.type,
          atBat!
        );
        state.runners = newBaseRunners;
        updateScore(state, runnersScored.length);
        recordRunnersScored(runnersScored);
        break;
      case PlateAppearanceType.SACRIFICE_FLY:
        _.times(event.runsScoredOnSacFly!, () => {
          const [base, runnerId] = getLeadRunner(runners)!;
          moveRunner(runners, base, null);
          updateScore(state);
          recordRunnersScored([runnerId]);
        });
        state.outs++;
        break;
      case PlateAppearanceType.FIELDERS_CHOICE: {
        removeRunner(state.runners, event.runnersOutOnPlay[0]);
        const runnersScored = moveRunnersOnGroundBall(state.runners);
        state.runners[BaseType.FIRST] = atBat;
        if (runnersScored.length && outs < 2) {
          updateScore(state);
          recordRunnersScored(runnersScored);
        }
        state.outs++;
        break;
      }
      case PlateAppearanceType.DOUBLE_PLAY:
        state.outs += 2;
        event.runnersOutOnPlay.forEach(runnerId => {
          removeRunner(state.runners, runnerId);
        });
        if (event.contactType === ContactType.GROUNDER) {
          const runnersScored = moveRunnersOnGroundBall(state.runners);
          if (runnersScored.length && outs === 0) {
            updateScore(state, runnersScored.length);
            recordRunnersScored(runnersScored, false);
          }

          if (!event.runnersOutOnPlay.includes(atBat!)) {
            state.runners[BaseType.FIRST] = atBat;
          }
        }
        break;
      case PlateAppearanceType.OUT:
        if (event.contactType === ContactType.GROUNDER) {
          const runnersScored = moveRunnersOnGroundBall(state.runners);
          if (runnersScored.length && outs < 2) {
            updateScore(state, runnersScored.length);
            recordRunnersScored(runnersScored);
          }
        }
        state.outs++;
        break;
    }

    forEachRunner(state.runners, (runnerId, base) => {
      if (runnerId in event.outsOnBasepaths) {
        delete state.runners[base];
        state.outs++;
      } else if (runnerId in event.basesTaken) {
        if (moveRunner(state.runners, base, event.basesTaken[runnerId])) {
          updateScore(state);
          recordRunnersScored([runnerId], event.type !== PlateAppearanceType.DOUBLE_PLAY);
        }
      }
    });

    recordedPlay.runnersAfter = state.runners;
    recordedPlay.scoreAfter = state.score;
    state.gameHistory.push(recordedPlay);
  }
};
