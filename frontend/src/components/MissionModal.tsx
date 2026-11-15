import React from 'react';
import { X, Telescope, Shield, BookOpen, Layers, CheckCircle, ExternalLink, Orbit } from 'lucide-react';

interface MissionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MissionModal: React.FC<MissionModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-space-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-space-900 border border-space-800 rounded-2xl shadow-2xl p-6 my-8 text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-white bg-space-800 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 pb-4 border-b border-space-800">
          <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-lg border border-cyan-500/30">
            <Telescope className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">
              NASA SPHEREx Mission & Scientific Reference
            </h2>
            <p className="text-xs font-mono text-cyan-400">
              Spectro-Photometer for the History of the Universe, Epoch of Reionization, and Ices Explorer
            </p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="mt-5 space-y-6 text-xs text-slate-300">
          {/* Instrument Overview */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>1. Optical Architecture & Linear Variable Filters (LVF)</span>
            </h3>
            <p className="leading-relaxed text-slate-400">
              SPHEREx uses a 20-cm aperture all-aluminum telescope with wide-field optics feeding six 2040×2040 pixel infrared focal plane arrays (FPAs). Instead of conventional slit or grism dispersers, SPHEREx mounts <strong>Linear Variable Filters (LVF)</strong> directly over the detector arrays. As a result, wavelength varies continuously across the array along the dispersion axis, mapping each pixel coordinate $(x, y) \to (\lambda, \Delta\lambda)$ with a resolving power $R = \lambda / \Delta\lambda \approx 41 - 135$.
            </p>
          </div>

          {/* Detector Bands Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono uppercase font-bold text-slate-200">
              Detector Band Layout & Spectral Coverage (102 Nominal Channels)
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-[11px] border border-space-800">
                <thead className="bg-space-950 text-slate-400">
                  <tr>
                    <th className="p-2 border-b border-space-800">Detector</th>
                    <th className="p-2 border-b border-space-800">Wavelength Range</th>
                    <th className="p-2 border-b border-space-800">Resolving Power (R)</th>
                    <th className="p-2 border-b border-space-800">Key Scientific Tracers</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-space-800/60 bg-space-950/40">
                  <tr>
                    <td className="p-2 text-cyan-300 font-bold">SPHEREx-D1</td>
                    <td className="p-2">0.75 – 1.10 µm</td>
                    <td className="p-2">R ≈ 41</td>
                    <td className="p-2 text-slate-400">Galaxy clusters, stellar SED, low-mass stars</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-indigo-300 font-bold">SPHEREx-D2</td>
                    <td className="p-2">1.10 – 1.62 µm</td>
                    <td className="p-2">R ≈ 41</td>
                    <td className="p-2 text-slate-400">H₂O absorption (1.4 µm), brown dwarf classification</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-purple-300 font-bold">SPHEREx-D3</td>
                    <td className="p-2">1.63 – 2.41 µm</td>
                    <td className="p-2">R ≈ 41</td>
                    <td className="p-2 text-slate-400">CH₄ (2.2 µm), CO bandhead (2.3 µm)</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-pink-300 font-bold">SPHEREx-D4</td>
                    <td className="p-2">2.42 – 3.82 µm</td>
                    <td className="p-2">R ≈ 35 – 110</td>
                    <td className="p-2 text-slate-400">H₂O Ice (3.05 µm), PAH / CH₄ (3.3 µm)</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-amber-300 font-bold">SPHEREx-D5</td>
                    <td className="p-2">3.83 – 4.41 µm</td>
                    <td className="p-2">R ≈ 130</td>
                    <td className="p-2 text-slate-400">CO₂ Ice (4.26 µm), cold interstellar medium</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-rose-300 font-bold">SPHEREx-D6</td>
                    <td className="p-2">4.42 – 5.00 µm</td>
                    <td className="p-2">R ≈ 135</td>
                    <td className="p-2 text-slate-400">CO Gas (4.67 µm), ultracool brown dwarfs</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Epistemological Rationale */}
          <div className="space-y-2 p-4 bg-space-950 rounded-lg border border-space-800">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>2. Karl Popper Scientific Falsification Principle</span>
            </h3>
            <p className="leading-relaxed text-slate-400">
              In accordance with Karl Popper's landmark demarcation criterion, SPHEREx TimeLens mandates that scientific discoveries cannot be proclaimed purely through visual inspection or confirmation bias. For every analysis:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300 font-mono text-[11px]">
              <li>Hypothesis H1 requires verifying observational existence and spectral coverage in IRSA TAP.</li>
              <li>Hypothesis H2 tests astrometric displacement against catalogue proper motion vectors and positional errors.</li>
              <li>Hypothesis H3 subtracts images with variance propagation, rejecting false positives by testing control stationary sources.</li>
              <li>Hypothesis H4 tests light curves against a constant flux null hypothesis using χ² goodness-of-fit.</li>
              <li>Hypothesis H5 extracts spectra using the empirical WCS-WAVE calibration matrix without synthetic interpolation.</li>
            </ul>
          </div>

          {/* NASA IRSA Data Attribution */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>3. Data Attribution & NASA IRSA Access</span>
            </h3>
            <p className="leading-relaxed text-slate-400">
              Observations and metadata are retrieved directly from the NASA/IPAC Infrared Science Archive (IRSA), operated by Caltech and JPL under contract with NASA.
            </p>
            <div className="flex items-center space-x-3 text-xs font-mono">
              <a
                href="https://irsa.ipac.caltech.edu/Missions/spherex.html"
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1 text-cyan-400 hover:underline"
              >
                <span>NASA IRSA SPHEREx Archive</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <span>•</span>
              <a
                href="https://spherex.caltech.edu"
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1 text-cyan-400 hover:underline"
              >
                <span>Caltech SPHEREx Science Center</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-6 pt-4 border-t border-space-800 flex items-center justify-between font-mono text-xs text-slate-500">
          <span>Developed by Team CodeGenesis for NASA Space Apps 2026</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-space-800 hover:bg-space-700 text-slate-200 rounded-md transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
