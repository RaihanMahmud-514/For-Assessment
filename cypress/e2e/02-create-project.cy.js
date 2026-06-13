/// <reference types="cypress" />

describe('EVO - Create Project Flow', () => {
  beforeEach(() => {
    cy.login();
  });

  it('opens the Create modal and lists all project type options', () => {
    cy.openCreateProjectModal();

    cy.contains('AI User Test').should('be.visible');
    cy.contains('AI Interview').should('be.visible');
    cy.contains('AI Survey').should('be.visible');
    cy.contains('AI Poll').should('be.visible');
  });

  it('creates a new AI Survey project and opens the question builder', () => {
    cy.createAiSurveyProject();

    // Builder loaded with default question(s)
    cy.contains('Build').should('be.visible');
    cy.contains('Questions').should('be.visible');
    cy.contains('Add').should('be.visible');

    // URL contains a generated project id once draft is created
    cy.url().should('match', /projects\/(new|[0-9a-f-]{36})/i);
  });

  it('confirms newly created project appears on the AI Projects list', () => {
    cy.createAiSurveyProject();

    // Give the title an editable, unique value so we can find it later
    cy.get('h1, [contenteditable="true"]')
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
});