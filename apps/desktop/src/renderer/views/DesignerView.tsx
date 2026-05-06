import React, { useState, useEffect } from 'react';
import Toolbar from '../designer/Toolbar';
import Canvas from '../designer/Canvas';
import { Dashboard } from '../designer/Dashboard';
import { useDesignerStore } from '../designer/store';
import { ImageLibraryModal } from '../designer/ImageLibrary';
import LayersPanel from '../designer/LayersPanel';
import { ContextMenu } from '../designer/ContextMenu';
import { 
  Undo2, 
  Redo2, 
  Download, 
  Save, 
  Plus,
  Share2,
  Grid3X3,
  FileUp,
  Settings
} from 'lucide-react';

export function DesignerView() {
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);
  const { 
    canvas, 
    undo, 
    redo, 
    history, 
    redoStack,
    side,
    setSide,
    config,
    showGrid,
    setShowGrid,
    downloadCanvas,
    saveDesign,
    newDesign
  } = useDesignerStore();

  const [view, setView] = useState<'dashboard' | 'editor'>('dashboard');
  const [activeTab, setActiveTab] = useState('Card Designer');

  const navItems = ['Get Started', 'Card Designer', 'My Designs', 'My Members'];

  if (view === 'dashboard') {
    return (
      <div className="flex flex-col h-full bg-white overflow-hidden text-gray-800">
        <header className="h-10 bg-green-50/50 border-b border-green-100 flex items-center justify-center gap-10 px-4 shrink-0">
          {navItems.map(item => (
            <button 
              key={item} 
              onClick={() => {
                setActiveTab(item);
                if (item === 'Card Designer') setView('editor');
              }}
              className={`text-[10px] font-bold h-full border-b-2 px-2 transition-all ${activeTab === item ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500'}`}
            >
              {item}
            </button>
          ))}
        </header>
        <Dashboard onSelect={() => setView('editor')} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-stone-100 overflow-hidden font-sans text-gray-800">
      {/* Top Navigation */}
      <header className="h-10 bg-green-50/50 border-b border-green-100 flex items-center justify-center gap-10 px-4 shrink-0 z-20">
        {navItems.map(item => (
          <button 
            key={item} 
            onClick={() => {
              setActiveTab(item);
              if (item === 'Get Started') setView('dashboard');
            }}
            className={`text-[10px] font-bold h-full border-b-2 px-2 transition-all ${activeTab === item ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500'}`}
          >
            {item}
          </button>
        ))}
      </header>

      {/* Utility Toolbar */}
      <div className="h-12 bg-white border-b border-gray-100 flex items-center justify-between px-6 z-10 shrink-0">
        <div className="flex items-center gap-6">
           <div className="flex items-center gap-2">
             <button onClick={undo} disabled={history.length <= 1} className="p-1.5 hover:bg-gray-50 text-gray-400 disabled:opacity-20 transition-all">
               <Undo2 size={16} />
             </button>
             <button onClick={redo} disabled={redoStack.length === 0} className="p-1.5 hover:bg-gray-50 text-gray-400 disabled:opacity-20 transition-all">
               <Redo2 size={16} />
             </button>
           </div>
           <div className="h-6 w-px bg-gray-100" />
           <div className="flex items-center gap-4 text-gray-400">
              <button 
                onClick={() => setShowGrid(!showGrid)} 
                className={`transition-all ${showGrid ? 'text-green-600' : 'hover:text-green-600'}`}
              >
                <Grid3X3 size={18} />
              </button>
              <button onClick={downloadCanvas} className="hover:text-green-600 transition-all"><Download size={18} /></button>
              <button onClick={newDesign} className="hover:text-green-600 transition-all"><Plus size={18} /></button>
              <button onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert('Project link copied to clipboard!');
              }} className="hover:text-green-600 transition-all"><Share2 size={18} /></button>
           </div>
        </div>

        <button 
          onClick={saveDesign}
          className="flex items-center gap-2 px-6 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg shadow-sm transition-all active:scale-95"
        >
          <Save size={14} />
          Save
        </button>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <Toolbar />

        {/* Editor Area */}
        <div 
          className="flex-1 flex flex-col items-center bg-stone-100 relative overflow-hidden"
          onContextMenu={(e) => {
            e.preventDefault();
            setContextMenu({ x: e.clientX, y: e.clientY });
          }}
        >
          <div className="flex-1 w-full flex items-center justify-center px-4 pt-10 pb-32">
            <Canvas />
          </div>

          {/* Side Toggle */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-md p-2 rounded-2xl border border-white shadow-2xl flex gap-2 z-10">
            <button 
              onClick={() => setSide('front')}
              className={`px-10 py-3 text-xs font-black rounded-xl transition-all ${side === 'front' ? 'bg-green-500 text-white shadow-lg scale-105' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              Front Side
            </button>
            <button 
              onClick={() => setSide('back')}
              className={`px-10 py-3 text-xs font-black rounded-xl transition-all ${side === 'back' ? 'bg-green-500 text-white shadow-lg scale-105' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              Back Side
            </button>
          </div>
        </div>

        {/* Right Sidebar: Layers */}
        <LayersPanel onContextMenu={(x, y) => setContextMenu({ x, y })} />
      </div>
      {contextMenu && (
        <ContextMenu 
          x={contextMenu.x} 
          y={contextMenu.y} 
          onClose={() => setContextMenu(null)} 
        />
      )}
      <ImageLibraryModal />
    </div>
  );
}
