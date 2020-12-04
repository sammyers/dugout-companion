module.exports = {
  client: {
    service: {
      name: "dugout-companion",
      localSchemaFile: "./packages/shared/schema.graphql",
    },
    includes: ["./packages/app/src/**/*.graphql"],
  },
};
