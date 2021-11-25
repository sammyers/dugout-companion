import React, { FC } from 'react';
import { motion } from 'framer-motion';

import { BaseType } from '@sammyers/dc-shared';

import BaseAnimation from './BaseAnimation';

import theme from 'theme';
import { getCurrentSelectedRunnerOption } from 'state/prompts/selectors';
import { useAppSelector } from 'utils/hooks';

import { BasepathOutcome } from 'state/prompts/types';

interface Props {
  base: BaseType | null;
  runnerMode?: boolean;
  occupied?: boolean;
  active?: boolean;
}

const brandColor = theme.global!.colors!.brand as string;

const getAnimationColor = (outcome?: BasepathOutcome) => {
  if (outcome?.attemptedAdvance) {
    return outcome.successfulAdvance ? 'status-ok' : 'status-critical';
  }
};

const getTransformProperties = (base: BaseType | null) => {
  switch (base) {
    case BaseType.FIRST:
      return { x: 227.9626, y: 165.6496, originX: 1, originY: 0.5 };
    case BaseType.SECOND:
      return { x: 175.1369, y: 112.5846, originX: 0.5, originY: 0 };
    case BaseType.THIRD:
      return { x: 122.0723, y: 165.6496, originX: 0, originY: 0.5 };
    default:
      return { x: 177.987, y: 224.07, originX: 0.5, originY: 1 };
  }
};

const Base: FC<Props> = ({ base, runnerMode, occupied, active }) => {
  const selected = useAppSelector(getCurrentSelectedRunnerOption);

  return (
    <motion.g
      style={getTransformProperties(base)}
      animate={{
        scale: runnerMode ? 6 : 1,
        strokeWidth: runnerMode ? '3px' : '1px',
      }}
    >
      <path
        fill={base && occupied ? brandColor : 'white'}
        d={
          base
            ? 'm 0,0 l 4.2499 4.2499 l -4.2499 4.2513 l -4.2513 -4.2513 l 4.2513 -4.2499 z'
            : 'M 0,0 l -2.872 2.872 l -2.828 -2.829 l 0 -2.871 l 5.7 0 l 0 2.828 z'
        }
        style={{ stroke: runnerMode ? brandColor : 'black' }}
        vectorEffect="non-scaling-stroke"
      >
        {active && <BaseAnimation color={getAnimationColor(selected)} />}
      </path>
    </motion.g>
  );
};

export default Base;
