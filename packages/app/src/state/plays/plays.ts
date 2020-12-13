import _ from 'lodash';

import { getNewBase, getBaseForRunner, forEachRunner, runnersToMap } from 'state/game/utils';
import { formatShortBaseName, getHitLabelFromContact } from 'utils/labels';

import {
  BaseType,
  ContactQuality,
  FieldingPosition,
  PlateAppearanceType,
} from '@dugout-companion/shared';
import { GameEventRecord, HitContactType, HitType } from 'state/game/types';
import { RawPlayDescription } from './types';

const getPositionTitle = (position: FieldingPosition) =>
  ({
    [FieldingPosition.PITCHER]: 'pitcher',
    [FieldingPosition.CATCHER]: 'catcher',
    [FieldingPosition.FIRST_BASE]: 'first baseman',
    [FieldingPosition.SECOND_BASE]: 'second baseman',
    [FieldingPosition.THIRD_BASE]: 'third baseman',
    [FieldingPosition.SHORTSTOP]: 'shortstop',
    [FieldingPosition.LEFT_FIELD]: 'left fielder',
    [FieldingPosition.CENTER_FIELD]: 'center fielder',
    [FieldingPosition.LEFT_CENTER]: 'left center fielder',
    [FieldingPosition.RIGHT_CENTER]: 'right center fielder',
    [FieldingPosition.RIGHT_FIELD]: 'right fielder',
  }[position]);

const getContactVerb = (contactType: ContactQuality) =>
  ({
    [ContactQuality.NONE]: 'strikes',
    [ContactQuality.GROUNDER]: 'grounds',
    [ContactQuality.LAZY_FLY]: 'flies',
    [ContactQuality.LINE_DRIVE]: 'lines',
    [ContactQuality.LONG_FLY]: 'flies',
    [ContactQuality.POPUP]: 'pops',
  }[contactType]);

const getHitVerb = (hitType: HitType) =>
  ({
    [PlateAppearanceType.SINGLE]: 'singles',
    [PlateAppearanceType.DOUBLE]: 'doubles',
    [PlateAppearanceType.TRIPLE]: 'triples',
    [PlateAppearanceType.HOMERUN]: 'homers',
  }[hitType]);

const formatBaseName = (base: BaseType | null) => {
  if (base === null) return 'home';
  return {
    [BaseType.FIRST]: '1st base',
    [BaseType.SECOND]: '2nd base',
    [BaseType.THIRD]: '3rd base',
  }[base];
};

const makeOutPhrase = (runnerId: string, base: BaseType | null) =>
  `{${runnerId}} out at ${formatShortBaseName(base)}.`;

