import { expect } from '@open-wc/testing';
import { prependAt } from '../../src/language/grammar-helper.js';

describe('the grammar helper', () => {
  it('handles the basic case', () => {
    expect(prependAt({ place: 'Grand Palais' })).to.equal('au Grand Palais');
  });

  it('handles names with articles', () => {
    expect(prependAt({ place: 'Le Moulin Rouge' })).to.equal('au Moulin Rouge');
  });

  it('handles names with articles and vowels', () => {
    expect(prependAt({ place: "L'Arc de Triomphe" })).to.equal(
      "a l'Arc de Triomphe"
    );
  });

  it('handles plurals', () => {
    expect(prependAt({ place: 'Champs Elysées', isPlural: true })).to.equal(
      'aux Champs Elysées'
    );
  });
});
