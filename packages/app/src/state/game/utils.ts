import _ from 'lodash';

import {
  BaseType,
  FieldingPosition,
  PlateAppearanceType,
  TeamRole,
} from '@dugout-companion/shared';

import { BaseRunners, Team, BaseRunnerMap } from './types';

export const getTeamWithRole = (teams: Team[], role: TeamRole) =>
  teams.find(team => team.role === role)!;

export const getCurrentLineup = (team: Team) => _.last(team.lineups)?.lineupSpots ?? [];

export const allPositions = _.keys(FieldingPosition) as FieldingPosition[];

export const shouldTeamUseFourOutfielders = (team: Team) => getCurrentLineup(team).length > 9;
export const getAvailablePositionsForTeam = (team: Team) => {
  if (shouldTeamUseFourOutfielders(team)) {
    return allPositions.filter(position => position !== FieldingPosition.CENTER_FIELD);
  }
  return allPositions.filter(
    position => ![FieldingPosition.RIGHT_CENTER, FieldingPosition.LEFT_CENTER].includes(position)
  );
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
