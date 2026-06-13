/// <reference types="cypress" />

const AUTHKIT_ORIGIN = 'https://mystical-turtle-68-staging.authkit.app';

describe('EVO - Login Flow', () => {
  it('logs in with valid credentials and lands on AI Projects page', () => {
    cy.login();

    cy.contains('AI Projects', { timeout: 20000 }).should('be.visible');
    cy.contains('button', 'Add project').should('be.visible');
    cy.url().should('include', '/projects');
  });

  it('shows an error for invalid credentials', () => {
    cy.visit('/');

    cy.origin(AUTHKIT_ORIGIN, () => {
      // --- Step 1: Email + Continue ---
      cy.contains('Sign in', { timeout: 20000 }).should('be.visible');

      cy.get('input[type="email"], input[name="email"]', { timeout: 20000 })
        .should('be.visible')
        .clear()
        .type('raihan.mahmud514@gmail.com');

      cy.contains('button', /^continue$/i, { timeout: 10000 }).click();

      // --- Step 2: Password + Sign in ---
      cy.get('input[type="password"], input[name="password"]', { timeout: 20000 })
        .should('be.visible')
        .clear()
        .type('WrongPassword123!');

      cy.contains('button', /^sign in$/i, { timeout: 10000 }).click();

      cy.contains(/invalid email or password/i, { timeout: 20000 }).should('be.visible');

      cy.url().should('include', 'mystical-turtle-68-staging.authkit.app');
    });
  });
});