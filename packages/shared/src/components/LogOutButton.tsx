import React, { FC } from 'react';
import { Button, ButtonProps } from 'grommet';
import { Logout } from 'grommet-icons';

import { useLogout } from '../hooks';

const LogOutButton: FC<ButtonProps> = props => {
  const logout = useLogout();

  return <Button onClick={logout} label="Log Out" icon={<Logout />} {...props} />;
};

export default LogOutButton;
