import _ from 'lodash';

import { BaseType, PlateAppearanceType, BaseRunners } from './types';

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

export const advanceBaserunnersOnPlateAppearance = (
  runners: BaseRunners,
  paType: PlateAppearanceType,
  batterId: string
): [BaseRunners, number] => {
  let runsScored = 0;
  const newBaseRunners: BaseRunners = {};

  const numBasesAdvanced = getNumBasesForPlateAppearance(paType);
  _.forEach(runners, (runnerId, base) => {
    const newBase = getNewBase(base as BaseType, numBasesAdvanced);
    if (newBase) {
      newBaseRunners[newBase] = runnerId;
    } else {
      runsScored++;
    }
  });

  const endBaseForBatterRunner = getEndBaseForBatterRunner(paType);
  if (endBaseForBatterRunner) {
    newBaseRunners[endBaseForBatterRunner] = batterId;
  }

  return [newBaseRunners, runsScored];
};
