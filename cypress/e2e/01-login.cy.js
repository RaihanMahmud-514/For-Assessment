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
      // --- Email step ---
      cy.get('input[type="email"], input[name="email"]', { timeout: 20000 })
        .should('be.visible')
        .type('invalid-user@example.com');

      cy.contains('button', /continue|next|sign in|log in/i, { timeout: 10000 }).click();

      // After submitting the email, AuthKit may either:
      //  (a) show an error immediately (unknown account), or
      //  (b) proceed to a password field.
      cy.get('body', { timeout: 20000 }).then(($body) => {
        const hasError = /invalid|incorrect|not found|no account|error|doesn't exist|does not exist/i.test(
          $body.text()
        );
        const hasPasswordField =
          $body.find('input[type="password"], input[name="password"]').length > 0;

        if (hasPasswordField) {
          cy.get('input[type="password"], input[name="password"]', { timeout: 20000 })
            .should('be.visible')
            .type('WrongPassword123!');

          cy.contains('button', /sign in|log in|continue/i).click();

          cy.contains(/invalid|incorrect|error|wrong/i, { timeout: 15000 }).should('be.visible');
        } else if (hasError) {
          cy.contains(/invalid|incorrect|not found|no account|error|doesn't exist|does not exist/i, {
            timeout: 15000
          }).should('be.visible');
        } else {
          throw new Error(
            'After submitting an invalid email, neither a password field nor an error message appeared.'
          );
        }
      });
    });
  });
});