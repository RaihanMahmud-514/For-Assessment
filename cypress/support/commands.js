// ***********************************************
// Custom commands for evo.dev.theysaid.io e2e suite
// ***********************************************

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

  cy.visit('/');

  cy.origin(
    AUTHKIT_ORIGIN,
    { args: { user, pass } },
    ({ user, pass }) => {
      cy.contains('Sign in', { timeout: 20000 }).should('be.visible');

      cy.get('input[type="email"], input[name="email"]', { timeout: 20000 })
        .should('be.visible')
        .clear()
        .type(user, { delay: 20 });

      cy.get('button').contains(/continue/i, { timeout: 10000 }).click();

      cy.get('input[type="password"], input[name="password"]', { timeout: 20000 })
        .should('be.visible')
        .clear()
        .type(pass, { delay: 20 });

      cy.get('button').contains(/sign in/i, { timeout: 10000 }).click();
    }
  );

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

  // The option list renders inside a carousel/slider whose container can
  // briefly have width:0 while it measures/animates in. Wait until it has
  // a real width before proceeding.
  cy.get('.relative.flex.h-full.flex-col.overflow-hidden', { timeout: 15000 })
    .should(($el) => {
      expect($el.outerWidth()).to.be.greaterThan(0);
    });

  // Small settle delay for the carousel's internal layout/animation
  cy.wait(500);
});

/**
 * Selects a project-type card by its visible title (e.g. "AI Survey",
 * "AI User Test", "AI Interview", "AI Poll") in the Create modal, then
 * clicks the resulting CTA button (e.g. "Create AI Survey").
 */
Cypress.Commands.add('createProject', (typeName) => {
  cy.openCreateProjectModal();

  cy.contains(typeName, { timeout: 15000 })
    .should('exist')
    .scrollIntoView()
    .should('be.visible')
    .closest('[role="button"], button, li, div')
    .click({ force: true });

  cy.contains('button', new RegExp(`Create ${typeName}`, 'i'), { timeout: 15000 })
    .should('be.visible')
    .click();

  cy.url({ timeout: 20000 }).should('match', /project-type=/i);

  cy.get('body').then(($body) => {
    if ($body.find('button:contains("Skip")').length > 0) {
      cy.contains('button', 'Skip').click();
    }
  });
});

/**
 * Creates a new AI Survey project, skips the AI draft-goal modal,
 * and returns to the questions builder.
 */
Cypress.Commands.add('createAiSurveyProject', () => {
  cy.createProject('AI Survey');

  cy.url({ timeout: 20000 }).should('include', 'project-type=Form');
  cy.contains('Questions', { timeout: 20000 }).should('be.visible');
});

/**
 * Creates a new AI User Test project, skips the AI draft-goal modal if shown.
 */
Cypress.Commands.add('createAiUserTestProject', () => {
  cy.createProject('AI User Test');

  cy.contains(/Questions|Tasks|Build/i, { timeout: 20000 }).should('be.visible');
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