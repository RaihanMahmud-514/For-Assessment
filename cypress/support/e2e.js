import './commands';

// Prevent uncaught app exceptions from failing tests
// (common with SPAs that throw harmless console errors on route changes)
Cypress.on('uncaught:exception', (err) => {
  if (
    err.message.includes('ResizeObserver') ||
    err.message.includes('Non-Error promise rejection')
  ) {
    return false;
  }
  return true;
});

// Mochawesome screenshot-on-fail hook
beforeEach(() => {
  cy.log(`Running: ${Cypress.currentTest.title}`);
});
