import _ from 'lodash';

import { Player } from './types';

export const formatShortName = ({ firstName, lastName }: Player) => `${firstName} ${lastName[0]}`;

export const getNameParts = (inputStr: string) => {
  const [firstName, ...lastName] = inputStr.split(' ');
  return { firstName: _.startCase(firstName), lastName: _.startCase(lastName.join(' ')) };
};
