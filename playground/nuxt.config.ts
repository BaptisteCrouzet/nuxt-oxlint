export default defineNuxtConfig({
  modules: ['../src/module'],
  devtools: { enabled: true },
  compatibilityDate: 'latest',
  oxlint: {
    checker: {
      // Run oxlint when the dev server starts
      lintOnStart: true,
      // Fail silently during development (warn only)
      failOnError: false,
    },
  },
});
