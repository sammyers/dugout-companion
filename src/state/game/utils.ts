import _ from 'lodash';

import { BaseType, PlateAppearanceType, BaseRunners, FieldingPosition } from './types';

export const getPositionAbbreviation = (position: FieldingPosition) =>
  ({
    [FieldingPosition.PITCHER]: 'P',
    [FieldingPosition.CATCHER]: 'C',
    [FieldingPosition.FIRST_BASE]: '1B',
    [FieldingPosition.SECOND_BASE]: '2B',
    [FieldingPosition.THIRD_BASE]: '3B',
    [FieldingPosition.SHORTSTOP]: 'SS',
    [FieldingPosition.LEFT_FIELD]: 'LF',
    [FieldingPosition.CENTER_FIELD]: 'CF',
    [FieldingPosition.RIGHT_FIELD]: 'RF',
    [FieldingPosition.LEFT_CENTER]: 'LCF',
    [FieldingPosition.RIGHT_CENTER]: 'RCF',
  }[position]);

export const allPositions = _.keys(FieldingPosition) as FieldingPosition[];

// Find the base a runner should occupy if advanced by some number of bases.
// Return null if the runner has scored.
export const getNewBase = (currentBase: BaseType, numAdvanced: number = 1) => {
  if (currentBase === BaseType.THIRD) return null;
  if (currentBase === BaseType.SECOND) {
    if (numAdvanced > 1) return null;
    return BaseType.THIRD;
  }
  if (numAdvanced > 2) return null;
  if (numAdvanced === 2) return BaseType.THIRD;
  return BaseType.SECOND;
};

const getNumBasesForPlateAppearance = (paType: PlateAppearanceType) => {
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

const getBaseNumber = (base: BaseType) =>
  ({
    [BaseType.FIRST]: 1,
    [BaseType.SECOND]: 2,
    [BaseType.THIRD]: 3,
  }[base]);
const getPreviousBase = (base: BaseType) => {
  switch (base) {
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

export const forEachRunner = (
  runners: BaseRunners,
  callback: (runnerId: string, base: BaseType) => void | boolean
) => {
  const sortedPairs = (_.toPairs(runners) as [BaseType, string][]).sort(
    ([baseA], [baseB]) => getBaseNumber(baseA) - getBaseNumber(baseB)
  );
  _.forEachRight(sortedPairs, ([base, runnerId]) => callback(runnerId, base));
};

export const advanceBaserunnersOnPlateAppearance = (
  runners: BaseRunners,
  paType: PlateAppearanceType,
  batterId: string
): [BaseRunners, number] => {
  let runsScored = 0;
  const newBaseRunners: BaseRunners = {};

  const numBasesAdvanced = getNumBasesForPlateAppearance(paType);
  forEachRunner(runners, (runnerId, base) => {
    if (paType === PlateAppearanceType.WALK && !mustRunnerAdvance(base, runners)) {
      newBaseRunners[base] = runnerId;
    } else {
      const newBase = getNewBase(base as BaseType, numBasesAdvanced);
      if (newBase) {
        newBaseRunners[newBase] = runnerId;
      } else {
        runsScored++;
      }
    }
  });

  const endBaseForBatterRunner = getEndBaseForBatterRunner(paType);
  if (endBaseForBatterRunner) {
    newBaseRunners[endBaseForBatterRunner] = batterId;
  }

  return [newBaseRunners, runsScored];
};

export const getPlateAppearanceDetailPrompt = (
  paType: PlateAppearanceType,
  batterId: string,
  outs: number,
  runners: BaseRunners
) => {
  const [defaultRunnerPositions] = advanceBaserunnersOnPlateAppearance(runners, paType, batterId);
};
