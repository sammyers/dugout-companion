import { AddJobFunction, Task } from 'graphile-worker';
import { google } from 'googleapis';
import nodemailer from 'nodemailer';

const { OAuth2 } = google.auth;

const createTransporter = async () => {
  const oauth2Client = new OAuth2(
    process.env.EMAIL_CLIENT_ID,
    process.env.EMAIL_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.EMAIL_REFRESH_TOKEN,
  });

  const accessToken = await new Promise((resolve, reject) => {
    oauth2Client.getAccessToken((err, token) => {
      if (err) {
        reject();
      }
      resolve(token);
    });
  });

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      type: 'OAuth2',
      user: process.env.EMAIL_ADDRESS,
      accessToken,
      clientId: process.env.EMAIL_CLIENT_ID,
      clientSecret: process.env.EMAIL_CLIENT_SECRET,
      refreshToken: process.env.EMAIL_REFRESH_TOKEN,
    },
  } as any);

  return transporter;
};

export interface SendEmailPayload {
  to: string;
  subject: string;
  body: string;
}

const sendEmail: Task = async (payload, { logger }) => {
  const { to, subject, body } = payload as SendEmailPayload;

  const transporter = await createTransporter();
  const info = await transporter.sendMail({
    from: {
      name: 'Dugout Companion',
      address: process.env.EMAIL_ADDRESS!,
    },
    to,
    subject,
    text: body,
  });

  logger.info(info.response);
};

export const addSendEmailJob = async (addJob: AddJobFunction, payload: SendEmailPayload) =>
  await addJob('sendEmail', payload);

export default sendEmail;
