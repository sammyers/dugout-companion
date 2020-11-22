import React, { ReactNode, useCallback } from 'react';
import { Box, Text } from 'grommet';
import _ from 'lodash';

interface BaseProps<T> {
  options: (T | { value: T; label: ReactNode })[];
}

interface SingleChoiceProps<T> extends BaseProps<T> {
  multiple?: false;
  value?: T;
  onChange: (value: T) => void;
}

interface MultipleChoiceProps<T> extends BaseProps<T> {
  multiple: true;
  value: T[];
  onChange: (value: T[]) => void;
}

type Props<T> = SingleChoiceProps<T> | MultipleChoiceProps<T>;

const OptionSelector = <T extends any>({ options, multiple, value, onChange }: Props<T>) => {
  const isSelected = useCallback(
    (val: T) => (multiple ? (value as T[]).includes(val) : val === value),
    [multiple, value]
  );

  const handleClickOption = useCallback(
    (clickedVal: T) => () => {
      if (multiple && _.isArray(value)) {
        (onChange as MultipleChoiceProps<T>['onChange'])(
          value.includes(clickedVal)
            ? value.filter(val => val !== clickedVal)
            : value.concat(clickedVal)
        );
      } else {
        (onChange as SingleChoiceProps<T>['onChange'])(clickedVal);
      }
    },
    [multiple, value, onChange]
  );

  return (
    <Box direction="row" round border overflow="hidden">
      {options.map((option, index) => {
        let label, value;
        if (_.isObject(option) && 'label' in option) {
          label = option.label;
          value = option.value;
        } else {
          label = value = option;
        }
        const selected = isSelected(value);

        return (
          <Box
            key={`${index}_of_${options.length}`}
            flex
            onClick={handleClickOption(value)}
            background={selected ? 'brand' : undefined}
            hoverIndicator={!selected}
            pad="small"
            align="center"
            justify="center"
            border={index > 0 ? { side: 'left', size: '1px' } : undefined}
          >
            <Text textAlign="center">{label as ReactNode}</Text>
          </Box>
        );
      })}
    </Box>
  );
};

export default OptionSelector;
