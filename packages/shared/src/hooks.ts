import { ThemeContext, ThemeType } from 'grommet';
import { useContext } from 'react';

export const useColor = (color: string) => {
  const theme = useContext(ThemeContext) as ThemeType;
  if (color.startsWith('#')) {
    return color;
  }

  return theme.global?.colors?.[color] as string;
};
