import { Resolvers } from '@dugout-companion/shared';

const players = [
  { id: 'foo', firstName: 'Sam' },
  { id: 'bar', firstName: 'Bianca', lastName: 'Schindeler' },
];

export const resolvers: Resolvers = {
  Query: {
    players: () => players,
  },
  Player: {
    id: player => player.id,
    firstName: player => player.firstName,
    lastName: player => player.lastName ?? null,
  },
};
