import React, { ReactNode, useCallback } from 'react';
import { Box, BoxProps, Button, Text } from 'grommet';
import _ from 'lodash';

interface BaseProps<T> {
  options: (T | { value: T; label: ReactNode; extra?: string })[];
  vertical?: boolean;
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

const OptionSelector = <T extends any>({
  options,
  multiple,
  value,
  onChange,
  vertical,
  ...otherProps
}: Props<T> & BoxProps) => {
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

  const boxProps = vertical
    ? ({
        flex: true,
        direction: 'column',
        justify: 'center',
        align: 'center',
        gap: 'medium',
      } as const)
    : ({ direction: 'row', border: true, round: true, overflow: 'hidden' } as const);

  return (
    <Box {...boxProps} {...otherProps}>
      {options.map((option, index) => {
        let label, value, extra;
        if (_.isObject(option) && 'label' in option) {
          label = option.label;
          value = option.value;
          extra = option.extra;
        } else {
          label = value = option;
        }

        const selected = isSelected(value);
        const handleClick = handleClickOption(value);

        if (vertical) {
          return (
            <Box style={{ position: 'relative' }}>
              <Button
                key={`${index}_of_${options.length}`}
                size="large"
                label={label as ReactNode}
                onClick={handleClick}
                primary={selected}
              />
              {extra && (
                <Box
                  pad={{ left: 'small' }}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    right: 0,
                    transform: 'translate(100%,-50%)',
                  }}
                >
                  <Text style={{ fontStyle: 'italic' }}>{extra}</Text>
                </Box>
              )}
            </Box>
          );
        }

        return (
          <Box
            flex
            width={typeof label === 'string' && label.length < 4 ? 'xxsmall' : 'xsmall'}
            background={selected ? 'brand' : undefined}
            hoverIndicator={!selected}
            pad="small"
            align="center"
            justify="center"
            border={index > 0 ? { side: 'left', size: '1px' } : undefined}
            onClick={handleClick}
          >
            <Text size="small" textAlign="center">
              {label as ReactNode}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
};

export default OptionSelector;
