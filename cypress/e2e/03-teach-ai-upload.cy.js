/// <reference types="cypress" />

describe('EVO - Teach AI Document Upload Flow', () => {
  beforeEach(() => {
    cy.login();
  });

  it('navigates to Teach AI and shows existing data sources', () => {
    cy.visit('/home/teach-ai');

    cy.contains('Teach AI').should('be.visible');
    cy.contains('Data sources').should('be.visible');
    cy.contains('Company Summary').should('be.visible');
    cy.contains('button', 'Add link').should('be.visible');
    cy.contains('button', 'Add file').should('be.visible');
  });

  it('uploads a document and confirms it is added to data sources', () => {
    cy.uploadTeachAiDocument('dummy_txt_file.txt');

    // Document summary section should reflect the new file
    cy.contains('Document summary', { timeout: 30000 }).should('be.visible');
    cy.contains('dummy_txt_file.txt', { timeout: 30000 }).should('be.visible');
  });

  it('shows Cancel button dismisses the upload panel without confirming', () => {
    cy.visit('/home/teach-ai');
    cy.contains('button', 'Add file').click();

    cy.contains('Click to upload').should('be.visible');
    cy.contains('button', 'Cancel').click();

    cy.contains('Click to upload').should('not.exist');
  });
});