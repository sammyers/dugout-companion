import _ from 'lodash';

import {
  PlateAppearanceType,
  FieldingPosition,
  ContactType,
  HitContactType,
} from 'state/game/types';
import { BasepathOutcome } from 'state/prompts/types';

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
    [FieldingPosition.LEFT_CENTER]: 'LCF',
    [FieldingPosition.RIGHT_CENTER]: 'RCF',
    [FieldingPosition.RIGHT_FIELD]: 'RF',
  }[position]);

export const getPlateAppearanceLabel = (paType: PlateAppearanceType) =>
  ({
    [PlateAppearanceType.OUT]: 'Out',
    [PlateAppearanceType.SINGLE]: 'Single',
    [PlateAppearanceType.DOUBLE]: 'Double',
    [PlateAppearanceType.TRIPLE]: 'Triple',
    [PlateAppearanceType.HOMERUN]: 'Home Run',
    [PlateAppearanceType.WALK]: 'Walk',
    [PlateAppearanceType.SACRIFICE_FLY]: 'Sacrifice Fly',
    [PlateAppearanceType.FIELDERS_CHOICE]: "Fielder's Choice",
    [PlateAppearanceType.DOUBLE_PLAY]: 'Double Play',
  }[paType]);

export const getOutLabelFromContact = (contactType: ContactType) =>
  ({
    [ContactType.GROUNDER]: 'Groundout',
    [ContactType.LAZY_FLY]: 'Lazy flyout',
    [ContactType.LINE_DRIVE]: 'Lineout',
    [ContactType.LONG_FLY]: 'Long flyout',
    [ContactType.POPUP]: 'Popout',
    [ContactType.NONE]: 'Strikeout',
  }[contactType]);

export const getHitLabelFromContact = (contactType: HitContactType) =>
  ({
    [ContactType.GROUNDER]: 'Ground ball',
    [ContactType.LAZY_FLY]: 'Lazy fly ball',
    [ContactType.LINE_DRIVE]: 'Line drive',
    [ContactType.LONG_FLY]: 'Long fly ball',
    [ContactType.POPUP]: 'Pop fly',
  }[contactType]);

export const getRunnerOptionLabel = (option: BasepathOutcome) => {
  if (!option.attemptedAdvance) {
    return `Held at ${_.lowerCase(option.endBase)}`;
  }
  if (option.endBase === null) {
    if (option.successfulAdvance) {
      return 'Scored';
    }
    return 'Out at home';
  }
  const baseName = _.lowerCase(option.endBase);
  if (option.successfulAdvance) {
    return `Took ${baseName}`;
  }
  return `Out at ${baseName}`;
};