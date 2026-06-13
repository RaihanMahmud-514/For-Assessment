# EVO E2E Test Suite (Cypress)

End-to-end tests for `https://evo.dev.theysaid.io/` covering four flows:

1. **Login** (`01-login.cy.js`)
2. **Create a project** (`02-create-project.cy.js`)
3. **Upload a document in Teach AI** (`03-teach-ai-upload.cy.js`)
4. **Publish a project + take its survey** (`04-publish-and-survey.cy.js`)

Registration/OTP flow is intentionally **not** covered (requires manual email OTP entry).

## Setup

```bash
npm install
```

Provide credentials for a pre-verified test account (do **not** commit these):

```bash
export EVO_EMAIL="your-test-account@example.com"
export EVO_PASSWORD="your-test-account-password"
```

Or create `cypress.env.json` (gitignored):

```json
{
  "EVO_EMAIL": "your-test-account@example.com",
  "EVO_PASSWORD": "your-test-account-password"
}
```

## Running tests

Interactive (debug selectors, record codegen):

```bash
npm run cy:open
```

Headless run with Mochawesome JSON output:

```bash
npm test
```

Full run + merged HTML report:

```bash
npm run test:report
```

This generates `cypress/reports/evo-e2e-report.html` — an interactive
dashboard with pass/fail counts, durations, screenshots on failure, and
per-spec drill-down.

## Running flows in parallel (4 threads)

Each spec is independent and can run concurrently:

```bash
npx cypress run --spec "cypress/e2e/01-login.cy.js" &
npx cypress run --spec "cypress/e2e/02-create-project.cy.js" &
npx cypress run --spec "cypress/e2e/03-teach-ai-upload.cy.js" &
npx cypress run --spec "cypress/e2e/04-publish-and-survey.cy.js" &
wait
```

The included GitHub Actions workflow (`.github/workflows/e2e.yml`) runs the
four specs as a parallel matrix and merges results into one HTML report
artifact (`evo-e2e-html-report`).

## Selector maintenance

Selectors are written defensively (text/role/placeholder-based fallbacks)
since the live DOM wasn't fully inspected. If a test fails on a selector:

1. Run `npx cypress open`, navigate manually to the failing step.
2. Use Cypress's **Selector Playground** or `npx cypress run --record` /
   `cypress-codegen` style recording to grab the real attribute.
3. Update `cypress/support/commands.js` → `SELECTORS` map and the relevant
   spec — selectors are centralized there for one-place fixes.

## Notes on the "Publish + Survey" flow

- `publishCurrentProject()` clicks **Publish**, waits for the
  "Your project has been published!" modal, and extracts the public
  `/survey/project/<uuid>` URL from the copy-link input.
- `takePublishedSurvey(url)` visits that URL in a cleared-cookie context
  (simulating an anonymous respondent) and answers each question generically
  — rating questions get a default click on "4", open/chat questions get a
  typed response — looping until the **"the survey is complete"** message
  appears.
- Because AI Survey/Interview question sets can be dynamically generated,
  the loop is intentionally generic (max 15 steps) rather than hardcoded to
  specific question text.

## CI Secrets

Add these repo secrets for GitHub Actions:

- `EVO_EMAIL`
- `EVO_PASSWORD`
"# For-Assessment" 
"# For-Assessment" 
