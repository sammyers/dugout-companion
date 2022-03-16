import { run } from 'graphile-worker';

import sendEmail from './tasks/sendEmail';
import sendNewAccountEmail from './tasks/sendNewAccountEmail';
import sendVerificationEmail from './tasks/sendVerificationEmail';

const main = async () => {
  const runner = await run({
    connectionString: process.env.DATABASE_URL,
    concurrency: 5,
    pollInterval: 1000,
    noHandleSignals: false,
    taskList: {
      sendEmail,
      sendVerificationEmail,
      sendNewAccountEmail,
    },
  });

  await runner.promise;
};

main().catch(error => {
  console.error(error);
  process.exit(1);
});
