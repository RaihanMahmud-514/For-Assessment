/// <reference types="cypress" />

describe('EVO - Publish Project & Take Survey Flow', () => {
  beforeEach(() => {
    cy.login();
  });

  it('creates, publishes a survey project, and shows the share modal with a link', () => {
    cy.createAiSurveyProject();

    cy.publishCurrentProject().then((url) => {
      expect(url).to.match(/https?:\/\/.*\/survey\/project\/[0-9a-f-]+/i);

      cy.get('body').then(($body) => {
        if ($body.find('button[aria-label="Close"], svg[data-icon="x"]').length) {
          cy.get('button[aria-label="Close"], svg[data-icon="x"]').first().click({ force: true });
        } else {
          cy.get('body').type('{esc}');
        }
      });
    });
  });

  it('end-to-end: publish a survey then complete it as a respondent', () => {
    cy.createAiSurveyProject();

    cy.publishCurrentProject().then((url) => {
      cy.clearCookies();
      cy.takePublishedSurvey(url);
    });
  });

  it('verifies the published survey shows a completion message', () => {
    cy.createAiSurveyProject();

    cy.publishCurrentProject().then((url) => {
      cy.clearCookies();
      cy.visit(url);

      cy.get('[placeholder*="response" i], textarea, input[type="text"]', { timeout: 30000 })
        .should('be.visible');

      cy.takePublishedSurvey(url);

      cy.contains('Thank you for your time, the survey is complete', { timeout: 30000 })
        .should('be.visible');
    });
  });
});