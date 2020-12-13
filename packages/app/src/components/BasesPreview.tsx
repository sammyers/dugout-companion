import React, { FC } from 'react';
import { Blank, IconProps } from 'grommet-icons';

import { BaseType } from '@dugout-companion/shared';
import { BaseRunnerMap } from 'state/game/types';

interface Props {
  bases: BaseRunnerMap;
}

const BasesPreview: FC<IconProps & Props> = ({ bases, ...props }) => {
  const { [BaseType.FIRST]: first, [BaseType.SECOND]: second, [BaseType.THIRD]: third } = bases;
  return (
    <Blank size="large" {...props}>
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
                fill="#000000"
                fillOpacity={first ? '1' : '0'}
              />
              <g clipPath="url(#clipa6tqurtbA)">
                <use
                  xlinkHref="#aqb5ZIsm9"
                  opacity="1"
                  fillOpacity="0"
                  stroke="#000000"
                  strokeWidth="2"
                  strokeOpacity="1"
                />
              </g>
            </g>
            <g>
              <use
                xlinkHref="#a1RZhYfL4q"
                opacity="1"
                fill="#000000"
                fillOpacity={second ? '1' : '0'}
              />
              <g clipPath="url(#clipg3BqRYPvvE)">
                <use
                  xlinkHref="#a1RZhYfL4q"
                  opacity="1"
                  fillOpacity="0"
                  stroke="#000000"
                  strokeWidth="2"
                  strokeOpacity="1"
                />
              </g>
            </g>
            <g>
              <use
                xlinkHref="#bosriBPNJ"
                opacity="1"
                fill="#000000"
                fillOpacity={third ? '1' : '0'}
              />
              <g clipPath="url(#cliph2h312r3G7)">
                <use
                  xlinkHref="#bosriBPNJ"
                  opacity="1"
                  fillOpacity="0"
                  stroke="#000000"
                  strokeWidth="2"
                  strokeOpacity="1"
                />
              </g>
            </g>
          </g>
        </g>
      </svg>
    </Blank>
  );
};

export default BasesPreview;
