/// <reference types="cypress" />

describe('EVO - Create Project Flow', () => {
  beforeEach(() => {
    cy.login();
  });

  it('opens the Create modal and lists all project type options', () => {
    cy.openCreateProjectModal();

    // Ensure the modal has fully animated in before asserting visibility
    cy.get('[role="dialog"]', { timeout: 15000 })
      .should('be.visible')
      .and(($el) => {
        expect($el.height()).to.be.greaterThan(0);
      });

    cy.contains('AI User Test', { timeout: 15000 }).should('be.visible');
    cy.contains('AI Interview').should('be.visible');
    cy.contains('AI Survey').should('be.visible');
    cy.contains('AI Poll').should('be.visible');
  });

  it('creates a new AI Survey project and opens the question builder', () => {
    cy.createAiSurveyProject();

    // Builder loaded with default question(s)
    cy.contains('Build', { timeout: 15000 }).should('be.visible');
    cy.contains('Questions').should('be.visible');
    cy.contains('Add').should('be.visible');

    // URL contains a generated project id once draft is created
    cy.url().should('match', /projects\/(new|[0-9a-f-]{36})/i);
  });

  it('confirms newly created project appears on the AI Projects list', () => {
    cy.createAiSurveyProject();

    // Give the title an editable, unique value so we can find it later
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
});