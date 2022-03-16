export interface ResetPasswordArgs {
  playerId: string;
  token: string;
}

export const encodeResetPasswordArgs = ({ playerId, token }: ResetPasswordArgs) =>
  btoa(`${playerId} ${token}`);
export const decodeResetPasswordArgs = (base64Str: string) => {
  const [playerId, token] = atob(base64Str).split(' ');
  if (!playerId || !token) {
    return undefined;
  }
  return { playerId, token } as ResetPasswordArgs;
};
