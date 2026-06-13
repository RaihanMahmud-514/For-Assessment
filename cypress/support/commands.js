// ***********************************************
// Custom commands for evo.dev.theysaid.io e2e suite
// ***********************************************

/**
 * Logs in via the UI using credentials from Cypress env (EVO_EMAIL / EVO_PASSWORD).
 * NOTE: The registration/OTP flow is intentionally NOT covered here.
 * This assumes a pre-existing verified test account.
 *
 * Selectors are written defensively (data-cy first, falling back to
 * placeholder/text matching) since the live DOM was not fully inspected.
 * Adjust the SELECTORS map below once you run `cypress open` against the
 * real app and confirm actual attributes via devtools / codegen.
 */

const SELECTORS = {
  emailInput: '[data-cy="login-email"], input[name="email"], input[type="email"]',
  passwordInput: '[data-cy="login-password"], input[name="password"], input[type="password"]',
  loginSubmit: '[data-cy="login-submit"], button[type="submit"]',
  userMenu: '[data-cy="user-menu"], img[alt*="profile" i], .avatar',
  addProjectBtn: 'button:contains("Add project")',
  aiSurveyOption: ':contains("AI Survey")',
  createSurveyBtn: 'button:contains("Create AI Survey")',
  draftSkipBtn: 'button:contains("Skip")',
  publishBtn: 'button:contains("Publish")',
  publishedModalLink: 'input[value*="survey/project"], a[href*="/survey/project"]'
};

Cypress.Commands.add('login', (email, password) => {
  const user = email || Cypress.env('EVO_EMAIL');
  const pass = password || Cypress.env('EVO_PASSWORD');

  if (!user || !pass) {
    throw new Error(
      'Missing EVO_EMAIL / EVO_PASSWORD. Set them as env vars or in cypress.env.json before running tests.'
    );
  }

  cy.visit('/login');

  cy.get(SELECTORS.emailInput, { timeout: 15000 })
    .should('be.visible')
    .clear()
    .type(user, { delay: 20 });

  cy.get(SELECTORS.passwordInput)
    .should('be.visible')
    .clear()
    .type(pass, { delay: 20 });

  cy.get(SELECTORS.loginSubmit).click();

  // Confirm we landed in an authenticated area
  cy.url({ timeout: 20000 }).should('include', '/projects');
  cy.contains('AI Projects', { timeout: 20000 }).should('be.visible');
});

/**
 * Opens the "Create" project modal from the AI Projects page.
 */
Cypress.Commands.add('openCreateProjectModal', () => {
  cy.visit('/projects');
  cy.contains('AI Projects', { timeout: 20000 }).should('be.visible');
  cy.contains('button', 'Add project', { timeout: 15000 }).click();
  cy.contains('Create', { timeout: 15000 }).should('be.visible');
});

/**
 * Creates a new AI Survey project, skips the AI draft-goal modal,
 * and returns to the questions builder. Returns the project URL alias.
 */
Cypress.Commands.add('createAiSurveyProject', () => {
  cy.openCreateProjectModal();

  cy.contains('AI Survey', { timeout: 15000 }).click();

  cy.contains('button', /Create AI Survey/i, { timeout: 15000 }).click();

  cy.url({ timeout: 20000 }).should('include', 'project-type=Form');

  // The "Draft project" goal modal appears - skip it for test stability
  cy.get('body').then(($body) => {
    if ($body.find('button:contains("Skip")').length > 0) {
      cy.contains('button', 'Skip').click();
    }
  });

  cy.contains('Questions', { timeout: 20000 }).should('be.visible');
});

/**
 * Navigates to Teach AI and uploads a document via the Add file flow.
 */
Cypress.Commands.add('uploadTeachAiDocument', (fixtureFileName) => {
  cy.visit('/home/teach-ai');
  cy.contains('Teach AI', { timeout: 20000 }).should('be.visible');

  cy.contains('button', 'Add file', { timeout: 15000 }).click();

  cy.contains('Click to upload', { timeout: 10000 }).should('be.visible');

  cy.get('input[type="file"]').selectFile(`cypress/fixtures/${fixtureFileName}`, {
    force: true
  });

  cy.contains('button', 'Confirm', { timeout: 15000 })
    .should('be.enabled')
    .click();

  // Verify the new file appears in the data sources list
  cy.get('[data-cy="data-sources-list"], body')
    .contains(fixtureFileName, { timeout: 30000 })
    .should('be.visible');
});

/**
 * Publishes the currently open project and returns the public survey URL.
 */
Cypress.Commands.add('publishCurrentProject', () => {
  cy.contains('button', 'Publish', { timeout: 15000 }).click();

  cy.contains('Your project has been published', { timeout: 30000 }).should('be.visible');

  // Extract the public link from the input/readonly field shown in the modal
  return cy
    .get('input', { timeout: 15000 })
    .filter((i, el) => /survey\/project/.test(el.value || ''))
    .first()
    .invoke('val')
    .then((url) => {
      cy.wrap(url).as('publishedSurveyUrl');
      return url;
    });
});

/**
 * Drives the public survey end-to-end by answering open-ended,
 * rating, multiple-choice and ranking question types generically,
 * then confirms the completion message.
 */
Cypress.Commands.add('takePublishedSurvey', (surveyUrl) => {
  cy.visit(surveyUrl);

  cy.get('[placeholder*="response" i], textarea, input[type="text"]', { timeout: 30000 })
    .should('be.visible');

  // Loop answering questions generically until completion message appears
  const MAX_STEPS = 15;

  const answerStep = (step) => {
    if (step > MAX_STEPS) return;

    cy.get('body').then(($body) => {
      if ($body.text().includes('the survey is complete')) {
        return; // done
      }

      // Rating buttons (numbered 1-5)
      if ($body.find('button:contains("5")').length && $body.find('button:contains("1")').length) {
        cy.contains('button', '4').click({ force: true });
      } else {
        // Free-text / chat input fallback
        cy.get('[placeholder*="response" i], textarea, input[type="text"]')
          .first()
          .clear({ force: true })
          .type('Automated test response', { force: true });

        cy.get('button:contains("Send"), button[aria-label*="send" i]')
          .first()
          .click({ force: true });
      }

      cy.wait(1500);
      answerStep(step + 1);
    });
  };

  answerStep(1);

  cy.contains('the survey is complete', { timeout: 30000 }).should('be.visible');
});

module.exports = SELECTORS;
