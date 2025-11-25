import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ToolCompressor } from './components/ToolCompressor';
import { ToolScanner } from './components/ToolScanner';
import { ToolConverter } from './components/ToolConverter';
import { ToolType } from './types';

function App() {
  const [currentTool, setCurrentTool] = useState<ToolType>(ToolType.HOME);

  const renderContent = () => {
    switch (currentTool) {
      case ToolType.HOME:
        return <Hero onNavigate={setCurrentTool} />;
      case ToolType.COMPRESSOR:
        return <ToolCompressor />;
      case ToolType.SCANNER:
        return <ToolScanner />;
      case ToolType.CONVERTER:
        return <ToolConverter />;
      default:
        return <Hero onNavigate={setCurrentTool} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-indigo-500/30">
      <Navbar currentTool={currentTool} onNavigate={setCurrentTool} />
      <main className="animate-in fade-in duration-500">
        {renderContent()}
      </main>
      
      <footer className="py-8 text-center text-slate-600 text-sm">
        <p>&copy; 2024 OptiDocs AI. Powered by Google Gemini.</p>
      </footer>
    </div>
  );
}

export default App;
