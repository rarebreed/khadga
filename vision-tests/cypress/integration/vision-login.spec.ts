/// <reference types="cypress"/>

import { getSigninButton } from "../../src/locators";

// FIXME: We need a way to figure out what the hostname is for our test service.
const khadgaUrl = "https://stoner-test:7001";
const logger = console;


describe('Tests khadga login', () => {
  it('Visits khadga.app', () => {
    cy.visit(khadgaUrl);

    // We will log in through Google API, rather than clicking
    
  });
})