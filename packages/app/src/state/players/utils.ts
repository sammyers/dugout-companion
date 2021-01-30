import _ from 'lodash';

import { Player } from './types';

export const formatName = (player?: Player) => {
  if (player && player.lastName) {
    return `${player.firstName} ${player.lastName}`;
  }
  return player?.firstName ?? '';
};

export const formatShortName = (player?: Player) => {
  if (!player) {
    return '';
  }
  if (player.lastName) {
    return `${player.firstName} ${player.lastName[0]}`;
  }
  return player.firstName;
};

export const getNameParts = (inputStr: string) => {
  const [firstName, ...lastName] = inputStr.split(' ');
  return { firstName: _.startCase(firstName), lastName: _.startCase(lastName.join(' ')) };
};
