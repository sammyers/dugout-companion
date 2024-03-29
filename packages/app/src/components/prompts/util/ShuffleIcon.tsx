import React, { FC } from 'react';
import { useColor } from '@sammyers/dc-shared';

const ShuffleIcon: FC = () => {
  const color = useColor('dark-2');

  return (
    <svg
      width={24}
      height={24}
      strokeWidth="0"
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="none"
        stroke={color}
        strokeLinecap="square"
        strokeLinejoin="miter"
        strokeWidth="42"
        d="M400 304l48 48-48 48m0-288l48 48-48 48M64 352h85.19a80 80 0 0066.56-35.62L256 256"
      />
      <path
        fill="none"
        stroke={color}
        strokeLinecap="square"
        strokeLinejoin="miter"
        strokeWidth="42"
        d="M64 160h85.19a80 80 0 0166.56 35.62l80.5 120.76A80 80 0 00362.81 352H416m0-192h-53.19a80 80 0 00-66.56 35.62L288 208"
      />
    </svg>
  );
};

export default ShuffleIcon;
