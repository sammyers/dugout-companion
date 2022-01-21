import React, { FC } from 'react';
import { Box, BoxProps } from 'grommet';

const PageBlock: FC<BoxProps> = props => {
  return <Box margin="small" pad="small" background="neutral-5" round="small" {...props} />;
};

export default PageBlock;
