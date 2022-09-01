import { BaseType, ContactQuality } from '@sammyers/dc-shared';
import { HitContactType } from 'state/game/types';
import { BasepathOutcome } from 'state/prompts/types';

export const formatShortBaseName = (base: BaseType | null) => {
  if (base === null) return 'home';
  return {
    [BaseType.FIRST]: '1st',
    [BaseType.SECOND]: '2nd',
    [BaseType.THIRD]: '3rd',
  }[base];
};

export const getOutLabelFromContact = (contactType: ContactQuality) =>
  ({
    [ContactQuality.GROUNDER]: 'Groundout',
    [ContactQuality.LAZY_FLY]: 'Lazy Flyout',
    [ContactQuality.LINE_DRIVE]: 'Lineout',
    [ContactQuality.LONG_FLY]: 'Long Flyout',
    [ContactQuality.POPUP]: 'Popout',
    [ContactQuality.NONE]: 'Strikeout',
    [ContactQuality.FOUL]: 'Foul Out',
    [ContactQuality.DEAD_BALL]: 'DBO',
    [ContactQuality.INNING_ENDING_DEAD_BALL]: 'DBO',
  }[contactType]);

export const getHitLabelFromContact = (contactType: HitContactType) =>
  ({
    [ContactQuality.GROUNDER]: 'Ground ball',
    [ContactQuality.LAZY_FLY]: 'Lazy fly ball',
    [ContactQuality.LINE_DRIVE]: 'Line drive',
    [ContactQuality.LONG_FLY]: 'Long fly ball',
    [ContactQuality.POPUP]: 'Pop fly',
    // These shouldn't show up
    [ContactQuality.FOUL]: '',
    [ContactQuality.DEAD_BALL]: '',
    [ContactQuality.INNING_ENDING_DEAD_BALL]: '',
  }[contactType]);

export const getRunnerOptionLabel = (option: BasepathOutcome) => {
  if (!option.attemptedAdvance) {
    return `Held at ${formatShortBaseName(option.endBase)}`;
  }
  if (option.endBase === null) {
    if (option.successfulAdvance) {
      return 'Scored';
    }
    return 'Out at home';
  }
  const baseName = formatShortBaseName(option.endBase);
  if (option.successfulAdvance) {
    return `Took ${baseName}`;
  }
  return `Out at ${baseName}`;
};

export const getOrdinalInning = (inning: number) => {
  let suffix;
  switch (inning) {
    case 1:
      suffix = 'st';
      break;
    case 2:
      suffix = 'nd';
      break;
    case 3:
      suffix = 'rd';
      break;
    default:
      suffix = 'th';
      break;
  }
  return `${inning}${suffix}`;
};
