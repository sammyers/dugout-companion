import React from 'react';
import { Anchor, AnchorProps } from 'grommet';
import { Link, LinkProps } from 'react-router-dom';

export type AnchorLinkProps = LinkProps & AnchorProps & Omit<JSX.IntrinsicElements['a'], 'color'>;

const AnchorLink: React.FC<AnchorLinkProps> = props => (
  <Anchor as={({ colorProp, hasIcon, hasLabel, ...rest }) => <Link {...rest} />} {...props} />
);

export default AnchorLink;
