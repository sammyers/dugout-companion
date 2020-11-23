import _ from 'lodash';

import { BaseType, PlateAppearanceType, BaseRunners, FieldingPosition } from './types';

export const allPositions = _.keys(FieldingPosition) as FieldingPosition[];

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

export const mustRunnerAdvance = (base: BaseType, runners: BaseRunners): boolean => {
  const prevBase = getPreviousBase(base);

  if (!prevBase) return true;
  if (!runners[prevBase]) return false;

  return mustRunnerAdvance(prevBase, runners);
};

export const getSortedRunners = (runners: BaseRunners) =>
  (_.toPairs(runners) as [BaseType, string][]).sort(
    ([baseA], [baseB]) => getBaseNumber(baseA) - getBaseNumber(baseB)
  );

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
): [BaseRunners, number] => {
  let runsScored = 0;
  const newRunners = { ...runners };
  const numBasesAdvanced = getNumBasesForPlateAppearance(paType);

  _.times(numBasesAdvanced, i => {
    forEachRunner(newRunners, (_runnerId, base) => {
      if (mustRunnerAdvance(base, newRunners)) {
        if (moveRunner(newRunners, base, getNewBase(base))) {
          runsScored++;
        }
      }
    });
    if (i === 0 && getEndBaseForBatterRunner(paType)) {
      newRunners[BaseType.FIRST] = batterId;
    }
  });

  return [newRunners, runsScored];
};

export const moveRunnersOnGroundBall = (runners: BaseRunners) => {
  let runs = 0;
  forEachRunner(runners, (_runnerId, base) => {
    if (mustRunnerAdvance(base, runners)) {
      const newBase = getNewBase(base);
      moveRunner(runners, base, newBase);
      if (newBase === null) runs++;
    }
  });
  return runs;
};

export const mustAllRunnersAdvance = (runners: BaseRunners) =>
  _.every(runners, (_runnerId, base) => mustRunnerAdvance(base as BaseType, runners));
