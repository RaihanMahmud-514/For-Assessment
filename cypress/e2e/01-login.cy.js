/// <reference types="cypress" />

describe('EVO - Login Flow', () => {
  it('logs in with valid credentials and lands on AI Projects page', () => {
    cy.login();

    cy.contains('AI Projects', { timeout: 20000 }).should('be.visible');
    cy.contains('button', 'Add project').should('be.visible');
    cy.url().should('include', '/projects');
  });

  it('shows an error for invalid credentials', () => {
    cy.visit('/');

    cy.origin('authkit.app', () => {
      cy.get('input[type="email"], input[name="email"]', { timeout: 20000 })
        .should('be.visible')
        .type('invalid-user@example.com');

      cy.get('body').then(($body) => {
        if ($body.find('input[type="password"], input[name="password"]').length === 0) {
          cy.contains('button', /continue/i).click();
        }
      });

      cy.get('input[type="password"], input[name="password"]', { timeout: 20000 })
        .should('be.visible')
        .type('WrongPassword123!');

      cy.contains('button', /sign in|log in|continue/i).click();

      cy.contains(/invalid|incorrect|error/i, { timeout: 15000 }).should('be.visible');
    });
  });
});