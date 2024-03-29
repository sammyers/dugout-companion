import _ from 'lodash';

import {
  BaseType,
  FieldingPosition,
  HalfInning,
  Maybe,
  PlateAppearanceType,
  TeamRole,
} from '@sammyers/dc-shared';

import { BaseRunners, Team, BaseRunnerMap, LineupSpot } from './types';

export const DEFAULT_GAME_LENGTH = 9;

export const getTeamWithRole = (teams: Team[], role: TeamRole) =>
  teams.find(team => team.role === role)!;

export const getCurrentLineup = (team: Team) => _.last(team.lineups)?.lineupSpots ?? [];

export const allPositions = _.keys(FieldingPosition) as FieldingPosition[];

export const getAvailablePositionsForLineup = (lineup: LineupSpot[], addingPlayer = false) => {
  const lineupSize = lineup.length + (addingPlayer ? 1 : 0);
  const occupiedPositions = lineup.filter(spot => !!spot.position).map(spot => spot.position!);

  // Already in 5-man infield configuration
  if (lineupSize >= 10 && occupiedPositions.includes(FieldingPosition.MIDDLE_INFIELD)) {
    return _.difference(allPositions, [
      FieldingPosition.LEFT_CENTER,
      FieldingPosition.RIGHT_CENTER,
    ]);
  }

  // Already in no-catcher configuration
  if (
    lineupSize === 9 &&
    [FieldingPosition.LEFT_CENTER, FieldingPosition.RIGHT_CENTER].some(
      position =>
        occupiedPositions.includes(position) &&
        !occupiedPositions.includes(FieldingPosition.CATCHER)
    )
  ) {
    return _.difference(allPositions, [
      FieldingPosition.CATCHER,
      FieldingPosition.CENTER_FIELD,
      FieldingPosition.MIDDLE_INFIELD,
    ]);
  }

  if (lineupSize >= 10) {
    return _.difference(allPositions, [
      FieldingPosition.CENTER_FIELD,
      FieldingPosition.MIDDLE_INFIELD,
    ]);
  }
  return _.difference(allPositions, [
    FieldingPosition.RIGHT_CENTER,
    FieldingPosition.LEFT_CENTER,
    FieldingPosition.MIDDLE_INFIELD,
  ]);
};

export const getPlayerAtPositionFromTeams = (
  teams: Team[],
  role: TeamRole,
  position: FieldingPosition
) => getCurrentLineup(getTeamWithRole(teams, role)).find(player => player.position === position);

export const getBaseForRunner = (runners: BaseRunnerMap, runnerId: string) =>
  _.findKey(runners, runner => runner === runnerId) as BaseType;

export const runnersToMap = (runners: BaseRunners): BaseRunnerMap =>
  _.reduce(runners, (all, { base, runnerId }) => ({ ...all, [base]: runnerId }), {});
export const runnersFromMap = (runnerMap: BaseRunnerMap): BaseRunners =>
  _.map(runnerMap, (runnerId, base) => ({ base: base as BaseType, runnerId: runnerId! }));

export const moveRunner = (
  runners: BaseRunnerMap,
  startBase: BaseType,
  endBase: BaseType | null
) => {
  if (endBase) {
    runners[endBase] = runners[startBase];
    delete runners[startBase];
    return false;
  } else {
    delete runners[startBase];
    return true;
  }
};

export const removeRunner = (runners: BaseRunnerMap, runnerId: string) => {
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

export const isNextBaseAvailable = (runnerId: string, runners: BaseRunnerMap) => {
  const base = getBaseForRunner(runners, runnerId);
  const nextBase = getNewBase(base);
  if (!nextBase) return true;
  if (nextBase in runners) return false;
  return true;
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
  runners: BaseRunnerMap,
  batterEndBase = BaseType.FIRST
): boolean => {
  const prevBase = getPreviousBase(base);

  if (getBaseNumber(base) - getBaseNumber(batterEndBase) <= 0) return true;
  if (!prevBase) return true;
  if (!runners[prevBase]) return false;

  return mustRunnerAdvance(prevBase, runners, batterEndBase);
};

export const getSortedRunners = (runners: BaseRunnerMap) =>
  (_.toPairs(runners) as [BaseType, string][]).sort(
    ([baseA], [baseB]) => getBaseNumber(baseA) - getBaseNumber(baseB)
  );

export const getLeadRunner = (runners: BaseRunnerMap) => _.last(getSortedRunners(runners));

export const forEachRunner = (
  runners: BaseRunnerMap,
  callback: (runnerId: string, base: BaseType) => void | boolean
) => {
  const sortedPairs = getSortedRunners(runners);
  _.forEachRight(sortedPairs, ([base, runnerId]) => callback(runnerId, base));
};

export const getDefaultRunnersAfterPlateAppearance = (
  runners: BaseRunnerMap,
  paType: PlateAppearanceType,
  batterId: string
): [BaseRunnerMap, string[]] => {
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

export const moveRunnersOnGroundBall = (runners: BaseRunnerMap) => {
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

export const mustAllRunnersAdvance = (runners: BaseRunnerMap) =>
  _.every(runners, (_runnerId, base) => mustRunnerAdvance(base as BaseType, runners));

export const isPlayerInLineup = (playerId: string, lineup: LineupSpot[]) =>
  _.some(lineup, spot => spot.playerId === playerId);

export const getNextBatter = (batterId: string | undefined, lineup: LineupSpot[]) => {
  const lineupIndex = _.findIndex(lineup, ({ playerId }) => playerId === batterId);
  if (lineupIndex === lineup.length - 1) {
    return lineup[0].playerId;
  }
  return lineup[lineupIndex + 1].playerId;
};

export const previousHalfInning = (halfInning: HalfInning, inning: number) => {
  const prevHalfInning = halfInning === HalfInning.TOP ? HalfInning.BOTTOM : HalfInning.TOP;
  const prevInning = halfInning === HalfInning.TOP ? inning - 1 : inning;
  return [prevHalfInning, prevInning] as [HalfInning, number];
};

export const getLineupWithNewPositions = (
  lineup: LineupSpot[],
  positions: Record<string, Maybe<FieldingPosition>>
) => lineup.map(({ playerId }) => ({ playerId, position: positions[playerId] }));

export const mapFieldingPosition = (
  position: FieldingPosition,
  totalFielders: number,
  numOutfielders: number
) => {
  if (numOutfielders === 3 && position === FieldingPosition.LEFT_CENTER) {
    return FieldingPosition.CENTER_FIELD;
  }
  if (numOutfielders === 4 && position === FieldingPosition.CENTER_FIELD) {
    return FieldingPosition.LEFT_CENTER;
  }
  if (numOutfielders === 3 && position === FieldingPosition.RIGHT_CENTER) {
    if (totalFielders >= 10) {
      return FieldingPosition.MIDDLE_INFIELD;
    } else {
      return FieldingPosition.CATCHER;
    }
  }
  if (
    numOutfielders === 4 &&
    ((totalFielders <= 9 && position === FieldingPosition.CATCHER) ||
      (totalFielders >= 10 && position === FieldingPosition.MIDDLE_INFIELD))
  ) {
    return FieldingPosition.RIGHT_CENTER;
  }

  return position;
};

export const isHit = (plateAppearanceType: PlateAppearanceType) =>
  [
    PlateAppearanceType.SINGLE,
    PlateAppearanceType.DOUBLE,
    PlateAppearanceType.TRIPLE,
    PlateAppearanceType.HOMERUN,
  ].includes(plateAppearanceType);
