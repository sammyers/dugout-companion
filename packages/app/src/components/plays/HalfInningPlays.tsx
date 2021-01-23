import React, { FC } from 'react';
import { Card, CardHeader, Text, CardBody } from 'grommet';

import { HalfInning } from '@sammyers/dc-shared';

import Play from './Play';

import { getOrdinalInning } from 'utils/labels';

import { HalfInningPlaysGroup } from 'state/plays/types';

const HalfInningPlays: FC<HalfInningPlaysGroup> = ({ inning, halfInning, plays }) => (
  <Card background="light-1">
    <CardHeader background="light-2" pad="medium">
      <Text>
        {halfInning === HalfInning.TOP ? 'Top' : 'Bottom'} {getOrdinalInning(inning)}
      </Text>
    </CardHeader>
    <CardBody pad={{ horizontal: 'medium', vertical: 'small' }} gap="small" border="between">
      {plays.map((play, i) => (
        <Play key={i} {...play} />
      ))}
    </CardBody>
  </Card>
);

export default HalfInningPlays;
