import { BaseType } from '@dugout-companion/shared';
import React, { FC } from 'react';

import BaseAnimation from './BaseAnimation';

import theme from 'theme';
import { getSelectedRunnerOption } from 'state/prompts/selectors';
import { useAppSelector } from 'utils/hooks';

import { BasepathOutcome } from 'state/prompts/types';

interface Props {
  base: BaseType | null;
  transform: string;
  stroke: string;
  strokeWidth: string | number;
  occupied?: boolean;
  active?: boolean;
}

const brandColor = theme.global!.colors!.brand as string;

const getAnimationColor = (outcome?: BasepathOutcome) => {
  if (outcome?.attemptedAdvance) {
    return outcome.successfulAdvance ? 'status-ok' : 'status-critical';
  }
};

const Base: FC<Props> = ({ base, transform, stroke, strokeWidth, occupied, active }) => {
  const selected = useAppSelector(getSelectedRunnerOption);

  return (
    <g transform={transform}>
      <path
        fill={occupied ? brandColor : 'white'}
        d={
          base
            ? 'm 0,0 l 4.2499 4.2499 l -4.2499 4.2513 l -4.2513 -4.2513 l 4.2513 -4.2499 z'
            : 'M 0,0 l -2.872 2.872 l -2.828 -2.829 l 0 -2.871 l 5.7 0 l 0 2.828 z'
        }
        style={{ stroke, strokeWidth }}
        vectorEffect="non-scaling-stroke"
      >
        {active && <BaseAnimation color={getAnimationColor(selected)} />}
      </path>
    </g>
  );
};

export default Base;
