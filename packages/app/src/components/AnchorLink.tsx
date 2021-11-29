import React from 'react';
import { Anchor, AnchorProps } from 'grommet';
import { Link, LinkProps, useMatch } from 'react-router-dom';

export type AnchorLinkProps = LinkProps & AnchorProps & Omit<JSX.IntrinsicElements['a'], 'color'>;

const AnchorLink: React.FC<AnchorLinkProps> = props => {
  const match = useMatch({ path: props.to as string });
  return (
    <Anchor
      color={!!match ? 'accent-1' : 'light-2'}
      as={({ colorProp, hasIcon, hasLabel, ...rest }) => <Link {...rest} />}
      {...props}
    />
  );
};
export default AnchorLink;
