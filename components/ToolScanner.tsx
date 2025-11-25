import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Sparkles, Copy, Sliders, Eye, Check, Download } from 'lucide-react';
import { scanDocument, fileToBase64 } from '../services/geminiService';
import { OcrResult } from '../types';

export const ToolScanner: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processedPreview, setProcessedPreview] = useState<string | null>(null);
  
  // Visual settings
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [threshold, setThreshold] = useState(0); // 0 = off, >0 = binarization level
  
  const [result, setResult] = useState<OcrResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setResult(null);
      setError(null);
      // Reset filters
      setBrightness(100);
      setContrast(100);
      setThreshold(0);
    }
  };

  // Apply visual filters
  useEffect(() => {
    if (!preview || !canvasRef.current) return;
    
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;
      
      // Set canvas size to match image (max width 1000 for perf)
      const scale = Math.min(1, 1000 / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      // Draw initial
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) grayscale(${threshold > 0 ? 1 : 0})`;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Manual thresholding (Binarization) if enabled
      if (threshold > 0) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        // Simple threshold
        const level = 255 * (threshold / 100); 
        for (let i = 0; i < data.length; i += 4) {
           // Assume grayscale already applied by filter
           const val = data[i]; 
           const newVal = val > level ? 255 : 0;
           data[i] = newVal;
           data[i+1] = newVal;
           data[i+2] = newVal;
        }
        ctx.putImageData(imageData, 0, 0);
      }

      setProcessedPreview(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.src = preview;
  }, [preview, brightness, contrast, threshold]);

  const runScan = async () => {
    if (!processedPreview) return;
    setLoading(true);
    setError(null);

    try {
      // We use the processed image (base64) from the canvas
      // Remove data prefix
      const base64 = processedPreview.split(',')[1];
      const scanResult = await scanDocument(base64, 'image/jpeg');
      setResult(scanResult);
    } catch (err: any) {
      console.error(err);
      setError("Failed to scan. Please try a clearer image.");
    } finally {
      setLoading(false);
    }
  };

  const downloadScan = () => {
    if (processedPreview) {
      const link = document.createElement('a');
      link.href = processedPreview;
      link.download = `scanned_doc_${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-white mb-2 flex justify-center items-center gap-3">
           <Sparkles className="text-cyan-400" /> AI Smart Scanner
        </h2>
        <p className="text-slate-400">Digitize documents with visual enhancement and AI extraction.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left: Visual Scanner */}
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl p-6 border border-slate-700">
             {!file ? (
                <div className="border-2 border-dashed border-slate-700 rounded-xl h-[400px] flex flex-col items-center justify-center relative hover:bg-slate-800/30 transition-all cursor-pointer">
                   <input type="file" accept="image/*" onChange={handleFile} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                   <Upload size={48} className="text-slate-500 mb-4" />
                   <p className="text-slate-300 font-medium">Upload Document</p>
                   <p className="text-slate-500 text-sm">Drag & drop or click to browse</p>
                </div>
             ) : (
                <div className="flex flex-col h-full">
                   <div className="relative bg-black rounded-xl overflow-hidden border border-slate-800 h-[400px] mb-4">
                      <img src={processedPreview || preview || ''} alt="Preview" className="w-full h-full object-contain" />
                      <canvas ref={canvasRef} className="hidden" />
                   </div>

                   {/* Controls */}
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                         <label className="text-xs text-slate-400 font-bold mb-1 block">Brightness</label>
                         <input type="range" min="50" max="150" value={brightness} onChange={e => setBrightness(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded appearance-none accent-cyan-400" />
                      </div>
                      <div>
                         <label className="text-xs text-slate-400 font-bold mb-1 block">Contrast</label>
                         <input type="range" min="50" max="150" value={contrast} onChange={e => setContrast(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded appearance-none accent-cyan-400" />
                      </div>
                      <div>
                         <label className="text-xs text-slate-400 font-bold mb-1 block">B&W Filter</label>
                         <input type="range" min="0" max="80" value={threshold} onChange={e => setThreshold(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded appearance-none accent-cyan-400" />
                      </div>
                   </div>

                   <div className="flex gap-2">
                      <button 
                        onClick={() => {setFile(null); setPreview(null);}} 
                        className="px-4 py-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold transition-colors"
                        title="Reset"
                      >
                         Reset
                      </button>
                      <button 
                        onClick={downloadScan}
                        className="px-6 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold flex items-center gap-2 transition-colors"
                        title="Download Processed Image"
                      >
                         <Download size={20} /> Save Scan
                      </button>
                      <button 
                        onClick={runScan} 
                        disabled={loading}
                        className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold shadow-lg shadow-cyan-900/20 flex items-center justify-center gap-2 transition-all"
                      >
                        {loading ? <Sparkles className="animate-spin" /> : <><Eye size={20}/> Scan with AI</>}
                      </button>
                   </div>
                </div>
             )}
          </div>
        </div>

        {/* Right: AI Results */}
        <div className="glass-panel rounded-2xl border border-slate-700 p-6 min-h-[400px] flex flex-col relative overflow-hidden">
           {loading && (
             <div className="absolute inset-0 bg-slate-900/80 z-10 flex flex-col items-center justify-center backdrop-blur-sm">
                <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-cyan-300 animate-pulse">Analyzing Document Structure...</p>
             </div>
           )}
           
           {!result ? (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-600 opacity-60">
                <FileText size={64} className="mb-4" />
                <p className="text-lg">AI Extraction Results</p>
                <p className="text-sm">Text, summary, and data will appear here.</p>
             </div>
           ) : (
             <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
                
                <div className="bg-cyan-950/30 border border-cyan-900/50 rounded-xl p-4">
                   <h3 className="text-cyan-400 font-bold text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
                     <Sparkles size={14}/> Summary
                   </h3>
                   <p className="text-slate-200 leading-relaxed">{result.summary}</p>
                </div>

                {result.items && result.items.length > 0 && (
                  <div>
                    <h3 className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-3">Key Data Points</h3>
                    <div className="flex flex-wrap gap-2">
                      {result.items.map((item, i) => (
                        <span key={i} className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-sm flex items-center gap-2">
                           <Check size={12} className="text-green-400" /> {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex-1 flex flex-col min-h-[200px]">
                   <div className="flex justify-between items-center mb-2">
                      <h3 className="text-slate-400 font-bold text-xs uppercase tracking-wider">Extracted Text</h3>
                      <button onClick={() => navigator.clipboard.writeText(result.text)} className="text-slate-400 hover:text-white p-1" title="Copy Text">
                         <Copy size={16} />
                      </button>
                   </div>
                   <textarea 
                      readOnly 
                      value={result.text}
                      className="flex-1 w-full bg-black/40 rounded-xl border border-slate-800 p-4 text-slate-300 font-mono text-sm focus:outline-none focus:border-cyan-500/50 resize-none"
                   />
                </div>
             </div>
           )}
        </div>

      </div>
    </div>
  );
};