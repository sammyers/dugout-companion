import _ from 'lodash';

import { getNewBase, getBaseForRunner, forEachRunner } from 'state/game/utils';
import { getHitLabelFromContact } from 'utils/labels';

import {
  PlateAppearanceType,
  FieldingPosition,
  ContactType,
  HitContactType,
  RecordedPlay,
  BaseType,
  HitType,
} from 'state/game/types';

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

const getContactVerb = (contactType: ContactType) =>
  ({
    [ContactType.NONE]: 'strikes',
    [ContactType.GROUNDER]: 'grounds',
    [ContactType.LAZY_FLY]: 'flies',
    [ContactType.LINE_DRIVE]: 'lines',
    [ContactType.LONG_FLY]: 'flies',
    [ContactType.POPUP]: 'pops',
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

const formatShortBaseName = (base: BaseType | null) => {
  if (base === null) return 'home';
  return {
    [BaseType.FIRST]: '1st',
    [BaseType.SECOND]: '2nd',
    [BaseType.THIRD]: '3rd',
  }[base];
};

const makeOutPhrase = (runnerId: string, base: BaseType | null) =>
  `{${runnerId}} out at ${formatShortBaseName(base)}.`;

export const getPlayDescription = ({
  gameState,
  event,
  runnersScored,
  runnersAfter,
  scoreAfter,
}: RecordedPlay) => {
  const sentences: string[] = [];
  const playerIds: string[] = [];
  let position: FieldingPosition | undefined;
  let newNumOuts: number | undefined;
  let newScore: [number, number] | undefined;

  const finishSentence = (parts: string[]) => {
    sentences.push([...parts, '.'].join(''));
  };

  if (event.kind === 'stolenBaseAttempt') {
    const endBase = getNewBase(getBaseForRunner(gameState.runners, event.runnerId));
    if (event.success) {
      sentences.push(`{${event.runnerId}} steals ${formatBaseName(endBase)}.`);
    } else {
      sentences.push(`{${event.runnerId}} is caught stealing ${formatBaseName(endBase)}.`);
      newNumOuts = gameState.outs + 1;
    }
    playerIds.push(event.runnerId);
  } else {
    const { atBat, runners, outs } = gameState;
    const { fieldedBy, contactType, runnersOutOnPlay, basesTaken, outsOnBasepaths } = event;
    playerIds.push(atBat);
    const fielderToken = fieldedBy && `${getPositionTitle(fieldedBy)} {${fieldedBy}}`;

    switch (event.type) {
      case PlateAppearanceType.WALK:
        sentences.push(`{${atBat}} walks.`);
        break;
      case PlateAppearanceType.FIELDERS_CHOICE: {
        const parts = [`{${atBat}} hits into a fielder's choice`];
        if (fielderToken) {
          parts.push(`, fielded by ${fielderToken}`);
          position = event.fieldedBy;
        }
        finishSentence(parts);
        sentences.push(
          makeOutPhrase(
            runnersOutOnPlay[0],
            getNewBase(getBaseForRunner(runners, runnersOutOnPlay[0]))
          )
        );
        playerIds.push(runnersOutOnPlay[0]);
        newNumOuts = outs + 1;
        break;
      }
      case PlateAppearanceType.SACRIFICE_FLY: {
        const parts = [`{${atBat}} out on a sacrifice fly`];
        if (fielderToken) {
          parts.push(` to ${fielderToken}`);
          position = fieldedBy;
        }
        finishSentence(parts);
        newNumOuts = outs + 1;
        break;
      }
      case PlateAppearanceType.DOUBLE_PLAY:
        sentences.push(`{${atBat}} ${getContactVerb(contactType!)} into a double play.`);
        runnersOutOnPlay.forEach(runnerId => {
          let outBase: BaseType | null;
          if (runnerId === atBat) {
            outBase = BaseType.FIRST;
          } else {
            const startBase = getBaseForRunner(runners, runnerId);
            outBase = contactType === ContactType.GROUNDER ? getNewBase(startBase) : startBase;
          }
          sentences.push(makeOutPhrase(runnerId, outBase));
          playerIds.push(runnerId);
        });
        newNumOuts = outs + 2;
        break;
      case PlateAppearanceType.OUT: {
        const parts = [`{${atBat}} ${getContactVerb(contactType!)} out`];
        if (contactType !== ContactType.NONE && fielderToken) {
          parts.push(` to ${fielderToken}`);
          position = fieldedBy;
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
        if (event.type === PlateAppearanceType.HOMERUN && _.size(runners) === 3) {
          parts.push(`{${atBat}} hits a grand slam`);
        } else {
          parts.push(`{${atBat}} ${getHitVerb(event.type)}`);
        }
        if (contactType) {
          parts.push(
            ` on a ${getHitLabelFromContact(contactType as HitContactType).toLowerCase()}`
          );
        }
        if (fieldedBy) {
          const token =
            event.type === PlateAppearanceType.HOMERUN
              ? getPositionTitle(fieldedBy).slice(0, -2)
              : fielderToken;
          parts.push(` to ${token}`);
          position = fieldedBy;
        }
        finishSentence(parts);
        break;
      }
    }
    if (runnersScored.length) {
      runnersScored.forEach(runnerId => {
        if (runnerId !== atBat) {
          sentences.push(`{${runnerId}} scores.`);
          playerIds.push(runnerId);
        }
      });
      newScore = scoreAfter;
    }
    forEachRunner(runnersAfter, (runnerId, base) => {
      if (runners[base] !== runnerId && runnerId !== atBat) {
        sentences.push(`{${runnerId}} to ${formatShortBaseName(base)}.`);
        playerIds.push(runnerId);
      }
    });
    _.forEach(outsOnBasepaths, (base, runnerId) => {
      sentences.push(`{${runnerId}} thrown out at ${formatShortBaseName(base)}.`);
      playerIds.push(runnerId);
      newNumOuts = (newNumOuts ?? outs) + 1;
    });
    if (atBat in basesTaken) {
      sentences.push(`{${atBat}} to ${formatShortBaseName(basesTaken[atBat])} on the throw.`);
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
