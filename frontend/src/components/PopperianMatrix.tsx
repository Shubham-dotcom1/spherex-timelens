import React, { useState, useEffect } from 'react';
import { PopperianReport, HypothesisValidation, AuditCertificate } from '../types';
import { generatePopperianReport, fetchAuditCertificate } from '../services/api';
import {
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  CheckCircle2,
  XCircle,
  FileText,
  RefreshCw,
  AlertTriangle,
  Info,
  Scale,
  Download,
  Award
} from 'lucide-react';

interface PopperianMatrixProps {
  ra: number;
  dec: number;
  targetName: string;
  observationsCount: number;
}

export const PopperianMatrix: React.FC<PopperianMatrixProps> = ({
  ra,
  dec,
  targetName,
  observationsCount,
}) => {
  const [report, setReport] = useState<PopperianReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [certData, setCertData] = useState<AuditCertificate | null>(null);
  const [isDownloadingCert, setIsDownloadingCert] = useState<boolean>(false);

  const handleDownloadCertificate = async () => {
    setIsDownloadingCert(true);
    try {
      const cert = await fetchAuditCertificate(targetName, ra, dec);
      setCertData(cert);

      const jsonStr = JSON.stringify(cert, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SPHEREx_Popperian_Certificate_${targetName.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Failed to download certificate:', err);
    } finally {
      setIsDownloadingCert(false);
    }
  };

  const loadReport = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await generatePopperianReport(ra, dec, targetName, observationsCount);
      setReport(data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate Popperian validation report');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [ra, dec, targetName, observationsCount]);

  const getOutcomeBadge = (outcome: string) => {
    switch (outcome) {
      case 'SUPPORTED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>SUPPORTED</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <XCircle className="w-3.5 h-3.5" />
            <span>REJECTED (FALSIFIED)</span>
          </span>
        );
      case 'INSUFFICIENT_DATA':
      case 'INSUFFICIENT_COVERAGE':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>INSUFFICIENT DATA</span>
          </span>
        );
      case 'CANDIDATE_DETECTION':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>CANDIDATE (UNVERIFIED)</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-mono font-bold bg-slate-500/20 text-slate-300 border border-slate-500/40">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{outcome}</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-space-900 border border-space-800 rounded-xl p-5 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-space-800 gap-2">
        <div className="flex items-center space-x-2">
          <Scale className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-semibold text-white tracking-wide">
            Karl Popper Scientific Falsification Matrix
          </h2>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownloadCertificate}
            disabled={isDownloadingCert}
            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-mono font-semibold flex items-center space-x-1.5 transition shadow disabled:opacity-50"
            title="Download cryptographically verifiable Popperian Audit Certificate"
          >
            <Award className="w-3.5 h-3.5" />
            <span>{isDownloadingCert ? 'Generating...' : 'Audit Certificate'}</span>
          </button>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Strict Non-Confirmationist Protocol
          </span>
          <button
            onClick={loadReport}
            disabled={isLoading}
            className="p-1.5 bg-space-800 hover:bg-space-700 text-slate-300 rounded border border-space-700 transition"
            title="Re-run Popperian Audit"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Philosophical Rationale Box */}
      <div className="bg-space-950 p-4 rounded-lg border border-space-800 text-xs text-slate-300 space-y-2">
        <div className="flex items-center space-x-2 text-emerald-400 font-semibold font-mono">
          <ShieldCheck className="w-4 h-4" />
          <span>Epistemological Foundation (Sir Karl Popper, 1934)</span>
        </div>
        <p className="text-slate-400 leading-relaxed">
          "No amount of sightings of white swans can prove the theory that all swans are white. The criterion of the scientific status of a theory is its falsifiability, or refutability, or testability."
          SPHEREx TimeLens does not operate as an ordinary image browser; every astronomical claim is subjected to direct falsification tests. A visually intriguing residual or flux difference is never assumed to be an astronomical discovery.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-300 flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Hypothesis Cards Grid */}
      {report && (
        <div className="space-y-4">
          {Object.entries(report.hypotheses).map(([key, hyp]) => (
            <div
              key={key}
              className="bg-space-950/80 border border-space-800 rounded-lg p-4 space-y-3 hover:border-space-700 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-space-800/80">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded bg-space-800 text-cyan-300 font-mono text-xs font-bold border border-space-700">
                    {hyp.hypothesis_id}
                  </span>
                  <h3 className="text-sm font-semibold text-slate-100">{hyp.title}</h3>
                </div>
                {getOutcomeBadge(hyp.outcome)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <span className="text-slate-500 font-mono text-[10px] uppercase">Scientific Hypothesis:</span>
                  <p className="text-slate-300">{hyp.statement}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500 font-mono text-[10px] uppercase">Falsification Test Criteria:</span>
                  <p className="text-slate-300">{hyp.test_criteria}</p>
                </div>
              </div>

              {/* Evidence Metrics */}
              <div className="bg-space-900/90 p-3 rounded border border-space-800 font-mono text-xs space-y-1">
                <span className="text-slate-500 text-[10px] uppercase block">Empirical Evidence Record:</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-300 text-[11px]">
                  {Object.entries(hyp.evidence).map(([ekey, evalue]) => (
                    <div key={ekey} className="overflow-hidden">
                      <span className="text-slate-500">{ekey}:</span>{' '}
                      <span className="text-cyan-300 font-semibold">{String(evalue)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes & Reproducibility */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-space-800/60 text-[11px] font-mono text-slate-400">
                <p className="italic text-slate-300">{hyp.notes}</p>
                <div className="flex items-center space-x-2 text-[10px] text-slate-500 flex-shrink-0">
                  <span>Protocol: {hyp.reproducibility.protocol_version}</span>
                  <span>•</span>
                  <span>{hyp.reproducibility.dataset_version}</span>
                </div>
              </div>
            </div>
          ))}

          {/* Overall Synthesis */}
          <div className="bg-space-950 p-4 rounded-lg border border-space-800 space-y-2">
            <h4 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
              Popperian Synthesis & Recommendation
            </h4>
            <p className="text-xs text-slate-300">{report.overall_summary}</p>
            <div className="p-2.5 bg-space-900 rounded border border-space-800 text-xs font-mono text-cyan-300">
              <strong>Recommendation:</strong> {report.recommendation}
            </div>
          </div>

          {/* Cryptographic Popperian Certificate Card */}
          {certData && (
            <div className="bg-space-950 p-4 rounded-lg border border-emerald-500/40 space-y-2 font-mono text-xs shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <div className="flex items-center justify-between pb-2 border-b border-space-800">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                  <Award className="w-4 h-4" />
                  <span>Popperian Audit Certificate Generated</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                  {certData.verdict}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
                <div>
                  <span className="text-slate-500 block">Certificate ID:</span>
                  <span className="text-cyan-300 font-bold">{certData.certificate_id}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">SHA-256 Digest:</span>
                  <span className="text-slate-400 truncate block text-[10px]">{certData.sha256_checksum}</span>
                </div>
              </div>
              <div className="pt-2 text-[10px] text-slate-500 flex justify-between items-center">
                <span>Timestamp: {certData.issued_at_utc}</span>
                <span className="text-emerald-400">JSON certificate downloaded to device</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
