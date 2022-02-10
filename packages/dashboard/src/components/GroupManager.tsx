import React, { useEffect } from 'react';
import { Outlet, useNavigate, useParams } from 'react-router-dom';

import { useGroupContext } from './context';

const GroupManager = () => {
  const { groupSlug } = useParams();
  const { groups, setCurrentGroup } = useGroupContext();

  const navigate = useNavigate();

  useEffect(() => {
    if (groups.length) {
      const group = groups.find(group => group.urlSlug === groupSlug);
      if (group) {
        setCurrentGroup(group.id);
      } else {
        navigate('/');
      }
    }
  }, [groupSlug, groups, navigate]);

  return <Outlet />;
};

export default GroupManager;
