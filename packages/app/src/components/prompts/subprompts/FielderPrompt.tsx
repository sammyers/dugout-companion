import React, { FC, useMemo, useCallback, useEffect, CSSProperties } from 'react';
import { Button } from 'grommet';
import _ from 'lodash';

import { getSelectedFielderOption } from 'state/prompts/selectors';
import { promptActions } from 'state/prompts/slice';
import { useAppSelector, useAppDispatch } from 'utils/hooks';
import { getPositionAbbreviation } from 'utils/labels';

import { FieldingPosition } from '@dugout-companion/shared';
import { FielderOptions } from 'state/prompts/types';

const positions: Record<FieldingPosition, CSSProperties> = {
  [FieldingPosition.PITCHER]: {
    left: '50%',
    top: '62%',
    transform: 'translateX(-50%)',
  },
  [FieldingPosition.CATCHER]: {
    left: '50%',
    bottom: '5%',
    transform: 'translateX(-50%)',
  },
  [FieldingPosition.FIRST_BASE]: {
    top: '55%',
    right: '25%',
  },
  [FieldingPosition.SECOND_BASE]: {
    top: '40%',
    right: '32%',
  },
  [FieldingPosition.THIRD_BASE]: {
    top: '55%',
    left: '25%',
  },
  [FieldingPosition.SHORTSTOP]: {
    top: '40%',
    left: '32%',
  },
  [FieldingPosition.LEFT_FIELD]: {
    left: '16%',
    top: '30%',
  },
  [FieldingPosition.CENTER_FIELD]: {
    left: '50%',
    top: '15%',
    transform: 'translateX(-50%)',
  },
  [FieldingPosition.LEFT_CENTER]: {
    left: '30%',
    top: '15%',
  },
  [FieldingPosition.RIGHT_CENTER]: {
    right: '32%',
    top: '15%',
  },
  [FieldingPosition.RIGHT_FIELD]: {
    right: '16%',
    top: '30%',
  },
};

const FielderPrompt: FC<FielderOptions> = ({ options }) => {
  const dispatch = useAppDispatch();

  const selectedOption = useAppSelector(getSelectedFielderOption);

  useEffect(() => {
    if (!_.some(options, option => option.position === selectedOption?.position)) {
      dispatch(promptActions.clearFielderChoice());
    }
  }, [options, selectedOption, dispatch]);

  const handleChange = useCallback(
    (value: FieldingPosition) => () =>
      dispatch(promptActions.setFielderChoice(options.find(option => option.position === value)!)),
    [dispatch, options]
  );

  const selectorOptions = useMemo(() => _.map(options, 'position'), [options]);

  return (
    <>
      {selectorOptions.map(position => (
        <Button
          key={position}
          primary
          size="small"
          color={selectedOption?.position === position ? 'brand' : 'white'}
          label={getPositionAbbreviation(position)}
          style={{ position: 'absolute', ...positions[position] }}
          onClick={handleChange(position)}
        />
      ))}
    </>
  );
};

export default FielderPrompt;
