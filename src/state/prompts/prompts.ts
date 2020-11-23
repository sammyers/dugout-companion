import _ from 'lodash';

import {
  ContactType,
  HitContactType,
  FieldingPosition,
  PlateAppearanceType,
  BaseRunners,
  BaseType,
} from 'state/game/types';
import {
  getDefaultRunnersAfterPlateAppearance,
  getSortedRunners,
  getBaseNumber,
  forEachRunner,
  moveRunner,
  moveRunnersOnGroundBall,
  removeRunner,
  getPreviousBase,
  getNewBase,
  getNumBasesForPlateAppearance,
} from 'state/game/utils';
import {
  getHitLabelFromContact,
  getOutLabelFromContact,
  getPositionAbbreviation,
} from 'utils/labels';

import { PlateAppearanceDetailOptions, RunnerOptions, BasepathOutcome } from './types';

const getLeadRunner = (runners: BaseRunners) => _.last(getSortedRunners(runners));
const getTrailingRunner = (runners: BaseRunners, leadBase: BaseType | null) => {
  if (leadBase === null) {
    return getLeadRunner(runners);
  }

  let trailingRunner: [BaseType, string] | undefined;
  forEachRunner(runners, (runnerId, base) => {
    if (getBaseNumber(base) < getBaseNumber(leadBase)) {
      trailingRunner = [base, runnerId];
      return false;
    }
  });

  return trailingRunner;
};

export const getAvailableBases = (currentBase: BaseType, nextRunner: BaseType | null) => {
  const possibleBases = [..._.values(BaseType), null];
  if (nextRunner === null) {
    return possibleBases.filter(base => getBaseNumber(base) > getBaseNumber(currentBase));
  }
  return possibleBases.filter(base =>
    _.inRange(getBaseNumber(base), getBaseNumber(currentBase) + 1, getBaseNumber(nextRunner))
  );
};

const inPlayContactOptions = _.values(ContactType).filter(
  ct => ct !== ContactType.NONE
) as HitContactType[];
const getContactOptionsForHit = (contactTypes: HitContactType[] = inPlayContactOptions) =>
  contactTypes.map((contactType, id) => ({
    id,
    contactType,
    label: getHitLabelFromContact(contactType),
  }));
const getContactOptionsForOut = (contactTypes: ContactType[] = _.values(ContactType)) =>
  contactTypes.map((contactType, id) => ({
    id,
    contactType,
    label: getOutLabelFromContact(contactType),
  }));

const allPositions = _.values(FieldingPosition);
const outfieldPositions = [
  FieldingPosition.LEFT_FIELD,
  FieldingPosition.LEFT_CENTER,
  FieldingPosition.CENTER_FIELD,
  FieldingPosition.RIGHT_CENTER,
  FieldingPosition.RIGHT_FIELD,
];
const infieldPositions = _.difference(allPositions, outfieldPositions);
const getFielderOptions = (positions: FieldingPosition[]) =>
  positions.map((position, id) => ({ id, position, label: getPositionAbbreviation(position) }));

const getFielderOptionsForContactType = (contactType: ContactType) => {
  let positions: FieldingPosition[];
  switch (contactType) {
    case ContactType.GROUNDER:
    case ContactType.POPUP:
      positions = infieldPositions;
      break;
    case ContactType.LAZY_FLY:
    case ContactType.LONG_FLY:
      positions = outfieldPositions;
      break;
    case ContactType.LINE_DRIVE:
      positions = allPositions;
      break;
    case ContactType.NONE:
      positions = [];
      break;
  }
  return getFielderOptions(positions);
};

const getBasepathOutcomesForBases = (bases: (BaseType | null)[]): BasepathOutcome[] => {
  if (!bases.length) return [];

  const advancedOptions = _.flatten(
    _.map(bases, endBase =>
      [true, false].map(successfulAdvance => ({
        attemptedAdvance: true as true,
        successfulAdvance,
        endBase,
      }))
    )
  );

  const options = [
    { attemptedAdvance: false as false, endBase: getPreviousBase(advancedOptions[0].endBase)! },
    ...advancedOptions,
  ];

  return options.map(({ ...option }, id) => ({ id, ...option }));
};

