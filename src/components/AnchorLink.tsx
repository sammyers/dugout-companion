import React from 'react';
import { Anchor, AnchorProps } from 'grommet';
import { Link, LinkProps, useRouteMatch } from 'react-router-dom';

export type AnchorLinkProps = LinkProps & AnchorProps & Omit<JSX.IntrinsicElements['a'], 'color'>;

const AnchorLink: React.FC<AnchorLinkProps> = props => {
  const match = useRouteMatch({ path: props.to as string });
  return (
    <Anchor
      color={!!match ? 'accent-4' : 'accent-3'}
      as={({ colorProp, hasIcon, hasLabel, ...rest }) => <Link {...rest} />}
      {...props}
    />
  );
};
export default AnchorLink;
