// Type shim for pdfkit — used until the package is installed via npm.
// The actual @types/pdfkit types will take precedence once installed.
declare module 'pdfkit' {
  import { EventEmitter } from 'events';

  interface PDFDocumentOptions {
    margin?: number;
    [key: string]: unknown;
  }

  class PDFDocument extends EventEmitter {
    constructor(options?: PDFDocumentOptions);
    fontSize(size: number): this;
    font(font: string): this;
    text(text: string, options?: Record<string, unknown>): this;
    moveDown(lines?: number): this;
    fillColor(color: string): this;
    end(): void;
  }

  export = PDFDocument;
}
