/**
 * PDF Service — frontend utility for generating downloadable PDF documents.
 * Uses jspdf + jspdf-autotable. Requirements: 2.1–2.8
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GroupData {
  group_id: string;
  group_name: string;
  members: { name: string; prn: string }[];
  guide_name?: string;
}

export interface EvaluationData {
  phase: 'REVIEW_1' | 'REVIEW_2' | 'REVIEW_3' | 'FINAL';
  total_marks: number | null;
  rubric_scores?: Record<string, number>;
  evaluated_at?: string;
  remarks?: string;
}

export interface FinalResult {
  final_marks: number;
  grade: string;
  r1_marks: number | null;
  r2_marks: number | null;
  r3_marks: number | null;
  final_phase_marks: number | null;
  computed_at: string;
}

export interface StudentData {
  name: string;
  prn: string;
  roll_no: string;
  email?: string;
}

export interface RubricTemplate {
  criteria: { id: string; label: string; max_marks: number }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const INSTITUTION = 'ProTrack Academic Institute';

/**
 * Derives a letter grade from a numeric mark (Requirements 2.4, 4.4).
 * ≥90→O, ≥80→A+, ≥70→A, ≥60→B+, ≥50→B, ≥40→C, <40→F
 */
export function computeGrade(
  finalMarks: number,
): 'O' | 'A+' | 'A' | 'B+' | 'B' | 'C' | 'F' {
  if (finalMarks >= 90) return 'O';
  if (finalMarks >= 80) return 'A+';
  if (finalMarks >= 70) return 'A';
  if (finalMarks >= 60) return 'B+';
  if (finalMarks >= 50) return 'B';
  if (finalMarks >= 40) return 'C';
  return 'F';
}

/**
 * Formats a PDF download filename (Requirements 2.6, 20).
 */
export function formatFilename(
  groupNameOrPrn: string,
  phase: string,
  type: 'marksheet' | 'report',
): string {
  const safe = groupNameOrPrn.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
  if (type === 'marksheet') {
    return `${safe}_${phase}_marksheet.pdf`;
  }
  return `${safe}_performance_report.pdf`;
}

function addHeader(doc: jsPDF, title: string): void {
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(INSTITUTION, 105, 14, { align: 'center' });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(title, 105, 21, { align: 'center' });
}

