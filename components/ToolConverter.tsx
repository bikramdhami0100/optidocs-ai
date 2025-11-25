import React, { useState } from 'react';
import { Upload, FilePlus, Download, X, MoveUp, MoveDown, Image as ImageIcon, FileText, RefreshCcw, Package } from 'lucide-react';
import jsPDF from 'jspdf';
import JSZip from 'jszip';
import { renderPdfToImages, PdfPageImage } from '../utils/pdfUtils';

type Tab = 'img-to-pdf' | 'pdf-to-img';

export const ToolConverter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('img-to-pdf');

  return (
    <div className="w-full max-w-5xl mx-auto p-6">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-white mb-2">Format Converter</h2>
        <p className="text-slate-400">Switch effortlessly between Document and Image formats.</p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-8">
        <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 inline-flex">
          <button 
            onClick={() => setActiveTab('img-to-pdf')}
            className={`px-6 py-3 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${activeTab === 'img-to-pdf' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            <ImageIcon size={18} /> Images to PDF
          </button>
          <button 
            onClick={() => setActiveTab('pdf-to-img')}
            className={`px-6 py-3 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${activeTab === 'pdf-to-img' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            <FileText size={18} /> PDF to Images
          </button>
        </div>
      </div>

      <div className="animate-in fade-in duration-300">
        {activeTab === 'img-to-pdf' ? <ImageToPdfConverter /> : <PdfToImageConverter />}
      </div>
    </div>
  );
};

// Sub-component: Image to PDF
const ImageToPdfConverter: React.FC = () => {
  const [images, setImages] = useState<{file: File, preview: string}[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files).map((file: File) => ({
        file,
        preview: URL.createObjectURL(file)
      }));
      setImages(prev => [...prev, ...newImages]);
    }
  };

  const generatePDF = async () => {
    if (images.length === 0) return;
    setIsGenerating(true);
    try {
      const doc = new jsPDF();
      for (let i = 0; i < images.length; i++) {
        const img = new Image();
        img.src = images[i].preview;
        await new Promise((r: any) => img.onload = r);
        
        // Fit to A4 logic
        const pageWidth = 210;
        const pageHeight = 297;
        const ratio = Math.min((pageWidth - 20) / img.width, (pageHeight - 20) / img.height);
        const w = img.width * ratio;
        const h = img.height * ratio;

        if (i > 0) doc.addPage();
        doc.addImage(images[i].preview, 'JPEG', (pageWidth - w) / 2, (pageHeight - h) / 2, w, h);
      }
      doc.save('converted_images.pdf');
    } catch (e) {
      alert("Error generating PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800">
       <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-indigo-300">Images → PDF</h3>
          <button 
             onClick={generatePDF}
             disabled={images.length === 0 || isGenerating}
             className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors"
          >
            {isGenerating ? <RefreshCcw className="animate-spin" size={18}/> : <Download size={18} />} 
            Merge & Download
          </button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-1 aspect-[3/4] border-2 border-dashed border-slate-700 rounded-xl bg-slate-800/50 hover:border-indigo-500 hover:bg-slate-800 transition-all relative flex flex-col items-center justify-center cursor-pointer group">
             <input type="file" multiple accept="image/*" onChange={handleFiles} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" />
             <FilePlus size={32} className="text-slate-500 group-hover:text-indigo-400 mb-2 transition-colors" />
             <span className="text-sm text-slate-400 font-medium">Add Images</span>
          </div>

          {images.map((img, idx) => (
             <div key={idx} className="relative aspect-[3/4] group bg-black rounded-xl overflow-hidden border border-slate-700">
                <img src={img.preview} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                   <div className="flex justify-between items-center">
                     <span className="text-xs text-white font-mono truncate flex-1">{img.file.name}</span>
                     <button onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-300 p-1"><X size={14} /></button>
                   </div>
                   <div className="flex gap-1 mt-1">
                      <button onClick={() => {
                          if (idx === 0) return;
                          const copy = [...images];
                          [copy[idx], copy[idx-1]] = [copy[idx-1], copy[idx]];
                          setImages(copy);
                      }} className="bg-slate-700 p-1 rounded hover:bg-slate-600 text-white"><MoveUp size={12}/></button>
                      <button onClick={() => {
                          if (idx === images.length - 1) return;
                          const copy = [...images];
                          [copy[idx], copy[idx+1]] = [copy[idx+1], copy[idx]];
                          setImages(copy);
                      }} className="bg-slate-700 p-1 rounded hover:bg-slate-600 text-white"><MoveDown size={12}/></button>
                   </div>
                </div>
             </div>
          ))}
       </div>
    </div>
  );
};

// Sub-component: PDF to Image
const PdfToImageConverter: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PdfPageImage[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [progress, setProgress] = useState("");

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFile(f);
      setPages([]);
      setIsConverting(true);
      try {
        const imgs = await renderPdfToImages(f, 2.0, (c, t) => setProgress(`Converting page ${c}/${t}`));
        setPages(imgs);
      } catch(err) {
        console.error(err);
        alert("Failed to parse PDF. " + err);
      } finally {
        setIsConverting(false);
      }
    }
  };

  const downloadImage = (blob: Blob, index: number) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${file?.name.split('.')[0]}_page_${index + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllAsZip = async () => {
    if (!file || pages.length === 0) return;
    setIsZipping(true);
    
    try {
      const zip = new JSZip();
      const folderName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
      const folder = zip.folder(folderName) || zip;

      // Add files to zip
      pages.forEach((page, index) => {
        folder.file(`${folderName}_page_${index + 1}.jpg`, page.blob);
      });

      const content = await zip.generateAsync({ type: "blob" });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `${folderName}_images.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error creating ZIP:", error);
      alert("Failed to create ZIP file.");
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800">
      {!file || (isConverting && pages.length === 0) ? (
         <div className="border-2 border-dashed border-slate-700 rounded-xl h-64 flex flex-col items-center justify-center relative hover:border-indigo-500 hover:bg-slate-800/30 transition-all">
           <input type="file" accept=".pdf" onChange={handleFile} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
           {isConverting ? (
             <div className="text-center">
                <RefreshCcw className="animate-spin text-indigo-500 mx-auto mb-3" size={32}/>
                <p className="text-indigo-300">{progress}</p>
             </div>
           ) : (
             <>
                <FileText size={48} className="text-slate-500 mb-4" />
                <p className="text-lg text-slate-300 font-medium">Upload PDF to Convert</p>
                <p className="text-slate-500 text-sm mt-2">We'll extract every page as a high-quality image.</p>
             </>
           )}
         </div>
      ) : (
        <div>
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <div>
               <h3 className="text-lg font-semibold text-white">{file.name}</h3>
               <span className="text-slate-500 text-sm">{pages.length} Pages Extracted</span>
            </div>
            
            <div className="flex gap-3">
               <button onClick={() => {setFile(null); setPages([]);}} className="px-4 py-2 rounded-lg text-sm text-red-400 hover:bg-red-950/30 transition-colors">
                  Clear
               </button>
               <button 
                 onClick={downloadAllAsZip}
                 disabled={isZipping}
                 className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors shadow-lg shadow-indigo-500/20"
               >
                 {isZipping ? <RefreshCcw className="animate-spin" size={18} /> : <Package size={18} />} 
                 Download All (ZIP)
               </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pages.map((page, idx) => {
              const url = URL.createObjectURL(page.blob);
              return (
                <div key={idx} className="bg-slate-950 rounded-xl overflow-hidden border border-slate-800 group">
                   <div className="aspect-[210/297] relative">
                      <img src={url} className="w-full h-full object-contain" alt={`Page ${idx+1}`} />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                          onClick={() => downloadImage(page.blob, idx)}
                          className="bg-white text-slate-900 px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:scale-105 transition-transform"
                        >
                          <Download size={16} /> Save Image
                        </button>
                      </div>
                   </div>
                   <div className="p-3 text-center border-t border-slate-800 bg-slate-900">
                      <span className="text-sm text-slate-400">Page {idx + 1}</span>
                   </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};