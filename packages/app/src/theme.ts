import { ThemeType } from 'grommet';

const theme: ThemeType = {
  global: {
    colors: {
      brand: '#1c5253',
      'accent-3': '#C3DFE0',
      'status-critical-light': '#ffcccc',
      'status-ok-light': '#ccffed',
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
  accordion: {
    border: undefined,
  },
};

export default theme;
