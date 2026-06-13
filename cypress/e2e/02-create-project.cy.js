/// <reference types="cypress" />

function assertVisibleByText(text) {
  cy.get('body', { timeout: 15000 }).should(() => {
    const matches = Cypress.$(`*:contains("${text}")`).filter((i, el) => {
      const $el = Cypress.$(el);
      const hasMatchingChild = $el.children().toArray().some(
        (child) => Cypress.$(child).text().includes(text)
      );
      if (hasMatchingChild) return false;
      return $el.is(':visible') && $el.width() > 0 && $el.height() > 0;
    });
    expect(matches.length, `visible element containing "${text}"`).to.be.greaterThan(0);
  });
}

describe('EVO - Create Project Flow', () => {
  beforeEach(() => {
    cy.login();
  });

  it('opens the Create modal and lists all project type options', () => {
    cy.openCreateProjectModal();

    assertVisibleByText('AI User Test');
    assertVisibleByText('AI Interview');
    assertVisibleByText('AI Survey');
    assertVisibleByText('AI Poll');
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