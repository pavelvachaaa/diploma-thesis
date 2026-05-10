const { normalizePotentialMojibake } = require('../../src/shared/text/filenameEncoding');

describe('shared/text/filenameEncoding', () => {
    it('decodes latin1-misdecoded UTF-8 filenames', () => {
        expect(normalizePotentialMojibake('p. VÃ¡cha.pdf')).toBe('p. Vácha.pdf');
    });

    it('keeps already-correct UTF-8 filenames unchanged', () => {
        expect(normalizePotentialMojibake('Žluťoučký kůň.pdf')).toBe('Žluťoučký kůň.pdf');
    });

    it('keeps ASCII filenames unchanged', () => {
        expect(normalizePotentialMojibake('contract 2026.pdf')).toBe('contract 2026.pdf');
    });
});