export const getRunnerOptions = (
  runners: BaseRunners,
  outs: number,
  expectedBases: Record<string, BaseType | null> = {},
  allowScoring = true
): RunnerOptions | undefined => {
  const leadRunner = getLeadRunner(runners);
  if (!leadRunner) return;
  const [currentBase] = leadRunner;

  return getRunnerOptionsRecursive(runners, outs, currentBase, null, expectedBases, allowScoring);
};
const getRunnerOptionsRecursive = (
  runners: BaseRunners,
  outs: number,
  currentBase: BaseType,
  runnerAhead: BaseType | null,
  expectedBases: Record<string, BaseType | null>,
  allowScoring: boolean
): RunnerOptions | undefined => {
  const runnerId = runners[currentBase]!;
  const nextRunner = getTrailingRunner(runners, currentBase);
  const options = getBasepathOutcomesForBases(getAvailableBases(currentBase, runnerAhead)).filter(
    option => option.endBase || allowScoring
  );
  const defaultOption =
    runnerId in expectedBases
      ? _.findIndex(options, ({ endBase }) => endBase === expectedBases[runnerId])
      : 0;

  if (options.length < 2) return;
  if (!nextRunner) return { runnerId, options, defaultOption };

  const [nextBase] = nextRunner;
  const newRunners = { ...runners };

  return {
    runnerId,
    options,
    defaultOption,
    getTrailingRunnerOptions: outcome => {
      let currentOuts = outs;
      let endBase: BaseType | null = currentBase;
      if (outcome.attemptedAdvance) {
        endBase = outcome.endBase;
        if (!outcome.successfulAdvance) {
          delete newRunners[currentBase];
          currentOuts++;
          if (currentOuts === 3) return;
          endBase = runnerAhead;
        } else if (!endBase) {
          delete newRunners[currentBase];
        } else {
          moveRunner(newRunners, currentBase, endBase);
        }
      }

      return getRunnerOptionsRecursive(
        newRunners,
        currentOuts,
        nextBase,
        endBase,
        expectedBases,
        allowScoring
      );
    },
  };
};

