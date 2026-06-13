/// <reference types="cypress" />

const NOT_IN_CHAT_SIDEBAR = ':not([data-test="chat-sidebar"] *)';

describe('EVO - Create Project Flow', () => {
  beforeEach(() => {
    cy.login();
  });

  it('opens the Create modal and lists all project type options', () => {
    cy.openCreateProjectModal();

    cy.get(`li${NOT_IN_CHAT_SIDEBAR}`, { timeout: 15000 })
      .contains(/^AI User Test$/i)
      .should('be.visible');

    cy.get(`li${NOT_IN_CHAT_SIDEBAR}`, { timeout: 15000 })
      .contains(/^AI Interview$/i)
      .should('be.visible');

    cy.get(`li${NOT_IN_CHAT_SIDEBAR}`, { timeout: 15000 })
      .contains(/^AI Survey$/i)
      .should('be.visible');

    cy.get(`li${NOT_IN_CHAT_SIDEBAR}`, { timeout: 15000 })
      .contains(/^AI Poll$/i)
      .should('be.visible');
  });

  it('creates a new AI Survey project and opens the question builder', () => {
    cy.createAiSurveyProject();

    cy.contains('Build', { timeout: 15000 }).should('be.visible');
    cy.contains('Questions').should('be.visible');
    cy.contains('Add').should('be.visible');

    cy.url().should('match', /projects\/(new|[0-9a-f-]{36})/i);
  });

  it('confirms newly created project appears on the AI Projects list', () => {
    cy.createAiSurveyProject();

    cy.get('h1, [contenteditable="true"]', { timeout: 15000 })
      .first()
      .invoke('text')
      .then((title) => {
        cy.wrap(title.trim()).as('projectTitle');
      });

    cy.visit('/projects');
    cy.contains('AI Projects').should('be.visible');

    cy.get('@projectTitle').then((title) => {
      if (title) {
        cy.contains(title, { timeout: 20000 }).should('be.visible');
      }
    });
  });

  it('creates, drafts, and publishes a new AI User Test project end-to-end', () => {
    cy.createAiUserTestProject(
      'Understand how users search for and navigate to creative tools on the website.'
    );

    cy.get('@publishedSurveyUrl').should('match', /survey\/project\/[0-9a-f-]{36}/i);

    cy.url().should('include', '/projects');
    cy.contains('AI Projects', { timeout: 20000 }).should('be.visible');
  });
});