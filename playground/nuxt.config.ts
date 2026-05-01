export default defineNuxtConfig({
  modules: ['nuxt-oxlint'],
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
})
