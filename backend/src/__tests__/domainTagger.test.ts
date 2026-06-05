// Feature: protrack-audit-completion, Property: tagDomains closed-domain invariant
// Validates: Requirements 15.6, 20.2

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { tagDomains, VALID_DOMAINS, extractDomain } from '../services/domainTagger.js';

// ─── Property: tagDomains closed-domain invariant ───────────────────────────
describe('tagDomains – closed-domain invariant', () => {
  it('Property: for any string input, all returned tags are from VALID_DOMAINS', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (text) => {
          const domains = tagDomains(text);
          return domains.every(d => VALID_DOMAINS.includes(d as typeof VALID_DOMAINS[number]));
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─── Unit tests: tagDomains ─────────────────────────────────────────────────
describe('tagDomains – unit tests', () => {
  it('detects IoT domain from text containing iot and mqtt keywords', () => {
    expect(tagDomains('smart irrigation using iot sensors and mqtt')).toContain('iot');
  });

  it('detects ai_ml domain from text containing lstm and neural network keywords', () => {
    expect(tagDomains('stock price prediction using lstm neural network')).toContain('ai_ml');
  });

  it('returns empty array for gibberish input without throwing', () => {
    expect(tagDomains('asdfghjkl')).toEqual([]);
  });

  it('returns empty array for empty string input without throwing', () => {
    expect(tagDomains('')).toEqual([]);
  });
});

// ─── Unit tests: extractDomain (DomainResult with confidence) ───────────────
describe('extractDomain – confidence and DomainResult shape', () => {
  it('returns domain, confidence, keywords fields', () => {
    const result = extractDomain('smart irrigation using iot sensors and mqtt');
    expect(result).toHaveProperty('domain');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('keywords');
  });

  it('confidence is between 0.0 and 1.0 for any input', () => {
    fc.assert(
      fc.property(fc.string(), (text) => {
        const result = extractDomain(text);
        return result.confidence >= 0 && result.confidence <= 1;
      }),
      { numRuns: 100 },
    );
  });

  it('IoT text → domain = iot', () => {
    expect(extractDomain('smart irrigation using iot sensors and mqtt').domain).toBe('iot');
  });

  it('ML text → domain = ai_ml', () => {
    expect(extractDomain('stock price prediction using lstm neural network').domain).toBe('ai_ml');
  });

  it('gibberish → domain = general, no exception', () => {
    const result = extractDomain('asdfghjkl');
    expect(result.domain).toBe('general');
    expect(result.confidence).toBe(0);
  });

  it('empty string → domain = general, confidence = 0', () => {
    const result = extractDomain('');
    expect(result.domain).toBe('general');
    expect(result.confidence).toBe(0);
  });

  it('matched keywords array is non-empty when domain detected', () => {
    const result = extractDomain('smart home iot sensor');
    expect(result.keywords.length).toBeGreaterThan(0);
  });
});
