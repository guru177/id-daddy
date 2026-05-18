import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Type, 
  Image as ImageIcon, 
  ShieldCheck, 
  Shapes, 
  SlidersHorizontal,
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Keyboard
} from 'lucide-react';
import { CardOptionsPanel, TextPanel, ImagesPanel, SecurityPanel, ShapesPanel } from './Panels';
import { useDesignerStore } from './store';

// Keyboard shortcuts reference overlay
const ShortcutOverlay = ({ onClose }: { onClose: () => void }) => {
  const shortcuts = [
    { category: 'Edit', items: [
      { keys: ['Ctrl', 'Z'], desc: 'Undo' },
      { keys: ['Ctrl', 'Shift', 'Z'], desc: 'Redo' },
      { keys: ['Ctrl', 'C'], desc: 'Copy' },
      { keys: ['Ctrl', 'X'], desc: 'Cut' },
      { keys: ['Ctrl', 'V'], desc: 'Paste' },
      { keys: ['Delete'], desc: 'Delete selected' },
      { keys: ['Ctrl', 'A'], desc: 'Select all' },
    ]},
    { category: 'Move', items: [
      { keys: ['↑↓←→'], desc: 'Nudge (1px)' },
      { keys: ['Shift', '↑↓←→'], desc: 'Nudge (10px)' },
    ]},
    { category: 'Zoom', items: [
      { keys: ['Ctrl', '+'], desc: 'Zoom in' },
      { keys: ['Ctrl', '-'], desc: 'Zoom out' },
      { keys: ['Ctrl', '0'], desc: 'Reset zoom' },
    ]},
    { category: 'Layers', items: [
      { keys: ['Ctrl', ']'], desc: 'Bring forward' },
      { keys: ['Ctrl', '['], desc: 'Send backward' },
      { keys: ['Ctrl', 'Shift', ']'], desc: 'Bring to front' },
      { keys: ['Ctrl', 'Shift', '['], desc: 'Send to back' },
    ]},
    { category: 'Other', items: [
      { keys: ['Dbl-click layer'], desc: 'Rename layer' },
      { keys: ['?'], desc: 'Show this overlay' },
    ]},
  ];

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-gray-900/50" />
      <div
        className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 w-full max-w-lg animate-in zoom-in-95 fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center">
              <Keyboard size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900">Keyboard Shortcuts</h2>
              <p className="text-xs text-gray-500 font-medium">Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono">?</kbd> to toggle</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-6">
          {shortcuts.map(({ category, items }) => (
            <div key={category}>
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">{category}</h3>
              <div className="space-y-2">
                {items.map(({ keys, desc }) => (
                  <div key={desc} className="flex items-center justify-between gap-3">
                    <span className="text-[11px] text-gray-600 font-medium flex-1">{desc}</span>
                    <div className="flex items-center gap-1">
                      {keys.map((k, i) => (
                        <React.Fragment key={i}>
                          <kbd className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-mono font-bold border border-gray-200">{k}</kbd>
                          {i < keys.length - 1 && <span className="text-[9px] text-gray-400">+</span>}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Toolbar = () => {
  const { activePanel, setActivePanel, zoom, setZoom, resetZoom } = useDesignerStore();
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Global `?` key to toggle shortcuts overlay
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === '?') setShowShortcuts(v => !v);
      if (e.key === 'Escape') setShowShortcuts(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const menuItems = [
    { id: 'card-options', label: 'Card Options', icon: CreditCard },
    { id: 'text', label: 'Text', icon: Type },
    { id: 'images', label: 'Images', icon: ImageIcon },
    { id: 'security', label: 'Security', icon: ShieldCheck },
    { id: 'shapes', label: 'Shapes', icon: Shapes },
  ];

  const renderPanel = () => {
    switch (activePanel) {
      case 'card-options': return <CardOptionsPanel />;
      case 'text': return <TextPanel setPanel={setActivePanel} />;
      case 'images': return <ImagesPanel setPanel={setActivePanel} />;
      case 'security': return <SecurityPanel />;
      case 'shapes': return <ShapesPanel />;
      default: return null;
    }
  };

  const zoomPercent = Math.round(zoom * 100);

  return (
    <>
      <div className="flex h-full bg-white relative">
        {/* Icon Rail */}
        <div className="w-[88px] flex flex-col border-r border-gray-100 items-stretch">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActivePanel(activePanel === item.id ? null : item.id)}
              className={`flex flex-col items-center justify-center py-3 transition-all relative ${
                activePanel === item.id 
                  ? 'text-green-600 bg-green-50/50' 
                  : 'text-gray-900 hover:text-gray-900'
              }`}
            >
              {activePanel === item.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500" />
              )}
              <item.icon className={`w-6 h-6 mb-2 ${activePanel === item.id ? 'opacity-100' : 'opacity-60'}`} />
              <span className="text-[10px] font-bold text-center px-1">{item.label}</span>
            </button>
          ))}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Zoom Controls at bottom of icon rail */}
          <div className="border-t border-gray-100 flex flex-col items-center py-2 gap-1">
            <button
              onClick={() => setZoom(Math.min(5, zoom + 0.1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
              title="Zoom In (Ctrl++)"
            >
              <ZoomIn size={16} />
            </button>
            <button
              onClick={resetZoom}
              className="text-[10px] font-black text-gray-600 hover:text-green-600 transition-colors tabular-nums"
              title="Reset Zoom (Ctrl+0)"
            >
              {zoomPercent}%
            </button>
            <button
              onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
              title="Zoom Out (Ctrl+-)"
            >
              <ZoomOut size={16} />
            </button>
            <button
              onClick={() => setShowShortcuts(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors mt-1"
              title="Keyboard Shortcuts (?)"
            >
              <Keyboard size={14} />
            </button>
          </div>
        </div>

        {/* Expanded Panel */}
        {activePanel && activePanel !== 'customize' && activePanel !== 'layers' && (
          <div className="w-[320px] border-r border-gray-200 flex flex-col z-10 animate-in slide-in-from-left duration-200 bg-white">
            <div className="h-14 flex items-center justify-between px-6 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900">
                {menuItems.find(m => m.id === activePanel)?.label}
              </h2>
              <button 
                onClick={() => setActivePanel(null)}
                className="text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {renderPanel()}
            </div>
          </div>
        )}
      </div>

      {/* Keyboard Shortcut Overlay */}
      {showShortcuts && <ShortcutOverlay onClose={() => setShowShortcuts(false)} />}
    </>
  );
};

export default Toolbar;
