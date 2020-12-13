import React, { FC, useContext } from 'react';
import { Box, Text } from 'grommet';

import BasesPreview from 'components/BasesPreview';

import { getPlateAppearancePreview } from 'state/prompts/selectors';
import { useAppSelector } from 'utils/hooks';
import { promptContext } from './EventDetailPrompt';

const PlateAppearancePreview: FC = () => {
  const paType = useContext(promptContext);

  const {
    runners,
    scoredRunners: { length: runs },
    outs,
  } = useAppSelector(state => getPlateAppearancePreview(state, paType));

  return (
    <Box direction="row" align="center" alignSelf="center" gap="medium">
      <Text weight="bold">Preview</Text>
      <Box
        round
        direction="row"
        align="center"
        gap="small"
        border={!!runs}
        pad={runs ? 'xsmall' : undefined}
      >
        <Box round direction="row" align="center" gap="small" background="brand" pad="small">
          <BasesPreview bases={runners} />
          <Text>{outs === 3 ? 'Inning over' : `${outs} out${outs !== 1 ? 's' : ''}`}</Text>
        </Box>
        {!!runs && (
          <Text>
            {runs} {runs > 1 ? 'runs score' : 'run scores'}.
          </Text>
        )}
      </Box>
    </Box>
  );
};

export default PlateAppearancePreview;
