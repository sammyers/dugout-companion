import { ThemeType } from 'grommet';

const theme: ThemeType = {
  global: {
    colors: {
      brand: '#1c5253',
      'accent-3': '#C3DFE0',
      'status-critical': '#FF4040',
      'status-critical-light': '#ffcccc',
      'status-ok': '#00C781',
      'status-ok-light': '#ccffed',
    },
    focus: {
      outline: {
        color: 'transparent',
      },
    },
    font: {
      family: 'Nunito Sans',
    },
  },
  rangeInput: {
    track: {
      height: '6px',
      extend: {
        borderRadius: '3px',
      } as any,
    },
  },
  accordion: {
    border: undefined,
  },
  button: {
    border: {
      radius: '4px',
    },
  },
};

export default theme;
