const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: "https://evo.dev.theysaid.io",
    viewportWidth: 1440,
    viewportHeight: 900,
    defaultCommandTimeout: 12000,
    pageLoadTimeout: 60000,
    requestTimeout: 15000,
    responseTimeout: 20000,
    video: true,
    videosFolder: "cypress/videos",
    screenshotsFolder: "cypress/screenshots",
    screenshotOnRunFailure: true,
    retries: {
      runMode: 1,
      openMode: 0
    },
    reporter: "mochawesome",
    reporterOptions: {
      reportDir: "cypress/reports/mocha",
      overwrite: false,
      html: false,
      json: true
    },
    setupNodeEvents(on, config) {
      // Allows reading env vars / fixtures dynamically
      return config;
    },
    specPattern: "cypress/e2e/**/*.cy.js",
    supportFile: "cypress/support/e2e.js"
  },
  env: {
    EVO_EMAIL: process.env.EVO_EMAIL || "",
    EVO_PASSWORD: process.env.EVO_PASSWORD || ""
  }
});
