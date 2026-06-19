import { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BulkUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (count: number) => void;
}

export default function BulkUpload({ isOpen, onClose, onUpload }: BulkUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle');

  if (!isOpen) return null;

  const handleFile = (f: File) => {
    if (f.name.endsWith('.csv') || f.name.endsWith('.xlsx')) {
      setFile(f);
      setStatus('idle');
    }
  };

  const handleUpload = () => {
    if (!file) return;
    setStatus('processing');
    setTimeout(() => {
      setStatus('done');
      onUpload(12);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-zinc-900/95 border border-white/10 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Bulk CSV Upload</h2>
              <p className="text-xs text-muted-foreground">Import multiple users at once</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
            className={cn('border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer',
              dragOver ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 hover:border-white/20 bg-white/[0.02]')}
            onClick={() => document.getElementById('csv-input')?.click()}
          >
            <input id="csv-input" type="file" accept=".csv,.xlsx" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
            <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium">Drop your CSV file here or click to browse</p>
            <p className="text-xs text-muted-foreground mt-1">Supports .csv and .xlsx files</p>
          </div>

          {/* File info */}
          {file && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <FileText className="w-8 h-8 text-indigo-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button onClick={() => { setFile(null); setStatus('idle'); }} className="p-1 hover:bg-white/10 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
          )}

          {/* Template download */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div>
              <p className="text-xs font-medium">Need a template?</p>
              <p className="text-[11px] text-muted-foreground">Download CSV template with required columns</p>
            </div>
            <button
              onClick={() => {
                const csv = 'prn_no,email,full_name\nPRN001,student1@example.com,Student One\nPRN002,student2@example.com,Student Two';
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'student-whitelist-template.csv';
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">Download Template</button>
          </div>

          {/* Status */}
          {status === 'processing' && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-blue-400">Processing file...</span>
            </div>
          )}
          {status === 'done' && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="text-sm text-emerald-400">Successfully imported 12 users!</span>
            </div>
          )}
          {status === 'error' && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <AlertCircle className="w-5 h-5 text-rose-400" />
              <span className="text-sm text-rose-400">Error processing file. Please check format.</span>
            </div>
          )}

          <button onClick={handleUpload} disabled={!file || status === 'processing' || status === 'done'}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25">
            <Upload className="w-4 h-4" /> Upload & Import
          </button>
        </div>
      </div>
    </div>
  );
}
