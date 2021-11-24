#!/usr/bin/env node
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname } from "path";

const isDev = process.env.NODE_ENV === "development";

const loadVars = async () => {
  const vars = [];
  const setEnvVar = (name, value) => {
    vars.push([name, value]);
  };

  if (isDev) {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const result = dotenv.config({ path: `${__dirname}/../../.env` });
    vars.push(...Object.entries(result.parsed));

    const setUrlAsEnvVar = (urlVar, userVar, passwordVar, shadow = false) => {
      if (!process.env[urlVar]) {
        setEnvVar(
          urlVar,
          `postgres://${process.env[userVar]}:${process.env[passwordVar]}@${
            process.env.DATABASE_HOST
          }/${process.env.DATABASE_NAME}${shadow ? "_shadow" : ""}`
        );
      }
    };

    setUrlAsEnvVar("DATABASE_URL", "DATABASE_OWNER", "DATABASE_OWNER_PASSWORD");
    setUrlAsEnvVar(
      "AUTH_DATABASE_URL",
      "DATABASE_AUTHENTICATOR",
      "DATABASE_AUTHENTICATOR_PASSWORD"
    );
    setUrlAsEnvVar(
      "SHADOW_DATABASE_URL",
      "DATABASE_OWNER",
      "DATABASE_OWNER_PASSWORD",
      true
    );
    setUrlAsEnvVar(
      "SHADOW_AUTH_DATABASE_URL",
      "DATABASE_AUTHENTICATOR",
      "DATABASE_AUTHENTICATOR_PASSWORD",
      true
    );
  } else {
    throw new Error("Prod env not implemented.");
    // const makeConnectionString = (user, password, args) => {
    //   const connectionString = `postgres://${user}:${password}@172.17.0.1:5432/${DB_NAME}`;
    //   if (args) {
    //     return `${connectionString}?${qs.stringify(args)}`;
    //   }
    //   return connectionString;
    // };

    // const authenticator = await getSecret("DATABASE_AUTHENTICATOR");
    // const authenticatorPassword = await getSecret(
    //   "DATABASE_AUTHENTICATOR_PASSWORD"
    // );
    // const owner = await getSecret("DATABASE_OWNER");
    // const ownerPassword = await getSecret("DATABASE_OWNER_PASSWORD");
    // const visitor = await getSecret("DATABASE_VISITOR");

    // setEnvVar("DATABASE_OWNER", owner);
    // setEnvVar("DATABASE_VISITOR", visitor);
    // setEnvVar("DATABASE_AUTHENTICATOR", authenticator);

    // if (prodMigrate) {
    //   const ip = await getSecret("CLOUD_SQL_IP");
    //   const rootPassword = await getSecret("DATABASE_ROOT_PASSWORD");
    //   setEnvVar(
    //     "DATABASE_URL",
    //     `postgres://postgres:${rootPassword}@${ip}/${DB_NAME}?sslmode=disable`
    //   );
    // } else {
    //   setEnvVar("DATABASE_URL", makeConnectionString(owner, ownerPassword));
    //   setEnvVar(
    //     "AUTH_DATABASE_URL",
    //     makeConnectionString(authenticator, authenticatorPassword)
    //   );
    // }
  }
  return vars;
};

const vars = await loadVars();
process.stdout.write(vars.map((keyval) => keyval.join("=")).join(" "));
