import React, { FC, useMemo, useCallback, useEffect } from 'react';
import { Box, Heading } from 'grommet';

import OptionSelector from '../OptionSelector';

import { FielderOptions } from 'state/prompts/types';
import { getSelectedFielderOption } from 'state/prompts/selectors';
import { promptActions } from 'state/prompts/slice';
import { useAppSelector, useAppDispatch } from 'utils/hooks';

const FielderPrompt: FC<FielderOptions & { showTitle?: boolean }> = ({
  options,
  showTitle = true,
}) => {
  const dispatch = useAppDispatch();

  useEffect(
    () => () => {
      dispatch(promptActions.clearFielderChoice());
    },
    [dispatch]
  );

  const selectedOption = useAppSelector(getSelectedFielderOption);

  const formattedOptions = useMemo(() => options.map(({ label, id }) => ({ label, value: id })), [
    options,
  ]);

  const handleChange = useCallback(
    (value: number) => dispatch(promptActions.setFielderChoice(options[value])),
    [dispatch, options]
  );

  return (
    <Box flex>
      {showTitle && (
        <Heading level={4} margin={{ top: 'none', bottom: 'xsmall' }} alignSelf="center">
          Hit to
        </Heading>
      )}
      <OptionSelector
        options={formattedOptions}
        value={selectedOption?.id}
        onChange={handleChange}
      />
    </Box>
  );
};

export default FielderPrompt;
