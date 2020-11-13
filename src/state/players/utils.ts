import { Player } from './types';

export const formatShortName = ({ firstName, lastName }: Player) => `${firstName} ${lastName[0]}`;
