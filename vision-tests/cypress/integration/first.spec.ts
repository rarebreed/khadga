/// <reference types="cypress"/>

describe('google search', () => {
  it('should work', () => {
    cy.visit('http://www.google.com');
    cy.get('input.gLFyf.gsfi')
      .first()
      .type('Hello world{enter}')
  });
});

describe('My First Test', function() {
  it('Does not do much!', function() {
    expect(true).to.equal(true)
  })
})