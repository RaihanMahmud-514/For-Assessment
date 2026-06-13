/// <reference types="cypress" />

describe('EVO - Create Project Flow', () => {
  beforeEach(() => {
    cy.login();
  });

  it('opens the Create modal and lists all project type options', () => {
    cy.openCreateProjectModal();

    ['AI User Test', 'AI Interview', 'AI Survey', 'AI Poll'].forEach((label) => {
      cy.contains(label, { timeout: 15000 })
        .should('exist')
        .scrollIntoView()
        .should('be.visible');
    });
  });

  it('creates a new AI Survey project and opens the question builder', () => {
    cy.createAiSurveyProject();

    cy.contains('Build').should('be.visible');
    cy.contains('Questions').should('be.visible');
    cy.contains('Add').should('be.visible');

    cy.url().should('match', /projects\/(new|[0-9a-f-]{36})/i);
  });

  it('confirms newly created project appears on the AI Projects list', () => {
    cy.createAiSurveyProject();

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

  it('creates, drafts, and publishes a new AI User Test project end-to-end', () => {
    cy.createAiUserTestProject();

    cy.url({ timeout: 20000 }).should('match', /project-type=/i);
    cy.contains(/Questions|Tasks|Build/i, { timeout: 20000 }).should('be.visible');

    cy.publishCurrentProject().then((url) => {
      expect(url).to.be.a('string').and.not.be.empty;
    });
  });
});