function addFooter(doc: jsPDF): void {
  const pageCount = (doc as jsPDF & { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  const generated = `Generated: ${new Date().toLocaleString()}`;
  doc.setFontSize(8);
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(generated, 14, doc.internal.pageSize.height - 8);
    doc.text(`Page ${i} of ${pageCount}`, 195, doc.internal.pageSize.height - 8, { align: 'right' });
  }
}

const PHASE_LABELS: Record<string, string> = {
  REVIEW_1: 'Review 1',
  REVIEW_2: 'Review 2',
  REVIEW_3: 'Review 3',
  FINAL: 'Final',
};

// ─── Generators ───────────────────────────────────────────────────────────────

/**
 * Generates and downloads a group marksheet PDF (Requirement 2.1).
 */
export function generateGroupMarksheet(
  group: GroupData,
  evaluations: EvaluationData[],
  finalResult: FinalResult | null,
): void {
  const doc = new jsPDF();
  addHeader(doc, 'Group Marksheet');

  // Group info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Group Name:', 14, 32);
  doc.setFont('helvetica', 'normal');
  doc.text(group.group_name, 50, 32);
  if (group.guide_name) {
    doc.setFont('helvetica', 'bold');
    doc.text('Guide:', 14, 38);
    doc.setFont('helvetica', 'normal');
    doc.text(group.guide_name, 50, 38);
  }

  // Members table
  autoTable(doc, {
    startY: 44,
    head: [['Member Name', 'PRN']],
    body: group.members.map((m) => [m.name, m.prn]),
    headStyles: { fillColor: [79, 70, 229] },
    margin: { left: 14, right: 14 },
  });

  const afterMembers = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // Phase marks table
  const phases: Array<'REVIEW_1' | 'REVIEW_2' | 'REVIEW_3' | 'FINAL'> = [
    'REVIEW_1', 'REVIEW_2', 'REVIEW_3', 'FINAL',
  ];

  const phaseMarks = phases.map((phase) => {
    const ev = evaluations.find((e) => e.phase === phase);
    const marks = ev?.total_marks ?? null;
    return [PHASE_LABELS[phase], marks !== null ? String(marks) : 'Pending'];
  });

  // Final marks row
  const fm = finalResult?.final_marks ?? 0;
  const grade = finalResult?.grade ?? computeGrade(fm);
  phaseMarks.push(['Final Marks', finalResult ? String(fm.toFixed(2)) : '0']);
  phaseMarks.push(['Grade', grade]);

  autoTable(doc, {
    startY: afterMembers,
    head: [['Phase / Summary', 'Marks']],
    body: phaseMarks,
    headStyles: { fillColor: [79, 70, 229] },
    margin: { left: 14, right: 14 },
  });

  addFooter(doc);
  doc.save(formatFilename(group.group_name, 'all_phases', 'marksheet'));
}

/**
 * Generates and downloads a student performance PDF (Requirement 2.2).
 */
export function generateStudentReport(
  student: StudentData,
  group: GroupData,
  evaluations: EvaluationData[],
  peerScores?: { evaluator_name: string; score: number }[],
): void {
  const doc = new jsPDF();
  addHeader(doc, 'Student Performance Report');

  // Student info block
  doc.setFontSize(10);
  const info: [string, string][] = [
    ['Name', student.name],
    ['PRN', student.prn],
    ['Roll No', student.roll_no],
    ['Group', group.group_name],
    ['Guide', group.guide_name ?? 'Not assigned'],
  ];
  let y = 32;
  for (const [label, value] of info) {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, 14, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 55, y);
    y += 6;
  }

  // Phase-wise marks
  autoTable(doc, {
    startY: y + 4,
    head: [['Phase', 'Marks']],
    body: (['REVIEW_1', 'REVIEW_2', 'REVIEW_3', 'FINAL'] as const).map((phase) => {
      const ev = evaluations.find((e) => e.phase === phase);
      return [PHASE_LABELS[phase], ev?.total_marks != null ? String(ev.total_marks) : 'Pending'];
    }),
    headStyles: { fillColor: [79, 70, 229] },
    margin: { left: 14, right: 14 },
  });

  // Peer evaluation scores
  if (peerScores && peerScores.length > 0) {
    const after = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
    autoTable(doc, {
      startY: after,
      head: [['Evaluator', 'Peer Score']],
      body: peerScores.map((p) => [p.evaluator_name, String(p.score)]),
      headStyles: { fillColor: [99, 102, 241] },
      margin: { left: 14, right: 14 },
    });
  }

  addFooter(doc);
  doc.save(formatFilename(student.prn, '', 'report'));
}

/**
 * Generates and downloads an evaluation sheet PDF (Requirement 2.3).
 */
export function generateEvaluationSheet(
  evaluation: EvaluationData,
  rubric: RubricTemplate,
): void {
  const doc = new jsPDF();
  addHeader(doc, `Evaluation Sheet — ${PHASE_LABELS[evaluation.phase] ?? evaluation.phase}`);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Phase:', 14, 32);
  doc.setFont('helvetica', 'normal');
  doc.text(PHASE_LABELS[evaluation.phase] ?? evaluation.phase, 50, 32);

  if (evaluation.evaluated_at) {
    doc.setFont('helvetica', 'bold');
    doc.text('Date:', 14, 38);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(evaluation.evaluated_at).toLocaleDateString(), 50, 38);
  }

  const rows = rubric.criteria.map((c) => [
    c.label,
    String(c.max_marks),
    evaluation.rubric_scores ? String(evaluation.rubric_scores[c.id] ?? 0) : '0',
  ]);

  rows.push(['Total', '', String(evaluation.total_marks ?? 0)]);

  autoTable(doc, {
    startY: 46,
    head: [['Criterion', 'Max Marks', 'Awarded']],
    body: rows,
    headStyles: { fillColor: [79, 70, 229] },
    margin: { left: 14, right: 14 },
  });

  if (evaluation.remarks) {
    const after = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Remarks:', 14, after);
    doc.setFont('helvetica', 'normal');
    doc.text(evaluation.remarks, 14, after + 6, { maxWidth: 182 });
  }

  addFooter(doc);
  doc.save(formatFilename(evaluation.phase, evaluation.phase, 'marksheet'));
}
