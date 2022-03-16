import React, { createContext, FC, useCallback, useContext, useEffect, useMemo } from 'react';
import { useApolloClient } from '@apollo/client';
import { ThemeContext, ThemeType } from 'grommet';
import _ from 'lodash';
import { useCookies } from 'react-cookie';

import {
  useLoginMutation,
  useGetCurrentUserQuery,
  useGetPermissionsQuery,
  LoginMutation,
  GetCurrentUserQuery,
  GroupPermissionType,
  PermissionType,
} from './gql';

export const useColor = (color: string) => {
  const theme = useContext(ThemeContext) as ThemeType;
  if (color.startsWith('#')) {
    return color;
  }

  return theme.global?.colors?.[color] as string;
};

export const AUTH_TOKEN_NAME = 'dcAuthToken';

export const useAuthToken = () => {
  const [{ [AUTH_TOKEN_NAME]: authToken }, setCookie, removeCookie] = useCookies([AUTH_TOKEN_NAME]);

  const setAuthToken = useCallback(
    (authToken: string) => setCookie(AUTH_TOKEN_NAME, authToken),
    []
  );

  const deleteAuthToken = useCallback(() => removeCookie(AUTH_TOKEN_NAME), []);

  return [authToken as string | undefined, setAuthToken, deleteAuthToken] as const;
};

export interface CurrentUserContext {
  currentUser: GetCurrentUserQuery['user'] | null;
  refetchCurrentUser: () => void;
}

const currentUserContext = createContext<CurrentUserContext>({
  currentUser: null,
  refetchCurrentUser: () => {},
});

export const CurrentUserProvider: FC = ({ children }) => {
  const { data, refetch: refetchCurrentUser } = useGetCurrentUserQuery();
  const [authToken] = useAuthToken();

  return (
    <currentUserContext.Provider
      value={{ currentUser: authToken && data?.user ? data.user : null, refetchCurrentUser }}
    >
      {children}
    </currentUserContext.Provider>
  );
};

export const useCurrentUser = () => useContext(currentUserContext);

export const useLogin = (onCompleted?: (result: LoginMutation) => void) => {
  const [_, setAuthToken, removeAuthToken] = useAuthToken();
  const { refetchCurrentUser } = useCurrentUser();

  const [mutation, mutationResult] = useLoginMutation({
    onCompleted: data => {
      if (data.login?.jwt) {
        setAuthToken(data.login.jwt);
        refetchCurrentUser();
      }
      onCompleted?.(data);
    },
    fetchPolicy: 'network-only',
    errorPolicy: 'all',
  });

  const login = useCallback(
    (credentials: { email: string; password: string }) => {
      removeAuthToken();
      return mutation({ variables: credentials });
    },
    [removeAuthToken, mutation]
  );

  return [login, mutationResult] as const;
};

export const useLogout = () => {
  const [, , removeAuthToken] = useAuthToken();
  const apolloClient = useApolloClient();

  const logout = useCallback(async () => {
    console.log('logging out');
    await apolloClient.clearStore();
    removeAuthToken();
  }, [apolloClient, removeAuthToken]);

  return logout;
};

export const useAllPermissions = () => {
  const { currentUser } = useCurrentUser();
  const { data, refetch } = useGetPermissionsQuery();

  useEffect(() => {
    refetch();
  }, [currentUser, refetch]);

  const allPermissions = useMemo(() => {
    if (data) {
      const { currentUserPermissions, currentUserGroupPermissions } = data;
      const groupPermissions = _.reduce(
        currentUserGroupPermissions,
        (all, groupPermission) => {
          const { groupId, permission } = groupPermission!;
          if (groupId! in all) {
            all[groupId!].push(permission!);
          } else {
            all[groupId!] = [permission!];
          }
          return all;
        },
        {} as Record<string, GroupPermissionType[]>
      );
      return { permissions: currentUserPermissions as PermissionType[], groupPermissions };
    }
    return { permissions: [], groupPermissions: {} };
  }, [data]);

  return allPermissions;
};

export const usePermission: {
  (permission: PermissionType): boolean;
  (permission: GroupPermissionType, groupId: string): boolean;
} = (permission: PermissionType | GroupPermissionType, groupId?: string) => {
  const { permissions, groupPermissions } = useAllPermissions();

  if (groupId) {
    return (groupPermissions[groupId] ?? []).includes(permission as GroupPermissionType);
  }
  return permissions.includes(permission as PermissionType);
};
