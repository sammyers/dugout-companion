import React, { FC } from 'react';

import { useColor } from '../hooks';

import { BaseType } from '../gql';

interface Props {
  bases: Partial<Record<BaseType, string>>;
  occupiedColor?: string;
  unoccupiedColor?: string;
}

const BasesPreview: FC<Props> = ({ bases, occupiedColor, unoccupiedColor }) => {
  const unoccupiedColorHex = useColor(unoccupiedColor ?? 'light-6');
  const occupiedColorHex = useColor(occupiedColor ?? 'accent-4');

  const { [BaseType.FIRST]: first, [BaseType.SECOND]: second, [BaseType.THIRD]: third } = bases;

  const getBaseColor = (baseOccupant: string | undefined) =>
    baseOccupant ? occupiedColorHex : unoccupiedColorHex;

  return (
    <svg style={{ width: '48px', height: '48px' }} viewBox="0 0 24 24">
      <svg
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        preserveAspectRatio="xMidYMid meet"
        viewBox="0 0 48 48"
        width="24"
        height="24"
      >
        <defs>
          <path d="M24 25.73L13.11 14.84L24 3.95L34.89 14.84L24 25.73Z" id="a1RZhYfL4q" />
          <clipPath id="clipg3BqRYPvvE">
            <use xlinkHref="#a1RZhYfL4q" opacity="1" />
          </clipPath>
          <path d="M36.31 38.05L25.42 27.16L36.31 16.27L47.2 27.16L36.31 38.05Z" id="aqb5ZIsm9" />
          <clipPath id="clipa6tqurtbA">
            <use xlinkHref="#aqb5ZIsm9" opacity="1" />
          </clipPath>
          <path d="M11.69 38.05L0.8 27.16L11.69 16.27L22.58 27.16L11.69 38.05Z" id="bosriBPNJ" />
          <clipPath id="cliph2h312r3G7">
            <use xlinkHref="#bosriBPNJ" opacity="1" />
          </clipPath>
        </defs>
        <g>
          <g>
            <g>
              <use
                xlinkHref="#aqb5ZIsm9"
                opacity="1"
                fill={getBaseColor(first)}
                fillOpacity={first ? '1' : '0'}
              />
              <g clipPath="url(#clipa6tqurtbA)">
                <use
                  xlinkHref="#aqb5ZIsm9"
                  opacity="1"
                  fillOpacity="0"
                  stroke={getBaseColor(first)}
                  strokeWidth="2"
                  strokeOpacity="1"
                />
              </g>
            </g>
            <g>
              <use
                xlinkHref="#a1RZhYfL4q"
                opacity="1"
                fill={getBaseColor(second)}
                fillOpacity={second ? '1' : '0'}
              />
              <g clipPath="url(#clipg3BqRYPvvE)">
                <use
                  xlinkHref="#a1RZhYfL4q"
                  opacity="1"
                  fillOpacity="0"
                  stroke={getBaseColor(second)}
                  strokeWidth="2"
                  strokeOpacity="1"
                />
              </g>
            </g>
            <g>
              <use
                xlinkHref="#bosriBPNJ"
                opacity="1"
                fill={getBaseColor(third)}
                fillOpacity={third ? '1' : '0'}
              />
              <g clipPath="url(#cliph2h312r3G7)">
                <use
                  xlinkHref="#bosriBPNJ"
                  opacity="1"
                  fillOpacity="0"
                  stroke={getBaseColor(third)}
                  strokeWidth="2"
                  strokeOpacity="1"
                />
              </g>
            </g>
          </g>
        </g>
      </svg>
    </svg>
  );
};

export default BasesPreview;
