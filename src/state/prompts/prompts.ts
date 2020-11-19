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
} from 'state/game/utils';
import {
  getHitLabelFromContact,
  getOutLabelFromContact,
  getPositionAbbreviation,
} from 'utils/labels';

import { PlateAppearanceDetailPrompt, RunnerOptions, BasepathOutcome } from './types';

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
  contactTypes.map(contactType => ({ contactType, label: getHitLabelFromContact(contactType) }));
const getContactOptionsForOut = (contactTypes: ContactType[] = _.values(ContactType)) =>
  contactTypes.map(contactType => ({ contactType, label: getOutLabelFromContact(contactType) }));

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
  positions.map(position => ({ position, label: getPositionAbbreviation(position) }));

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

  return [
    { attemptedAdvance: false },
    ..._.flatten(
      _.map(bases, endBase =>
        [true, false].map(successfulAdvance => ({
          attemptedAdvance: true,
          successfulAdvance,
          endBase,
        }))
      )
    ),
  ];
};

export const getRunnerOptions = (runners: BaseRunners, outs: number): RunnerOptions | undefined => {
  const leadRunner = getLeadRunner(runners);
  if (!leadRunner) return;
  const [currentBase] = leadRunner;

  return getRunnerOptionsRecursive(runners, outs, currentBase, null);
};
const getRunnerOptionsRecursive = (
  runners: BaseRunners,
  outs: number,
  currentBase: BaseType,
  runnerAhead: BaseType | null
): RunnerOptions | undefined => {
  const runnerId = runners[currentBase]!;
  const nextRunner = getTrailingRunner(runners, currentBase);
  const options = getBasepathOutcomesForBases(getAvailableBases(currentBase, runnerAhead));

  if (!options.length) return;
  if (!nextRunner) return { runnerId, options };

  const [nextBase] = nextRunner;
  const newRunners = { ...runners };

  return {
    runnerId,
    options,
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

      return getRunnerOptionsRecursive(newRunners, currentOuts, nextBase, endBase);
    },
  };
};

export const getPlateAppearanceDetailPrompt = (
  paType: PlateAppearanceType,
  batterId: string,
  outs: number,
  runners: BaseRunners
): PlateAppearanceDetailPrompt | void => {
  if (paType === PlateAppearanceType.WALK) return;

  if (paType === PlateAppearanceType.HOMERUN) {
    return {
      kind: 'hit',
      contactOptions: {
        options: getContactOptionsForHit([
          ContactType.LINE_DRIVE,
          ContactType.LAZY_FLY,
          ContactType.LONG_FLY,
        ]),
      },
      getNextPrompt: () => ({
        options: getFielderOptions(outfieldPositions),
      }),
    };
  }

  let newRunners = { ...runners };

  if (paType === PlateAppearanceType.OUT) {
    return {
      kind: 'out',
      contactOptions: {
        required: true,
        options: getContactOptionsForOut(),
      },
      getNextPrompt: (contactType: ContactType) => {
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
          runnerOptions: getRunnerOptions(newRunners, outs + 1),
        };
      },
    };
  }

  if (paType === PlateAppearanceType.SACRIFICE_FLY) {
    const fielderOptions = { options: getFielderOptions(outfieldPositions) };
    if (_.size(runners) === 1) {
      return { kind: 'sacrificeFly', fielderOptions };
    }

    return {
      kind: 'sacrificeFly',
      fielderOptions,
      runnersScoredOptions: _.range(1, _.size(runners) + 1),
      getNextPrompt: numScored => {
        _.times(numScored, () => {
          moveRunner(newRunners, getLeadRunner(runners)![0], null);
        });

        return getRunnerOptions(newRunners, outs + 1);
      },
    };
  }

  if (paType === PlateAppearanceType.FIELDERS_CHOICE) {
    return {
      kind: 'fieldersChoice',
      outOnPlayOptions: { runnerIds: _.values(newRunners) as string[] },
      fielderOptions: { options: getFielderOptionsForContactType(ContactType.GROUNDER) },
      getNextPrompt:
        outs < 2
          ? runnerOut => {
              removeRunner(newRunners, runnerOut);
              moveRunnersOnGroundBall(newRunners);
              newRunners[BaseType.FIRST] = batterId;
              return getRunnerOptions(newRunners, outs + 1);
            }
          : undefined,
    };
  }

  if (paType === PlateAppearanceType.DOUBLE_PLAY) {
    return {
      kind: 'doublePlay',
      contactOptions: {
        options: getContactOptionsForOut(inPlayContactOptions),
        required: true,
      },
      getNextPrompt: contactType => {
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
            getNextPrompt:
              outs === 0
                ? runnersOut => {
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
          getNextPrompt:
            outs === 0
              ? runnersOut => {
                  removeRunner(newRunners, runnersOut[0]);
                  return getRunnerOptions(newRunners, outs + 2);
                }
              : undefined,
        };
      },
    };
  }

  const [defaultRunnerPositions] = getDefaultRunnersAfterPlateAppearance(runners, paType, batterId);
  return {
    kind: 'hit',
    contactOptions: { options: getContactOptionsForHit() },
    runnerOptions: getRunnerOptions(defaultRunnerPositions, outs),
    getNextPrompt: contactType => ({ options: getFielderOptionsForContactType(contactType) }),
  };
};
