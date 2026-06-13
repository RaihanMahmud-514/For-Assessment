// ***********************************************
// Custom commands for evo.dev.theysaid.io e2e suite
// ***********************************************

const AUTHKIT_ORIGIN = 'https://mystical-turtle-68-staging.authkit.app';

const APP_SELECTORS = {
  addProjectBtn: 'button:contains("Add project")',
  // The "Ask AI" chat sidebar persists in the DOM (often collapsed,
  // data-state="closed", w-0, overflow-hidden) and can contain stale
  // chat history with text like "AI Surveys", "AI User Tests", etc.
  // Always exclude it when searching for Create modal content.
  notInChatSidebar: ':not([data-test="chat-sidebar"] *)',
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
 *
 * NOTE: The app's "Ask AI" chat sidebar ([data-test="chat-sidebar"])
 * persists in the DOM even when collapsed and can contain stale chat
 * history listing items like "AI Surveys", "AI User Tests", etc.
 * All subsequent commands must exclude elements inside that sidebar
 * using the ':not([data-test="chat-sidebar"] *)' pattern, otherwise
 * cy.contains() can match the hidden sidebar content instead of the
 * actual Create modal, causing "0 x 900 / overflow:hidden" failures.
 */
Cypress.Commands.add('openCreateProjectModal', () => {
  cy.visit('/projects');
  cy.contains('AI Projects', { timeout: 20000 }).should('be.visible');
  cy.contains('button', 'Add project', { timeout: 15000 }).click();

  // Give the dialog time to mount
  cy.wait(1000);

  // Confirm the real "Create" heading (outside the chat sidebar) is present
  cy.get(`*${APP_SELECTORS.notInChatSidebar}`, { timeout: 15000 })
    .contains(/^Create$/)
    .should('exist');
});

/**
 * Creates a new AI Survey project, skips the AI draft-goal modal,
 * and returns to the questions builder.
 */
Cypress.Commands.add('createAiSurveyProject', () => {
  cy.openCreateProjectModal();

  cy.get(`li${APP_SELECTORS.notInChatSidebar}`, { timeout: 15000 })
    .contains(/^AI Survey$/i)
    .should('be.visible')
    .click({ force: true });

  cy.get(`button${APP_SELECTORS.notInChatSidebar}`, { timeout: 15000 })
    .contains(/Create AI Survey/i)
    .should('be.visible')
    .click({ force: true });

  cy.url({ timeout: 20000 }).should('include', 'project-type=Form');

  cy.get('body').then(($body) => {
    if ($body.find('button:contains("Skip")').length > 0) {
      cy.contains('button', 'Skip').click({ force: true });
    }
  });

  cy.contains('Questions', { timeout: 20000 }).should('be.visible');
});

/**
 * Creates a new AI User Test project end-to-end:
 * Create modal -> AI User Test -> Draft project (with goal) ->
 * wait for AI generation -> Publish -> copy link -> close modal ->
 * back to AI Projects list.
 * Stores the published survey URL via the 'publishedSurveyUrl' alias.
 */
Cypress.Commands.add('createAiUserTestProject', (learningGoal) => {
  const goal =
    learningGoal ||
    'Understand how users search for and navigate to creative tools on the website.';

  cy.openCreateProjectModal();

  cy.get(`li${APP_SELECTORS.notInChatSidebar}`, { timeout: 15000 })
    .contains(/^AI User Test$/i)
    .should('be.visible')
    .click({ force: true });

  cy.get(`button${APP_SELECTORS.notInChatSidebar}`, { timeout: 15000 })
    .contains(/Create AI User Test/i)
    .should('be.visible')
    .click({ force: true });

  cy.contains('Draft project', { timeout: 20000 }).should('exist');

  cy.get(
    'textarea[placeholder*="learning goal" i], textarea[placeholder*="purpose" i], textarea',
    { timeout: 15000 }
  )
    .first()
    .should('exist')
    .clear({ force: true })
    .type(goal, { delay: 10, force: true });

  cy.contains('button', /^Draft project$/i, { timeout: 15000 })
    .should('exist')
    .click({ force: true });

  cy.contains('Generating Survey Questions', { timeout: 30000 }).should('exist');
  cy.contains('Quality Assurance & Optimization', { timeout: 60000 }).should('exist');

  cy.contains('Draft project', { timeout: 60000 }).should('not.exist');
  cy.contains('Build', { timeout: 30000 }).should('be.visible');
  cy.contains('Questions', { timeout: 20000 }).should('be.visible');

  cy.contains('button', 'Publish', { timeout: 15000 })
    .should('be.visible')
    .click({ force: true });

  cy.contains('Your project has been published', { timeout: 30000 }).should('be.visible');

  cy.get('input', { timeout: 15000 })
    .filter((i, el) => /survey\/project/.test(el.value || ''))
    .first()
    .invoke('val')
    .then((url) => {
      cy.wrap(url).as('publishedSurveyUrl');
    });

  cy.contains('button', /copy link/i, { timeout: 10000 })
    .should('be.visible')
    .click({ force: true });

  cy.contains('h2, h3, [role="heading"]', /your project has been published/i, { timeout: 10000 })
    .parents('[role="dialog"], .fixed, div')
    .first()
    .within(() => {
      cy.get('button').first().click({ force: true });
    });

  cy.contains('AI Projects', { timeout: 15000 })
    .should('be.visible')
    .click({ force: true });

  cy.url({ timeout: 20000 }).should('include', '/projects');
  cy.contains('AI Projects', { timeout: 20000 }).should('be.visible');
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