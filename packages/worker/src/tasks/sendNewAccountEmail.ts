import { Task } from 'graphile-worker';

import { encodeResetPasswordArgs } from '@sammyers/dc-utils';

import { addSendEmailJob } from './sendEmail';

interface SendNewAccountEmailPayload {
  id: string;
  email: string;
  token: string;
}

const baseUrl =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : 'https://stats.dugoutcompanion.app';

const sendNewAccountEmail: Task = async (payload, { addJob, withPgClient }) => {
  const { id: playerId, email, token } = payload as SendNewAccountEmailPayload;

  const setupAccountLink = `${baseUrl}/new-account?p=${encodeResetPasswordArgs({
    playerId,
    token,
  })}`;

  // TODO: make this message content more interesting
  await addSendEmailJob(addJob, {
    to: email,
    subject: 'New Account',
    body: `Follow this link to finish setting up your account: ${setupAccountLink}`,
  });
  await withPgClient(pgClient =>
    pgClient.query(
      'update dc_private.player_account set time_reset_password_email_sent = now() where player_id = $1;',
      [playerId]
    )
  );
};

export default sendNewAccountEmail;
