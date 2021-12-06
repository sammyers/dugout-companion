import { FieldingPosition, PlateAppearanceType } from './gql';

export type SimplifyType<T, Keys extends string = ''> = T extends Array<any>
  ? Array<SimplifyType<NonNullable<T[number]>, Keys>>
  : T extends Record<string, any>
  ? {
      [K in Exclude<keyof T, '__typename'>]: K extends Keys
        ? SimplifyType<NonNullable<T[K]>, Keys>
        : SimplifyType<T[K], Keys>;
    }
  : T;

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

export const ordinalSuffix = (n: number) =>
  Math.floor(n / 10) === 1
    ? 'th'
    : n % 10 === 1
    ? 'st'
    : n % 10 === 2
    ? 'nd'
    : n % 10 === 3
    ? 'rd'
    : 'th';
