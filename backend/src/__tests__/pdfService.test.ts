// Tests for pdfService — validates PDF generation returns a non-empty Buffer
// with correct content-type headers pattern.
// pdfkit is mocked so tests run without disk I/O.

import { describe, it, expect, vi, beforeAll } from 'vitest';

// ─── Mock pdfkit ─────────────────────────────────────────────────────────────
// pdfkit uses dynamic import in pdfService.ts; we mock the module globally.
vi.mock('pdfkit', () => {
  const { EventEmitter } = require('events');

  class MockPDFDocument extends EventEmitter {
    fontSize() { return this; }
    font() { return this; }
    text() { return this; }
    moveDown() { return this; }
    fillColor() { return this; }
    end() {
      // Emit a small fake chunk then end
      process.nextTick(() => {
        this.emit('data', Buffer.from('PDF-MOCK-CONTENT'));
        this.emit('end');
      });
    }
  }

  return { default: MockPDFDocument };
});

import { generateMarksheetPDF, generateAttainmentPDF, MarksheetData, AttainmentReportData } from '../services/pdfService.js';

const sampleMarksheet: MarksheetData = {
  group_name: 'Team Alpha',
  guide_email: 'guide@test.edu',
  students: [
    { prn_no: 'PRN001', roll_no: 'R001', email: 'student@test.edu' },
  ],
  r1_marks: 75,
  r2_marks: 80,
  r3_marks: 85,
  final_phase_marks: 90,
  final_marks: 84.5,
  grade: 'A+',
};

const sampleAttainment: AttainmentReportData = {
  batch_year: 2024,
  type: 'PO',
  outcomes: { PO1: 72.5, PO2: 45.0, PO3: 88.0 },
  gaps: ['PO2'],
  total_groups: 10,
};

describe('generateMarksheetPDF', () => {
  it('returns a Buffer', async () => {
    const buf = await generateMarksheetPDF(sampleMarksheet);
    expect(Buffer.isBuffer(buf)).toBe(true);
  });

  it('buffer is non-empty', async () => {
    const buf = await generateMarksheetPDF(sampleMarksheet);
    expect(buf.length).toBeGreaterThan(0);
  });

  it('works when guide_email is null', async () => {
    const buf = await generateMarksheetPDF({ ...sampleMarksheet, guide_email: null });
    expect(Buffer.isBuffer(buf)).toBe(true);
  });

  it('works with empty students array', async () => {
    const buf = await generateMarksheetPDF({ ...sampleMarksheet, students: [] });
    expect(Buffer.isBuffer(buf)).toBe(true);
  });
});

describe('generateAttainmentPDF', () => {
  it('returns a Buffer', async () => {
    const buf = await generateAttainmentPDF(sampleAttainment);
    expect(Buffer.isBuffer(buf)).toBe(true);
  });

  it('buffer is non-empty', async () => {
    const buf = await generateAttainmentPDF(sampleAttainment);
    expect(buf.length).toBeGreaterThan(0);
  });

  it('works with no gaps', async () => {
    const buf = await generateAttainmentPDF({ ...sampleAttainment, gaps: [] });
    expect(Buffer.isBuffer(buf)).toBe(true);
  });

  it('works with empty outcomes', async () => {
    const buf = await generateAttainmentPDF({ ...sampleAttainment, outcomes: {}, gaps: [] });
    expect(Buffer.isBuffer(buf)).toBe(true);
  });
});