export const getPlateAppearanceDetailPrompt = (
  paType: PlateAppearanceType,
  batterId: string,
  outs: number,
  runners: BaseRunners
): PlateAppearanceDetailOptions | void => {
  switch (paType) {
    case PlateAppearanceType.WALK:
      return;

    case PlateAppearanceType.HOMERUN:
      return {
        kind: 'hit',
        contactOptions: {
          options: getContactOptionsForHit([ContactType.LINE_DRIVE, ContactType.LONG_FLY]),
        },
        getNextOptions: () => ({
          options: getFielderOptions(outfieldPositions),
        }),
      };

    case PlateAppearanceType.OUT:
      return {
        kind: 'out',
        contactOptions: {
          required: true,
          options: getContactOptionsForOut(),
        },
        getNextOptions: (contactType: ContactType) => {
          const newRunners = { ...runners };
          if (contactType === ContactType.NONE) return;
          const fielderOptions = { options: getFielderOptionsForContactType(contactType) };
          if (outs === 2) {
            return { fielderOptions };
          }
          if (contactType === ContactType.GROUNDER) {
            moveRunnersOnGroundBall(newRunners);
          }
          return {
            fielderOptions,
            runnerOptions: getRunnerOptions(
              newRunners,
              outs + 1,
              {},
              contactType === ContactType.GROUNDER
            ),
          };
        },
      };

    case PlateAppearanceType.SACRIFICE_FLY:
      const fielderOptions = { options: getFielderOptions(outfieldPositions) };
      if (_.size(runners) === 1) {
        return { kind: 'sacrificeFly', fielderOptions };
      }

      return {
        kind: 'sacrificeFly',
        fielderOptions,
        runnersScoredOptions: _.range(1, _.size(runners) + 1),
        getNextOptions: numScored => {
          const newRunners = { ...runners };
          _.times(numScored, () => {
            moveRunner(newRunners, getLeadRunner(newRunners)![0], null);
          });

          return getRunnerOptions(newRunners, outs + 1, {}, false);
        },
      };

    case PlateAppearanceType.FIELDERS_CHOICE:
      return {
        kind: 'fieldersChoice',
        outOnPlayOptions: { runnerIds: _.values(runners) as string[] },
        fielderOptions: { options: getFielderOptionsForContactType(ContactType.GROUNDER) },
        getNextOptions:
          outs < 2
            ? runnerOut => {
                const newRunners = { ...runners };
                removeRunner(newRunners, runnerOut);
                moveRunnersOnGroundBall(newRunners);
                newRunners[BaseType.FIRST] = batterId;
                return getRunnerOptions(newRunners, outs + 1);
              }
            : undefined,
      };

    case PlateAppearanceType.DOUBLE_PLAY:
      return {
        kind: 'doublePlay',
        contactOptions: {
          options: getContactOptionsForOut(inPlayContactOptions),
          required: true,
        },
        getNextOptions: contactType => {
          const fielderOptions = { options: getFielderOptionsForContactType(contactType) };
          if (_.size(runners) === 1) {
            return { fielderOptions };
          }

          if (contactType === ContactType.GROUNDER) {
            return {
              fielderOptions,
              outOnPlayOptions: {
                runnerIds: [batterId, ...(_.values(runners) as string[])],
                multiple: true,
              },
              getNextOptions:
                outs === 0
                  ? runnersOut => {
                      const newRunners = { ...runners };
                      runnersOut.forEach(runnerId => removeRunner(newRunners, runnerId));
                      moveRunnersOnGroundBall(newRunners);
                      if (!runnersOut.includes(batterId)) {
                        // the rare fielder's choice double play
                        newRunners[BaseType.FIRST] = batterId;
                      }
                      return getRunnerOptions(newRunners, outs + 2);
                    }
                  : undefined,
            };
          }

          return {
            outOnPlayOptions: { runnerIds: _.values(runners) as string[] },
            fielderOptions,
            getNextOptions:
              outs === 0
                ? runnersOut => {
                    const newRunners = { ...runners };
                    removeRunner(newRunners, runnersOut[0]);
                    return getRunnerOptions(newRunners, outs + 2);
                  }
                : undefined,
          };
        },
      };

    default:
      const [defaultRunnerPositions] = getDefaultRunnersAfterPlateAppearance(
        runners,
        paType,
        batterId
      );

      const runnersToBases = _.invert(runners) as Record<string, BaseType>;
      const expectedBases = _.mapValues(runnersToBases, (base: BaseType) =>
        getNewBase(base, getNumBasesForPlateAppearance(paType))
      );

      return {
        kind: 'hit',
        contactOptions: { options: getContactOptionsForHit() },
        runnerOptions: getRunnerOptions(defaultRunnerPositions, outs, expectedBases),
        getNextOptions: contactType => ({
          options: getFielderOptionsForContactType(contactType),
        }),
      };
  }
};

export const getExtraRunnerMovementForPlateAppearance = (
  allRunnerChoices: Record<string, BasepathOutcome>
) => {
  const extraBasesTaken: Record<string, BaseType | null> = {};
  const extraOutsOnBasepaths: Record<string, BaseType | null> = {};

  _.forEach(allRunnerChoices, (outcome, runnerId) => {
    if (outcome.attemptedAdvance) {
      if (outcome.successfulAdvance) {
        extraBasesTaken[runnerId] = outcome.endBase;
      } else {
        extraOutsOnBasepaths[runnerId] = outcome.endBase;
      }
    }
  });

  return { extraBasesTaken, extraOutsOnBasepaths };
};
