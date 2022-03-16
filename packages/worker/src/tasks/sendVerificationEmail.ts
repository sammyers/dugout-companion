import { Task } from 'graphile-worker';

import { addSendEmailJob } from './sendEmail';

interface SendVerificationEmailPayload {
  email: string;
}

const sendVerificationEmail: Task = async (payload, { addJob, withPgClient }) => {
  const { email } = payload as SendVerificationEmailPayload;

  const {
    rows: [emailVerification],
  } = await withPgClient(pgClient =>
    pgClient.query(
      `
      select player_id, verification_code
      from dc_private.player_email_verification
      where email = $1 and verified is false
    `,
      [email]
    )
  );

  if (!emailVerification) {
    console.warn(`sendVerification email task ignored for non-existent email ${email}`);
    return;
  }

  const { verification_code } = emailVerification;

  await addSendEmailJob(addJob, {
    to: email,
    subject: 'Email Verification',
    body: `Your verification code is ${verification_code}`,
  });
  await withPgClient(pgClient =>
    pgClient.query(
      'update dc_private.player_email_verification set time_verification_email_sent = now() where email = $1',
      [email]
    )
  );
};

export default sendVerificationEmail;
