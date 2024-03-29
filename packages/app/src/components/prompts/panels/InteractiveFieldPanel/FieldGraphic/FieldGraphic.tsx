import React, { useCallback, FC } from 'react';
import { motion } from 'framer-motion';
import _ from 'lodash';

import { BaseType } from '@sammyers/dc-shared';

import Base from './Base';

import theme from 'theme';

interface Props {
  runnerMode: boolean;
  runners?: Record<string, BaseType | null>;
  selectedBase?: BaseType | null;
}

const mainColor = theme.global!.colors!['neutral-5'] as string;
const bases = [..._.values(BaseType), null];

const FieldGraphic: FC<Props> = ({ runnerMode, runners, selectedBase }) => {
  const baseOccupied = useCallback(
    (base: BaseType | null) => _.some(runners, occupiedBase => base === occupiedBase),
    [runners]
  );

  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 350 245"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      xmlSpace="preserve"
      preserveAspectRatio="xMidYMax meet"
      style={{
        fillRule: 'evenodd',
        clipRule: 'evenodd',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        strokeMiterlimit: 1.5,
        overflow: 'visible',
      }}
    >
      <motion.g
        animate={runnerMode ? 'runnerMode' : 'fielderMode'}
        variants={{
          fielderMode: {
            translateY: 0,
            scale: 1,
            stroke: '#000000',
          },
          runnerMode: {
            translateY: -96,
            scale: 2,
            stroke: mainColor,
          },
        }}
      >
        <g>
          <g transform="matrix(1,0,0,1,-30,-81)">
            <path
              d="M43.054,171.551C78.254,119.828 137.589,85.838 204.8,85.838C272.011,85.838 331.346,119.828 366.546,171.551L215.036,323.068L194.564,323.068L43.054,171.551Z"
              style={{
                fill: 'rgb(104,182,132)',
                stroke: 'black',
                strokeWidth: '2px',
              }}
            />
          </g>
          <g transform="matrix(1,0,0,1,-27.5,-77.742)">
            <path
              d="M120.598,248.341C122.418,204.73 158.395,169.885 202.447,169.885C246.403,169.885 282.321,204.58 284.284,248.059L212.536,319.81L192.064,319.81L120.598,248.341Z"
              style={{
                fill: 'rgb(163,122,116)',
                stroke: 'black',
                strokeWidth: '2px',
              }}
            />
          </g>
          <g transform="matrix(1,0,0,1,-30,-81)">
            <path
              d="M54.051,156.91C89.923,113.511 144.156,85.838 204.8,85.838C265.586,85.838 319.929,113.64 355.805,157.22L205.083,307.942L54.051,156.91Z"
              style={{ fill: 'white', fillOpacity: 0, stroke: 'white', strokeWidth: '1px' }}
            />
          </g>
          <g transform="matrix(1,0,0,1,-27.5,-77.742)">
            <path
              d="M209.171,205.636L244.507,240.972C243.34,242.923 242.669,245.205 242.669,247.643C242.669,250.089 243.345,252.378 244.519,254.334L210.965,287.888C208.688,285.938 205.73,284.759 202.5,284.759C199.27,284.759 196.312,285.938 194.035,287.888L160.648,254.501C161.885,252.508 162.599,250.158 162.599,247.643C162.599,245.135 161.89,242.793 160.66,240.805L195.829,205.636C197.781,206.803 200.063,207.473 202.5,207.473C204.937,207.473 207.219,206.803 209.171,205.636Z"
              style={{
                fill: 'rgb(104,182,132)',
                stroke: 'black',
                strokeWidth: '2px',
              }}
            />
          </g>
          <g transform="matrix(0.61869,0,0,0.61869,48.1631,11.6204)">
            <circle
              cx="205.143"
              cy="254.407"
              r="14.547"
              style={{
                fill: 'rgb(163,122,116)',
                stroke: 'black',
                strokeWidth: '3.23px',
              }}
            />
          </g>
          <g transform="matrix(1,0,0,1,-30,-81)">
            <path
              d="M43.054,171.551C78.254,119.828 137.589,85.838 204.8,85.838C272.011,85.838 331.346,119.828 366.546,171.551L215.036,323.068L194.564,323.068L43.054,171.551Z"
              style={{
                fill: 'rgb(104,182,132)',
                fillOpacity: 0,
                stroke: 'black',
                strokeWidth: '2px',
              }}
            />
          </g>
        </g>
        {bases.map((base, i) => (
          <Base
            key={i}
            base={base}
            runnerMode={runnerMode}
            active={runnerMode && selectedBase === base}
            occupied={runnerMode && baseOccupied(base)}
          />
        ))}
      </motion.g>
    </svg>
  );
};

export default FieldGraphic;
