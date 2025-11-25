import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ArrowRight, Zap, ScanLine, RefreshCcw, FileBox, Star } from 'lucide-react';
import { ToolType } from '../types';

interface HeroProps {
  onNavigate: (tool: ToolType) => void;
}

export const Hero: React.FC<HeroProps> = ({ onNavigate }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      tl.from(".hero-title", {
        y: 60,
        opacity: 0,
        duration: 1,
        ease: 'power4.out',
        stagger: 0.1
      })
      .from(".hero-subtitle", {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out'
      }, "-=0.6")
      .from(".feature-card", {
        y: 50,
        opacity: 0,
        duration: 0.6,
        stagger: 0.15,
        ease: 'back.out(1.2)'
      }, "-=0.4");

    }, containerRef);

    return () => ctx.revert();
  }, []);

  const features = [
    {
      id: ToolType.COMPRESSOR,
      icon: <Zap size={32} className="text-amber-400" />,
      title: "Smart Compressor",
      desc: "Intelligent file size reduction for PDFs and Images. Set your target KB.",
      gradient: "from-amber-500/20 to-orange-600/20",
      border: "border-amber-500/30 hover:border-amber-400"
    },
    {
      id: ToolType.SCANNER,
      icon: <ScanLine size={32} className="text-cyan-400" />,
      title: "AI Scanner & OCR",
      desc: "Enhance document visibility and extract data using Gemini 2.5 AI.",
      gradient: "from-cyan-500/20 to-blue-600/20",
      border: "border-cyan-500/30 hover:border-cyan-400"
    },
    {
      id: ToolType.CONVERTER,
      icon: <RefreshCcw size={32} className="text-fuchsia-400" />,
      title: "Universal Converter",
      desc: "Transform Images to PDF and PDFs to Images instantly.",
      gradient: "from-fuchsia-500/20 to-purple-600/20",
      border: "border-fuchsia-500/30 hover:border-fuchsia-400"
    }
  ];

  return (
    <div ref={containerRef} className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-6 py-20 overflow-hidden">
      
      {/* Dynamic Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px] animate-blob mix-blend-screen"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px] animate-blob animation-delay-2000 mix-blend-screen"></div>
        <div className="absolute top-[20%] right-[20%] w-[300px] h-[300px] bg-cyan-600/20 rounded-full blur-[100px] animate-blob animation-delay-4000 mix-blend-screen"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      </div>

      <div className="max-w-5xl w-full mx-auto text-center z-10">
        
        <h1 className="hero-title text-6xl md:text-8xl font-bold tracking-tight mb-6">
          <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
            Optimize.
          </span>
          <br className="hidden md:block" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">
             Digitize. Convert.
          </span>
        </h1>
        
        <p className="hero-subtitle text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-16 leading-relaxed">
          The ultimate workspace for your documents. Compress images and PDFs to exact sizes, 
          perform AI-powered OCR scans, and convert formats with zero friction.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 perspective-1000">
          {features.map((f) => (
            <div
              key={f.id}
              onClick={() => onNavigate(f.id)}
              className={` group relative p-8 rounded-3xl bg-gradient-to-br ${f.gradient} border ${f.border} backdrop-blur-xl cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/10`}
            >
              <div className="absolute inset-0 rounded-3xl bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 flex flex-col items-start h-full">
                <div className="p-4 rounded-2xl bg-slate-950/50 border border-white/10 mb-6 group-hover:scale-110 transition-transform duration-300">
                  {f.icon}
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">{f.title}</h3>
                <p className="text-slate-400 mb-8 leading-relaxed">{f.desc}</p>
                <div className="mt-auto flex items-center text-sm font-bold text-white tracking-wide group-hover:translate-x-2 transition-transform">
                  START NOW <ArrowRight size={16} className="ml-2 text-white/70" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};