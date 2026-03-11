import { useState, useRef, useCallback } from 'react';
import {
  Camera,
  Upload,
  ImageIcon,
  CheckCircle,
  AlertCircle,
  X,
  Loader2,
  ScanLine,
  Sparkles,
  BarChart3,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { uploadTradeScreenshot } from '../services/mt5Api';

// ── Processing step definitions ──────────────────────────────────────────
const STEPS = [
  { id: 1, icon: Upload,    label: 'Uploading image…'             },
  { id: 2, icon: ScanLine,  label: 'Extracting trades via AI vision…' },
  { id: 3, icon: BarChart3, label: 'Running performance analysis…' },
  { id: 4, icon: Sparkles,  label: 'Generating AI insights…'      },
];

export default function ScreenshotUpload({ onUploaded }) {
  const theme = useTheme();
  const [dragOver,      setDragOver]      = useState(false);
  const [selectedFile,  setSelectedFile]  = useState(null);
  const [preview,       setPreview]       = useState(null);
  const [loading,       setLoading]       = useState(false);
  const [currentStep,   setCurrentStep]   = useState(0);
  const [error,         setError]         = useState(null);

  const inputRef = useRef(null);

  // ── File selection helpers ──────────────────────────────────────────────
  const handleFile = useCallback((file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, or JPEG).');
      return;
    }
    setError(null);
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const clearFile = () => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
    setCurrentStep(0);
    if (inputRef.current) inputRef.current.value = '';
  };

  // ── Upload & analyse ────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!selectedFile || loading) return;
    setLoading(true);
    setError(null);
    try {
      setCurrentStep(1);
      await pause(300);

      setCurrentStep(2);
      const result = await uploadTradeScreenshot(selectedFile);

      setCurrentStep(3);
      await pause(400);

      setCurrentStep(4);
      await pause(300);

      onUploaded(result);
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        'Upload failed. Please try again.';
      setError(msg);
      setCurrentStep(0);
    } finally {
      setLoading(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
          style={{ backgroundColor: `${theme.accent}20`, color: theme.accent }}
        >
          <Camera className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: theme.text }}>
          Screenshot Trade Import
        </h1>
        <p className="text-sm leading-relaxed max-w-md mx-auto" style={{ color: theme.muted }}>
          Take a screenshot of your MT4 or MT5 trade history and upload it here.
          Our AI will extract all your trades and generate a performance report instantly.
        </p>
      </div>

      {/* Upload card */}
      <div
        className="rounded-2xl border-2 p-6"
        style={{ backgroundColor: theme.surface, borderColor: theme.border }}
      >
        {/* Drop zone */}
        {!preview ? (
          <div
            onClick={() => inputRef.current?.click()}
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            className="rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-all duration-200"
            style={{
              borderColor:     dragOver ? theme.accent : theme.border,
              backgroundColor: dragOver ? `${theme.accent}10` : 'transparent',
            }}
          >
            <ImageIcon
              className="w-12 h-12 mx-auto mb-4"
              style={{ color: dragOver ? theme.accent : theme.muted }}
            />
            <p className="font-semibold text-base mb-1" style={{ color: theme.text }}>
              Drop your screenshot here
            </p>
            <p className="text-sm mb-4" style={{ color: theme.muted }}>
              or click to browse — PNG, JPG, JPEG up to 15 MB
            </p>
            <div className="flex justify-center gap-3 flex-wrap">
              <button
                type="button"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ backgroundColor: `${theme.accent}20`, color: theme.accent }}
              >
                <Upload className="w-4 h-4" />
                Browse Files
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (inputRef.current) {
                    inputRef.current.setAttribute('capture', 'environment');
                    inputRef.current.click();
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ backgroundColor: `${theme.accent}20`, color: theme.accent }}
              >
                <Camera className="w-4 h-4" />
                Use Camera
              </button>
            </div>
          </div>
        ) : (
          /* Image preview */
          <div className="relative rounded-xl overflow-hidden" style={{ maxHeight: 320 }}>
            <img
              src={preview}
              alt="Selected screenshot"
              className="w-full object-contain rounded-xl"
              style={{ maxHeight: 320, backgroundColor: theme.bg }}
            />
            {!loading && (
              <button
                onClick={clearFile}
                className="absolute top-3 right-3 rounded-full p-1.5 transition-opacity"
                style={{ backgroundColor: theme.bg, color: theme.muted }}
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <div
              className="mt-3 px-1 flex items-center gap-2 text-sm"
              style={{ color: theme.muted }}
            >
              <ImageIcon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{selectedFile?.name}</span>
              <span className="flex-shrink-0">
                ({(selectedFile?.size / 1024).toFixed(0)} KB)
              </span>
            </div>
          </div>
        )}

        {/* Hidden inputs */}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />

        {/* Error */}
        {error && (
          <div
            className="mt-4 flex items-start gap-3 rounded-xl p-4 text-sm"
            style={{ backgroundColor: `${theme.danger}15`, color: theme.danger }}
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Processing steps */}
        {loading && (
          <div className="mt-6 space-y-2">
            {STEPS.map((step) => {
              const done    = currentStep > step.id;
              const active  = currentStep === step.id;
              const Icon    = step.icon;
              return (
                <div
                  key={step.id}
                  className="flex items-center gap-3 py-2 px-3 rounded-lg transition-all duration-300"
                  style={{
                    backgroundColor: active ? `${theme.accent}15` : 'transparent',
                    opacity: currentStep < step.id ? 0.35 : 1,
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: done
                        ? `${theme.success}20`
                        : active
                        ? `${theme.accent}20`
                        : theme.bg,
                    }}
                  >
                    {done ? (
                      <CheckCircle
                        className="w-4 h-4"
                        style={{ color: theme.success }}
                      />
                    ) : active ? (
                      <Loader2
                        className="w-4 h-4 animate-spin"
                        style={{ color: theme.accent }}
                      />
                    ) : (
                      <Icon className="w-4 h-4" style={{ color: theme.muted }} />
                    )}
                  </div>
                  <span
                    className="text-sm font-medium"
                    style={{
                      color: done
                        ? theme.success
                        : active
                        ? theme.text
                        : theme.muted,
                    }}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Analyse button */}
        {selectedFile && !loading && (
          <button
            onClick={handleAnalyze}
            className="mt-6 w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
            style={{ backgroundColor: theme.accent, color: '#fff' }}
          >
            <Sparkles className="w-4 h-4" />
            Analyse Trades with AI
          </button>
        )}
      </div>

      {/* Tips */}
      <div
        className="mt-5 rounded-xl p-4 text-sm"
        style={{ backgroundColor: theme.surface, borderColor: theme.border }}
      >
        <p className="font-semibold mb-2" style={{ color: theme.text }}>
          Tips for best results
        </p>
        <ul className="space-y-1" style={{ color: theme.muted }}>
          <li>• Export the <strong style={{ color: theme.text }}>Account History</strong> or <strong style={{ color: theme.text }}>Trade History</strong> tab from MetaTrader</li>
          <li>• Ensure the full table is visible including column headers</li>
          <li>• Avoid cropping the image — include all columns (Symbol, Type, Profit, etc.)</li>
          <li>• Use a high-resolution screenshot for better OCR accuracy</li>
        </ul>
      </div>
    </div>
  );
}

function pause(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
