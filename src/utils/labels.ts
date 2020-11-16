import { PlateAppearanceType } from 'state/game/types';

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