export const getPlayDescription = ({
  gameStateBefore,
  gameStateAfter,
  gameEvent: { plateAppearance, stolenBaseAttempt, lineupChange },
  scoredRunners,
}: GameEventRecord): RawPlayDescription => {
  const sentences: string[] = [];
  const playerIds: string[] = [];
  let position: FieldingPosition | undefined;
  let newNumOuts: number | undefined;
  let newScore: number[] | undefined;

  const finishSentence = (parts: string[]) => {
    sentences.push([...parts, '.'].join(''));
  };

  if (stolenBaseAttempt) {
    const { runnerId, success } = stolenBaseAttempt;
    const endBase = getNewBase(
      getBaseForRunner(runnersToMap(gameStateBefore.baseRunners), runnerId)
    );
    if (success) {
      sentences.push(`{${runnerId}} steals ${formatBaseName(endBase)}.`);
    } else {
      sentences.push(`{${runnerId}} is caught stealing ${formatBaseName(endBase)}.`);
      newNumOuts = gameStateBefore.outs + 1;
    }
    playerIds.push(runnerId);
  } else if (plateAppearance) {
    const { playerAtBat, baseRunners, outs } = gameStateBefore;
    const runners = runnersToMap(baseRunners);
    const { type, fieldedBy, contact, outOnPlayRunners, basepathMovements } = plateAppearance;
    playerIds.push(playerAtBat);
    const fielderToken = fieldedBy && `${getPositionTitle(fieldedBy)} {${fieldedBy}}`;

    switch (type) {
      case PlateAppearanceType.WALK:
        sentences.push(`{${playerAtBat}} walks.`);
        break;
      case PlateAppearanceType.FIELDERS_CHOICE: {
        const parts = [`{${playerAtBat}} hits into a fielder's choice`];
        if (fielderToken) {
          parts.push(`, fielded by ${fielderToken}`);
          position = fieldedBy!;
        }
        finishSentence(parts);
        sentences.push(
          makeOutPhrase(
            outOnPlayRunners[0].runnerId,
            getNewBase(getBaseForRunner(runners, outOnPlayRunners[0].runnerId))
          )
        );
        playerIds.push(outOnPlayRunners[0].runnerId);
        newNumOuts = outs + 1;
        break;
      }
      case PlateAppearanceType.SACRIFICE_FLY: {
        const parts = [`{${playerAtBat}} out on a sacrifice fly`];
        if (fielderToken) {
          parts.push(` to ${fielderToken}`);
          position = fieldedBy!;
        }
        finishSentence(parts);
        newNumOuts = outs + 1;
        break;
      }
      case PlateAppearanceType.DOUBLE_PLAY:
        sentences.push(`{${playerAtBat}} ${getContactVerb(contact!)} into a double play.`);
        outOnPlayRunners.forEach(({ runnerId }) => {
          let outBase: BaseType | null;
          if (runnerId === playerAtBat) {
            outBase = BaseType.FIRST;
          } else {
            const startBase = getBaseForRunner(runners, runnerId);
            outBase = contact === ContactQuality.GROUNDER ? getNewBase(startBase) : startBase;
          }
          if (contact === ContactQuality.GROUNDER || runnerId !== playerAtBat) {
            sentences.push(makeOutPhrase(runnerId, outBase));
            playerIds.push(runnerId);
          }
        });
        newNumOuts = outs + 2;
        break;
      case PlateAppearanceType.OUT: {
        const parts = [`{${playerAtBat}} ${getContactVerb(contact!)} out`];
        if (contact !== ContactQuality.NONE && fielderToken) {
          parts.push(` to ${fielderToken}`);
          position = fieldedBy!;
        }
        finishSentence(parts);
        newNumOuts = outs + 1;
        break;
      }
      case PlateAppearanceType.HOMERUN:
      case PlateAppearanceType.TRIPLE:
      case PlateAppearanceType.DOUBLE:
      case PlateAppearanceType.SINGLE: {
        const parts: string[] = [];
        if (type === PlateAppearanceType.HOMERUN && _.size(runners) === 3) {
          parts.push(`{${playerAtBat}} hits a grand slam`);
        } else {
          parts.push(`{${playerAtBat}} ${getHitVerb(type)}`);
        }
        if (contact) {
          parts.push(` on a ${getHitLabelFromContact(contact as HitContactType).toLowerCase()}`);
        }
        if (fieldedBy) {
          const token =
            type === PlateAppearanceType.HOMERUN
              ? getPositionTitle(fieldedBy).slice(0, -2)
              : fielderToken;
          parts.push(` to ${token}`);
          position = fieldedBy;
        }
        finishSentence(parts);
        break;
      }
    }
    if (scoredRunners.length) {
      scoredRunners.forEach(({ runnerId }) => {
        if (runnerId !== playerAtBat) {
          sentences.push(`{${runnerId}} scores.`);
          playerIds.push(runnerId);
        }
      });
      newScore = gameStateAfter.score as number[];
    }
    forEachRunner(runnersToMap(gameStateAfter.baseRunners), (runnerId, base) => {
      if (runners[base] !== runnerId && runnerId !== playerAtBat) {
        sentences.push(`{${runnerId}} to ${formatShortBaseName(base)}.`);
        playerIds.push(runnerId);
      }
    });
    _.forEach(basepathMovements, ({ endBase, runnerId, wasSafe }) => {
      if (!wasSafe) {
        sentences.push(`{${runnerId}} thrown out at ${formatShortBaseName(endBase)}.`);
        playerIds.push(runnerId);
        newNumOuts = (newNumOuts ?? outs) + 1;
      }
    });
    if (_.some(basepathMovements, { runnerId: playerAtBat, wasSafe: true })) {
      sentences.push(
        `{${playerAtBat}} to ${formatShortBaseName(
          _.find(basepathMovements, { runnerId: playerAtBat })!.endBase
        )} on the throw.`
      );
    }
  }

  return {
    description: sentences.join(' '),
    playerIds,
    position,
    newNumOuts,
    newScore,
  };
};
