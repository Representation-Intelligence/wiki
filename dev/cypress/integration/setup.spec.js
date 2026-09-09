/// <reference types="Cypress" />

describe('Setup', () => {
  it('Load the setup page', () => {
    cy.visit('/')
    cy.contains('You are about to install Wiki.js').should('exist')
  })
  it('Enter administrator email address', () => {
    cy.get('.v-input').contains('Administrator Email').next('input').click().type('test@example.com')
  })
  it('Enter a password', () => {
    cy.get('.v-input').contains('Password').next('input').click().type('12345678')
    cy.get('.v-input').contains('Confirm Password').next('input').click().type('12345678')
  })
  it('Enter a Site URL', () => {
    cy.get('.v-input').contains('Site URL').next('input').click().clear().type('http://localhost:3000')
  })
  it('Disable Telemetry', () => {
    cy.contains('Telemetry').next('.v-input').click()
  })
  it('Press Install', () => {
    cy.get('.v-card__actions').find('button').click()
  })
  it('Wait for install success', () => {
    cy.contains('Installation complete!', {timeout: 30000}).should('exist')
  })
  // -> Disabled because of origin change errors during CI tests
  //
  // it('Redirect to login page', () => {
  //   cy.location('pathname', {timeout: 10000}).should('include', '/login')
  // })
})

// Exercise the customized UI after the upstream setup checks, on a disposable DB.
describe('ewo knowledge workspace', () => {
  it('supports login, reading, admin users and mobile/dark layouts', () => {
    cy.viewport(1280, 800)
    cy.visit('/login')
    cy.get('.ewo-login').should('be.visible')
    cy.get('.login-form input[type=email]').type('test@example.com')
    cy.get('.login-form input[type=password]').type('12345678', { log: false })
    cy.get('.login-form > button').click()
    cy.location('pathname', { timeout: 30000 }).should('not.eq', '/login')
    cy.request('POST', '/graphql', {
      query: `mutation { pages { create(content:"# Team knowledge\\n\\nA shared guide for the team.", description:"UI acceptance fixture", editor:"markdown", isPrivate:false, isPublished:true, locale:"en", path:"ewo-acceptance", tags:[], title:"Team knowledge") { responseResult { succeeded message } } } }`
    }).then(({ body }) => {
      expect(body.errors).to.be.undefined
      expect(body.data.pages.create.responseResult.succeeded).to.eq(true)
    })
    cy.visit('/en/ewo-acceptance')
    cy.get('.contents').should('contain', 'A shared guide for the team.')
    cy.get('.nav-header').should('be.visible')
    cy.screenshot('ewo-reading-desktop')
    cy.visit('/a/users')
    cy.contains('test@example.com').should('be.visible')
    cy.contains('button', 'New User').click()
    cy.get('.v-dialog').should('be.visible')
    cy.screenshot('ewo-user-management')
    cy.request('POST', '/graphql', {
      query: 'mutation { users { update(id:1, appearance:"dark") { responseResult { succeeded } } } }'
    }).then(({ body }) => {
      expect(body.errors).to.be.undefined
      expect(body.data.users.update.responseResult.succeeded).to.eq(true)
    })
    // Appearance is carried in the login session; refresh it after admin changes.
    cy.clearCookie('jwt')
    cy.visit('/login')
    cy.get('.login-form input[type=email]').type('test@example.com')
    cy.get('.login-form input[type=password]').type('12345678', { log: false })
    cy.get('.login-form > button').click()
    cy.location('pathname', { timeout: 30000 }).should('not.eq', '/login')
    cy.viewport(375, 812)
    cy.visit('/en/ewo-acceptance')
    cy.get('.v-application').should('have.class', 'theme--dark')
    cy.get('.contents').should('contain', 'A shared guide for the team.')
    cy.document().then(doc => {
      expect(doc.documentElement.scrollWidth).to.be.at.most(375)
    })
    cy.get('.nav-header .mdi-account-circle').closest('button').then($button => {
      const bounds = $button[0].getBoundingClientRect()
      expect(bounds.left).to.be.at.least(0)
      expect(bounds.right).to.be.at.most(375)
    })
    cy.screenshot('ewo-reading-mobile-dark')
  })
})
