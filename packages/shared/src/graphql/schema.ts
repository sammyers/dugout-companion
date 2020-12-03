import { gql } from 'apollo-server-express';

export default gql`
  type Player {
    id: ID!
    firstName: String!
    lastName: String
  }

  type Query {
    players: [Player]
  }
`;
