import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Upload, Sliders, Download, Trash2, Image as ImageIcon, FileText, RefreshCw, AlertTriangle } from 'lucide-react';
import jsPDF from 'jspdf';
import { ProcessedFile, CompressionSettings } from '../types';
import { processImage, formatBytes } from '../utils/imageUtils';
import { renderPdfToImages } from '../utils/pdfUtils';

export const ToolCompressor: React.FC = () => {
  const [file, setFile] = useState<ProcessedFile | null>(null);
  const [settings, setSettings] = useState<CompressionSettings>({
    targetSizeKB: 200,
    brightness: 100,
    grayscale: false
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      gsap.from(containerRef.current, { opacity: 0, y: 20, duration: 0.5 });
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const isPdf = selectedFile.type === 'application/pdf';
      
      const newFile: ProcessedFile = {
        id: Math.random().toString(36).substr(2, 9),
        originalFile: selectedFile,
        previewUrl: URL.createObjectURL(selectedFile), // PDF url works for object/iframe, Image for img
        sizeBefore: selectedFile.size,
        type: isPdf ? 'pdf' : 'image',
        name: selectedFile.name
      };
      setFile(newFile);
      // Auto process on load? Maybe wait for user to click apply for PDFs as they are heavy.
      // We'll do auto for images, manual for PDF.
      if (!isPdf) {
        handleProcess(newFile, settings); 
      } else {
         // For PDF we don't auto-process immediately to save resources
      }
    }
  };

  const handleProcess = async (currentFile: ProcessedFile, currentSettings: CompressionSettings) => {
    setIsProcessing(true);
    setProgress("Starting...");
    
    try {
      let finalBlob: Blob;

      if (currentFile.type === 'image') {
        finalBlob = await processImage(currentFile.originalFile, currentSettings);
      } else {
        // PDF Logic
        setProgress("Rasterizing PDF pages...");
        const images = await renderPdfToImages(currentFile.originalFile, 1.5, (curr, total) => {
            setProgress(`Processing page ${curr} of ${total}...`);
        });

        setProgress("Compressing & Rebuilding...");
        const doc = new jsPDF();
        let processedSize = 0;

        // Calculate target size per page approx (rough distribution)
        const targetPerImageKB = Math.max(20, currentSettings.targetSizeKB / images.length);
        const pageSettings = { ...currentSettings, targetSizeKB: targetPerImageKB };

        for (let i = 0; i < images.length; i++) {
            const pageImg = images[i];
            // Compress the rendered page image
            // We need to convert blob back to File object for our utility or refactor utility.
            // Refactoring utility is better, but for speed let's make a File.
            const pageFile = new File([pageImg.blob], `page_${i}.jpg`, { type: 'image/jpeg' });
            
            const compressedBlob = await processImage(pageFile, pageSettings);
            const compressedUrl = URL.createObjectURL(compressedBlob);

            // Add to PDF
            const props = doc.getImageProperties(compressedUrl);
            const pdfWidth = doc.internal.pageSize.getWidth();
            const pdfHeight = (props.height * pdfWidth) / props.width;

            if (i > 0) doc.addPage();
            doc.addImage(compressedUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            
            processedSize += compressedBlob.size;
        }
        finalBlob = doc.output('blob');
      }

      setFile(prev => prev ? {
        ...prev,
        processedBlob: finalBlob,
        processedUrl: URL.createObjectURL(finalBlob),
        sizeAfter: finalBlob.size
      } : null);
      setProgress("");

    } catch (err) {
      console.error("Processing failed", err);
      alert("Failed to process. " + err);
    } finally {
      setIsProcessing(false);
      setProgress("");
    }
  };

  const downloadFile = () => {
    if (file && file.processedUrl) {
      const link = document.createElement('a');
      link.href = file.processedUrl;
      link.download = `optimized_${file.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div ref={containerRef} className="w-full max-w-6xl feature-card mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Smart Compressor</h2>
        <p className="text-slate-400">Reduce file size for Images and PDFs while maintaining readability.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Settings Panel */}
        <div className="w-full lg:w-1/3 space-y-6">
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-indigo-300">
              <Sliders size={20} /> Compression Settings
            </h3>
            
            <div className="space-y-6">
              {/* Size Input */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Target Size (KB)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={settings.targetSizeKB}
                    onChange={(e) => setSettings({...settings, targetSizeKB: Number(e.target.value)})}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="e.g. 500"
                  />
                  <span className="absolute right-4 top-4 text-slate-500 text-sm font-medium">KB</span>
                </div>
              </div>

              {/* Brightness Slider */}
              <div>
                <div className="flex justify-between mb-2">
                   <label className="text-sm font-medium text-slate-300">Brightness</label>
                   <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-400">{settings.brightness}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={settings.brightness}
                  onChange={(e) => setSettings({...settings, brightness: Number(e.target.value)})}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              {/* Grayscale Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-900/30 rounded-xl border border-slate-800">
                <label className="text-sm font-medium text-slate-300">Grayscale Mode</label>
                <button
                  onClick={() => setSettings({...settings, grayscale: !settings.grayscale})}
                  className={`w-12 h-6 rounded-full transition-colors relative ${settings.grayscale ? 'bg-indigo-500' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.grayscale ? 'translate-x-6' : ''}`} />
                </button>
              </div>

              {/* Apply Button */}
              <button
                onClick={() => file && handleProcess(file, settings)}
                disabled={!file || isProcessing}
                className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20"
              >
                {isProcessing ? <RefreshCw className="animate-spin" /> : "Compress Now"}
              </button>
              
              {file?.type === 'pdf' && (
                  <div className="text-xs text-amber-400 flex gap-2 bg-amber-950/30 p-3 rounded-lg border border-amber-900/50">
                      <AlertTriangle size={16} className="shrink-0" />
                      <p>PDF compression works by rasterizing pages to images. Text will no longer be selectable.</p>
                  </div>
              )}
            </div>
          </div>

          {/* Upload Area (Small if file exists) */}
           <div className="glass-panel rounded-2xl p-6 border-dashed border-2 border-slate-700 hover:border-indigo-500/50 transition-colors relative flex flex-col items-center justify-center text-center min-h-[120px]">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <Upload size={24} className="text-slate-400 mb-2" />
            <p className="text-sm text-slate-300 font-medium">Change File</p>
          </div>
        </div>

        {/* Preview Area */}
        <div className="w-full lg:w-2/3 bg-slate-900/50 rounded-2xl border border-slate-800 p-8 flex flex-col min-h-[600px]">
          {!file ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
              <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-6 animate-pulse">
                  <Upload size={40} className="text-slate-500" />
              </div>
              <h3 className="text-xl font-medium text-slate-300 mb-2">Upload a Document</h3>
              <p className="text-slate-500 max-w-sm text-center">Support for high-res Images (JPG, PNG) and PDF Documents.</p>
              
              <div className="mt-8 relative">
                 <button className="bg-white text-slate-900 px-8 py-3 rounded-full font-bold hover:bg-indigo-50 transition-colors pointer-events-none">
                    Select File
                 </button>
                 <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                 />
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
               {/* Header */}
               <div className="flex justify-between items-start mb-6 pb-6 border-b border-slate-800">
                  <div>
                      <h3 className="font-bold text-lg text-white truncate max-w-md">{file.name}</h3>
                      <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-1 rounded mt-1 inline-block uppercase">{file.type}</span>
                  </div>
                  <button onClick={() => setFile(null)} className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors">
                      <Trash2 size={20} />
                  </button>
               </div>

               {/* Comparison View */}
               <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Before */}
                 <div className="flex flex-col">
                    <div className="bg-slate-950 rounded-xl border border-slate-800 flex-1 relative overflow-hidden group">
                        {file.type === 'image' ? (
                            <img src={file.previewUrl} className="w-full h-full object-contain p-4" alt="Original" />
                        ) : (
                            <iframe src={file.previewUrl} className="w-full h-full border-none" title="Original PDF" />
                        )}
                    </div>
                    <div className="mt-3 text-center">
                        <p className="text-sm text-slate-500 uppercase font-bold tracking-wider">Original</p>
                        <p className="text-lg font-mono text-white">{formatBytes(file.sizeBefore)}</p>
                    </div>
                 </div>

                 {/* After */}
                 <div className="flex flex-col">
                    <div className="bg-slate-950 rounded-xl border border-slate-800 flex-1 relative overflow-hidden">
                        {isProcessing ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm z-20">
                                <RefreshCw className="animate-spin text-indigo-500 mb-4" size={40} />
                                <p className="text-indigo-300 font-medium animate-pulse">{progress || "Optimizing..."}</p>
                            </div>
                        ) : file.processedUrl ? (
                            file.type === 'image' ? (
                                <img src={file.processedUrl} className="w-full h-full object-contain p-4" alt="Processed" />
                            ) : (
                                <iframe src={file.processedUrl} className="w-full h-full border-none" title="Processed PDF" />
                            )
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-600 text-sm p-8 text-center">
                                Click "Compress Now" to generate preview
                            </div>
                        )}
                    </div>
                    <div className="mt-3 text-center">
                        <p className="text-sm text-indigo-400 uppercase font-bold tracking-wider">Optimized</p>
                        <p className="text-lg font-mono text-white">
                            {file.sizeAfter ? formatBytes(file.sizeAfter) : '---'}
                            {file.sizeAfter && (
                                <span className="ml-2 text-green-400 text-sm">
                                    (-{Math.round(((file.sizeBefore - file.sizeAfter) / file.sizeBefore) * 100)}%)
                                </span>
                            )}
                        </p>
                    </div>
                 </div>
               </div>

               {/* Download Action */}
               {file.processedUrl && !isProcessing && (
                   <div className="mt-8 flex justify-center">
                       <button 
                           onClick={downloadFile}
                           className="bg-green-600 hover:bg-green-500 text-white px-10 py-4 rounded-xl font-bold flex items-center gap-3 shadow-lg shadow-green-900/30 transform transition-all hover:scale-105"
                       >
                           <Download size={24} /> Download Optimized File
                       </button>
                   </div>
               )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};