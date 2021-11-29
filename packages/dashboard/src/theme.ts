import { ThemeType } from "grommet";

const theme: ThemeType = {
  global: {
    colors: {
      brand: "#1c5253",
      "accent-1": "#A1EF8B",
      "accent-2": "#B58DB6",
      "accent-3": "#92D5E6",
      "accent-4": "#FFAD69",
      "neutral-1": "#5FA16F",
      "neutral-2": "#522B47",
      "neutral-3": "#0F6C95",
      "neutral-4": "#9C3848",
      "neutral-5": "#293241",
      "status-critical": "#FF4040",
      "status-critical-light": "#ffcccc",
      "status-ok": "#00C781",
      "status-ok-light": "#ccffed",
    },
    focus: {
      outline: {
        color: "transparent",
      },
    },
    font: {
      family: "Nunito Sans",
    },
  },
  rangeInput: {
    track: {
      height: "6px",
      extend: {
        borderRadius: "3px",
      } as any,
    },
  },
  accordion: {
    border: undefined,
  },
  button: {
    border: {
      radius: "4px",
    },
  },
};

export default theme;
