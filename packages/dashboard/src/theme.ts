import { ThemeType } from 'grommet';
import { FormDown, FormNext } from 'grommet-icons';

const theme: ThemeType = {
  global: {
    breakpoints: {
      xsmall: {
        value: 500,
      },
    },
    colors: {
      brand: '#1c5253',
      'accent-1': '#A1EF8B',
      'accent-2': '#B58DB6',
      'accent-3': '#92D5E6',
      'accent-4': '#FFAD69',
      'neutral-1': '#5FA16F',
      'neutral-2': '#522B47',
      'neutral-3': '#0F6C95',
      'neutral-4': '#9C3848',
      'neutral-5': '#293241',
      'neutral-6': '#475671', // lighter shade of neutral-5
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
  text: {
    medium: {
      size: '14px',
    },
    small: {
      size: '12px',
    },
    large: {
      size: '18px',
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
  dataTable: {
    icons: {
      expand: FormNext,
      contract: FormDown,
    },
  },
};

export default theme;
