require('dotenv').config({ path: `${__dirname}/../../.env` });

const setUrlAsEnvVar = (urlVar, userVar, passwordVar, shadow = false) => {
  process.env[urlVar] =
    process.env[urlVar] ||
    `postgres://${process.env[userVar]}:${process.env[passwordVar]}@${process.env.DATABASE_HOST}/${
      process.env.DATABASE_NAME
    }${shadow ? '_shadow' : ''}`;
};

setUrlAsEnvVar('DATABASE_URL', 'DATABASE_OWNER', 'DATABASE_OWNER_PASSWORD');
setUrlAsEnvVar('AUTH_DATABASE_URL', 'DATABASE_AUTHENTICATOR', 'DATABASE_AUTHENTICATOR_PASSWORD');
setUrlAsEnvVar('SHADOW_DATABASE_URL', 'DATABASE_OWNER', 'DATABASE_OWNER_PASSWORD', true);
setUrlAsEnvVar(
  'SHADOW_AUTH_DATABASE_URL',
  'DATABASE_AUTHENTICATOR',
  'DATABASE_AUTHENTICATOR_PASSWORD',
  true
);
