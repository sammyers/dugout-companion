import React, { FC, useMemo, useCallback, useEffect, CSSProperties } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from 'grommet';
import _ from 'lodash';

import { getSelectedFielderOption } from 'state/prompts/selectors';
import { promptActions } from 'state/prompts/slice';
import { useAppSelector, useAppDispatch } from 'utils/hooks';
import { getPositionAbbreviation } from 'utils/labels';

import { FieldingPosition } from '@sammyers/dc-shared';
import { FielderOptions } from 'state/prompts/types';

const AnimatedButton = motion(Button);

const pct = (val: number) => `${val}%`;

const positions: Record<FieldingPosition, CSSProperties> = {
  [FieldingPosition.PITCHER]: { top: 62, left: 50 },
  [FieldingPosition.CATCHER]: { top: 82, left: 50 },
  [FieldingPosition.FIRST_BASE]: { top: 55, right: 31 },
  [FieldingPosition.SECOND_BASE]: { top: 38, right: 38 },
  [FieldingPosition.THIRD_BASE]: { top: 55, left: 31 },
  [FieldingPosition.SHORTSTOP]: { top: 38, left: 38 },
  [FieldingPosition.LEFT_FIELD]: { top: 25, left: 22 },
  [FieldingPosition.CENTER_FIELD]: { top: 12, left: 50 },
  [FieldingPosition.LEFT_CENTER]: { top: 15, left: 40 },
  [FieldingPosition.RIGHT_CENTER]: { top: 15, right: 40 },
  [FieldingPosition.RIGHT_FIELD]: { top: 25, right: 22 },
};

const FielderOverlay: FC<FielderOptions> = ({ options }) => {
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
    <AnimatePresence>
      {selectorOptions.map(position => {
        const { top, ...style } = positions[position];
        const animateFrom = top! <= 30 ? '-15%' : '110%';
        return (
          <AnimatedButton
            key={position}
            primary
            size="small"
            color={selectedOption?.position === position ? 'brand' : 'white'}
            label={getPositionAbbreviation(position)}
            style={{
              position: 'absolute',
              transform: `translateX(${style.left ? '-' : ''}50%)`,
              [style.left ? 'left' : 'right']: pct(
                (style.left as number) ?? (style.right as number)
              ),
            }}
            initial={{ top: animateFrom }}
            animate={{ top: pct(top as number) }}
            exit={{ top: animateFrom }}
            onClick={handleChange(position)}
          />
        );
      })}
    </AnimatePresence>
  );
};

export default FielderOverlay;
