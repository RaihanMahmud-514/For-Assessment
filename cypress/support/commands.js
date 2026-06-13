// ***********************************************
// Custom commands for evo.dev.theysaid.io e2e suite
// ***********************************************

/**
 * IMPORTANT - AuthKit cross-origin login:
 * evo.dev.theysaid.io redirects unauthenticated users to a WorkOS AuthKit
 * domain (https://mystical-turtle-68-staging.authkit.app/...) to log in.
 * Cypress treats this as a different origin, so all interactions on that
 * page MUST happen inside cy.origin() with the EXACT origin (including
 * subdomain). After successful login, AuthKit redirects back to
 * evo.dev.theysaid.io.
 *
 * Confirmed real flow (two steps):
 *   Step 1: Email field + "Continue" button (also shows OAuth options)
 *   Step 2: Password field + "Sign in" button
 *
 * NOTE: If this AuthKit subdomain ('mystical-turtle-68-staging') ever
 * changes/rotates, update AUTHKIT_ORIGIN below.
 */

const AUTHKIT_ORIGIN = 'https://mystical-turtle-68-staging.authkit.app';

const APP_SELECTORS = {
  addProjectBtn: 'button:contains("Add project")',
};

Cypress.Commands.add('login', (email, password) => {
  const user = email || Cypress.env('EVO_EMAIL');
  const pass = password || Cypress.env('EVO_PASSWORD');

  if (!user || !pass) {
    throw new Error(
      'Missing EVO_EMAIL / EVO_PASSWORD. Set them as env vars or in cypress.env.json before running tests.'
    );
  }

  // Visit the app - it will redirect to the AuthKit domain
  cy.visit('/');

  // Interact with the AuthKit hosted login page (exact origin required)
  cy.origin(
    AUTHKIT_ORIGIN,
    { args: { user, pass } },
    ({ user, pass }) => {
      // --- Step 1: Email + Continue ---
      cy.contains('Sign in', { timeout: 20000 }).should('be.visible');

      cy.get('input[type="email"], input[name="email"]', { timeout: 20000 })
        .should('be.visible')
        .clear()
        .type(user, { delay: 20 });

      cy.get('button').contains(/continue/i, { timeout: 10000 }).click();

      // --- Step 2: Password + Sign in ---
      cy.get('input[type="password"], input[name="password"]', { timeout: 20000 })
        .should('be.visible')
        .clear()
        .type(pass, { delay: 20 });

      cy.get('button').contains(/sign in/i, { timeout: 10000 }).click();
    }
  );

  // Wait for AuthKit redirect back to evo.dev.theysaid.io to complete
  cy.url({ timeout: 30000 }).should('not.include', 'authkit.app');
  cy.url({ timeout: 30000 }).should('include', '/projects');
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
 * and returns to the questions builder.
 */
Cypress.Commands.add('createAiSurveyProject', () => {
  cy.openCreateProjectModal();

  cy.contains('AI Survey', { timeout: 15000 }).click();

  cy.contains('button', /Create AI Survey/i, { timeout: 15000 }).click();

  cy.url({ timeout: 20000 }).should('include', 'project-type=Form');

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
 * Drives the public survey end-to-end generically until completion.
 */
Cypress.Commands.add('takePublishedSurvey', (surveyUrl) => {
  cy.visit(surveyUrl);

  cy.get('[placeholder*="response" i], textarea, input[type="text"]', { timeout: 30000 })
    .should('be.visible');

  const MAX_STEPS = 15;

  const answerStep = (step) => {
    if (step > MAX_STEPS) return;

    cy.get('body').then(($body) => {
      if ($body.text().includes('the survey is complete')) {
        return;
      }

      if ($body.find('button:contains("5")').length && $body.find('button:contains("1")').length) {
        cy.contains('button', '4').click({ force: true });
      } else {
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

module.exports = { APP_SELECTORS, AUTHKIT_ORIGIN };