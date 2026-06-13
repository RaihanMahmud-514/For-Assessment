/// <reference types="cypress" />

/**
 * Asserts a truly visible element (non-zero bounding rect) containing
 * the given text exists. Correctly handles overflow:hidden + zero-width
 * ancestors (like the collapsed "Ask AI" chat sidebar) that jQuery's
 * :visible check misses.
 */
function assertVisibleByText(text, timeout = 15000) {
  cy.get('body', { timeout }).should(($body) => {
    const all = $body[0].querySelectorAll('*');
    const visible = Array.from(all).filter((el) => {
      if (!el.textContent.includes(text)) return false;
      const hasMatchingChild = Array.from(el.children).some(
        (child) => child.textContent.includes(text)
      );
      if (hasMatchingChild) return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    expect(visible.length, `visible element with text "${text}"`).to.be.greaterThan(0);
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