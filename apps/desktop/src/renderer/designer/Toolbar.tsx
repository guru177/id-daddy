import React, { useState } from 'react';
import { 
  CreditCard, 
  Type, 
  Image as ImageIcon, 
  ShieldCheck, 
  Shapes, 
  Watch, 
  SlidersHorizontal,
  X
} from 'lucide-react';
import { CardOptionsPanel, TextPanel, CustomizePanel, ImagesPanel, SecurityPanel, ShapesPanel } from './Panels';
import { useDesignerStore } from './store';

const Toolbar = () => {
  const { activePanel, setActivePanel } = useDesignerStore();

  const menuItems = [
    { id: 'card-options', label: 'Card Options', icon: CreditCard },
    { id: 'text', label: 'Text', icon: Type },
    { id: 'images', label: 'Images', icon: ImageIcon },
    { id: 'security', label: 'Security', icon: ShieldCheck },
    { id: 'shapes', label: 'Shapes', icon: Shapes },
    { id: 'customize', label: 'Customize', icon: SlidersHorizontal },
  ];

  const renderPanel = () => {
    switch (activePanel) {
      case 'card-options': return <CardOptionsPanel />;
      case 'text': return <TextPanel setPanel={setActivePanel} />;
      case 'images': return <ImagesPanel setPanel={setActivePanel} />;
      case 'security': return <SecurityPanel />;
      case 'shapes': return <ShapesPanel />;
      case 'customize': return <CustomizePanel />;
      default: return <div className="text-center text-gray-400 mt-10 italic">Panel coming soon...</div>;
    }
  };

  return (
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
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {activePanel === item.id && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500" />
            )}
            <item.icon className={`w-6 h-6 mb-2 ${activePanel === item.id ? 'opacity-100' : 'opacity-60'}`} />
            <span className="text-[10px] font-bold text-center px-1">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Expanded Panel */}
      {activePanel && (
        <div className="w-[320px] border-r border-gray-200 flex flex-col shadow-2xl z-10 animate-in slide-in-from-left duration-200">
          <div className="h-14 flex items-center justify-between px-6 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-800">
              {menuItems.find(m => m.id === activePanel)?.label}
            </h2>
            <button 
              onClick={() => setActivePanel(null)}
              className="text-gray-400 hover:text-gray-600"
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
  );
};

export default Toolbar;
