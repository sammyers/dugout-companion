import { ThemeType } from 'grommet';

const theme: ThemeType = {
  global: {
    colors: {
      brand: '#1c5253',
      'accent-3': '#C3DFE0',
    },
    focus: {
      outline: {
        color: 'transparent',
      },
    },
  },
  rangeInput: {
    track: {
      height: '6px',
      extend: {
        borderRadius: '3px',
      },
    },
  },
};

export default theme;
