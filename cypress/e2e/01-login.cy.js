/// <reference types="cypress" />

describe('EVO - Login Flow', () => {
  it('logs in with valid credentials and lands on AI Projects page', () => {
    cy.login();

    cy.contains('AI Projects', { timeout: 20000 }).should('be.visible');
    cy.contains('button', 'Add project').should('be.visible');
    cy.url().should('include', '/projects');
  });

  it('shows an error for invalid credentials', () => {
    cy.visit('/login');

    cy.get('input[type="email"], input[name="email"]', { timeout: 15000 })
      .should('be.visible')
      .type('invalid-user@example.com');

    cy.get('input[type="password"], input[name="password"]')
      .should('be.visible')
      .type('WrongPassword123!');

    cy.get('button[type="submit"]').click();

    // App should remain on login page and surface an error
    cy.url().should('include', '/login');
    cy.contains(/invalid|incorrect|error/i, { timeout: 15000 }).should('be.visible');
  });
});
