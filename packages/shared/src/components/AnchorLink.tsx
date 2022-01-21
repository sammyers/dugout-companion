import React from 'react';
import { Anchor, AnchorProps } from 'grommet';
import { Link, LinkProps, useMatch } from 'react-router-dom';

export type AnchorLinkProps = LinkProps &
  AnchorProps &
  Omit<JSX.IntrinsicElements['a'], 'color'> & {
    matchColor?: string;
    defaultColor?: string;
  };

const AnchorLink: React.FC<AnchorLinkProps> = ({
  matchColor = 'accent-1',
  defaultColor = 'light-2',
  ...props
}) => {
  const match = useMatch({ path: props.to as string });
  return (
    <Anchor
      color={!!match ? matchColor : defaultColor}
      as={({ colorProp, hasIcon, hasLabel, ...rest }) => <Link {...rest} />}
      {...props}
    />
  );
};
export default AnchorLink;
