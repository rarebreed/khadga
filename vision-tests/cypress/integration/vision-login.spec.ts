/// <reference types="cypress"/>

let khadgaUrl = "https://khadga.app";
if (process.env["NODE_ENV"] === "test") {
  khadgaUrl = "https://stoner-test:7001";
}

describe('Tests khadga login', () => {
  before("Start up dev servers", () => {
    // Start up dev servers.  We can use docker stack for this
  });

  it('Does not do much!', function() {
    expect(true).to.equal(true)
  });
})