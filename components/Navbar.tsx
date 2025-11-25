import React from 'react';
import { Layers } from 'lucide-react';
import { ToolType } from '../types';

interface NavbarProps {
  currentTool: ToolType;
  onNavigate: (tool: ToolType) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTool, onNavigate }) => {
  return (
    <nav className="w-full border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div 
          onClick={() => onNavigate(ToolType.HOME)}
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-white">
            <Layers size={20} />
          </div>
          <span className="font-bold text-lg tracking-tight text-white">OptiDocs <span className="text-indigo-400">AI</span></span>
        </div>

        <div className="flex gap-1 md:gap-4">
          <NavButton 
            active={currentTool === ToolType.COMPRESSOR} 
            onClick={() => onNavigate(ToolType.COMPRESSOR)}
            label="Compress"
          />
          <NavButton 
            active={currentTool === ToolType.SCANNER} 
            onClick={() => onNavigate(ToolType.SCANNER)}
            label="Scan AI"
          />
          <NavButton 
            active={currentTool === ToolType.CONVERTER} 
            onClick={() => onNavigate(ToolType.CONVERTER)}
            label="Convert"
          />
        </div>
      </div>
    </nav>
  );
};

const NavButton = ({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      active 
        ? 'bg-slate-800 text-white shadow-lg shadow-indigo-500/10 border border-slate-700' 
        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
    }`}
  >
    {label}
  </button>
);
