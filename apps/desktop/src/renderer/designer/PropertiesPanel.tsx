import React, { useEffect, useState } from 'react';
import { useDesignerStore } from './store';
import { 
  Type, 
  Move, 
  RotateCcw, 
  Layers, 
  Lock, 
  Unlock, 
  Trash2, 
  Copy,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic
} from 'lucide-react';

const PropertiesPanel = () => {
  const { 
    selectedObject, 
    canvas, 
    saveState, 
    deleteSelected, 
    duplicateSelected,
    bringForward,
    sendBackward 
  } = useDesignerStore();
  
  const [props, setProps] = useState<any>({});

  useEffect(() => {
    if (selectedObject) {
      const updateProps = () => {
        setProps({
          left: Math.round(selectedObject.left || 0),
          top: Math.round(selectedObject.top || 0),
          width: Math.round((selectedObject.width || 0) * (selectedObject.scaleX || 1)),
          height: Math.round((selectedObject.height || 0) * (selectedObject.scaleY || 1)),
          angle: Math.round(selectedObject.angle || 0),
          opacity: selectedObject.opacity || 1,
          fill: selectedObject.fill || '#000000',
          fontSize: (selectedObject as any).fontSize || 20,
          fontFamily: (selectedObject as any).fontFamily || 'Inter',
          fontWeight: (selectedObject as any).fontWeight || 'normal',
          fontStyle: (selectedObject as any).fontStyle || 'normal',
          textAlign: (selectedObject as any).textAlign || 'left',
          lockMovementX: selectedObject.lockMovementX,
        });
      };

      updateProps();
      selectedObject.on('moving', updateProps);
      selectedObject.on('scaling', updateProps);
      selectedObject.on('rotating', updateProps);

      return () => {
        selectedObject.off('moving', updateProps);
        selectedObject.off('scaling', updateProps);
        selectedObject.off('rotating', updateProps);
      };
    }
  }, [selectedObject]);

  if (!selectedObject) {
    return (
      <div className="w-72 bg-white border-l border-stone-200 p-6 flex flex-col items-center justify-center text-stone-900">
        <Layers className="w-12 h-12 mb-4 opacity-20" />
        <p className="text-sm font-medium">Select element to edit</p>
      </div>
    );
  }

  const updateSelected = (key: string, value: any) => {
    if (!selectedObject || !canvas) return;
    if (key === 'width') {
      selectedObject.set('scaleX', value / (selectedObject.width || 1));
    } else if (key === 'height') {
      selectedObject.set('scaleY', value / (selectedObject.height || 1));
    } else {
      selectedObject.set(key as any, value);
    }
    canvas.requestRenderAll();
    setProps({ ...props, [key]: value });
    saveState();
  };

  const isText = selectedObject.type === 'i-text' || selectedObject.type === 'text';

  return (
    <div className="w-72 bg-white border-l border-stone-200 flex flex-col overflow-y-auto">
      <div className="p-4 border-b border-stone-100 flex items-center justify-between">
        <h2 className="font-semibold text-stone-900 capitalize">{selectedObject.type}</h2>
        <div className="flex gap-1">
          <button onClick={duplicateSelected} className="p-2 hover:bg-stone-50 rounded text-stone-900"><Copy size={16} /></button>
          <button onClick={deleteSelected} className="p-2 hover:bg-red-50 rounded text-red-500"><Trash2 size={16} /></button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        <section>
          <h3 className="text-[10px] font-bold text-stone-900 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Move size={12} /> Transform
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-stone-900 mb-1 block">X</label>
              <input type="number" value={props.left || 0} onChange={(e) => updateSelected('left', parseInt(e.target.value))} className="w-full px-2 py-1.5 border border-stone-200 rounded text-xs focus:ring-1 focus:ring-mint outline-none" />
            </div>
            <div>
              <label className="text-[10px] text-stone-900 mb-1 block">Y</label>
              <input type="number" value={props.top || 0} onChange={(e) => updateSelected('top', parseInt(e.target.value))} className="w-full px-2 py-1.5 border border-stone-200 rounded text-xs focus:ring-1 focus:ring-mint outline-none" />
            </div>
          </div>
        </section>

        {isText && (
          <section className="border-t border-stone-100 pt-6">
            <h3 className="text-[10px] font-bold text-stone-900 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Type size={12} /> Typography
            </h3>
            <div className="space-y-3">
              <select value={props.fontFamily} onChange={(e) => updateSelected('fontFamily', e.target.value)} className="w-full px-2 py-1.5 border border-stone-200 rounded text-xs outline-none">
                <option value="Inter">Inter</option>
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times New Roman</option>
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" value={props.fontSize} onChange={(e) => updateSelected('fontSize', parseInt(e.target.value))} className="px-2 py-1.5 border border-stone-200 rounded text-xs" />
                <input type="color" value={props.fill} onChange={(e) => updateSelected('fill', e.target.value)} className="w-full h-8 px-1 py-1 border border-stone-200 rounded cursor-pointer" />
              </div>
              <div className="flex gap-1">
                <button onClick={() => updateSelected('fontWeight', props.fontWeight === 'bold' ? 'normal' : 'bold')} className={`flex-1 p-2 border border-stone-200 rounded ${props.fontWeight === 'bold' ? 'bg-teal-50 text-mint' : ''}`}><Bold size={16} /></button>
                <button onClick={() => updateSelected('fontStyle', props.fontStyle === 'italic' ? 'normal' : 'italic')} className={`flex-1 p-2 border border-stone-200 rounded ${props.fontStyle === 'italic' ? 'bg-teal-50 text-mint' : ''}`}><Italic size={16} /></button>
              </div>
            </div>
          </section>
        )}

        <section className="border-t border-stone-100 pt-6">
          <h3 className="text-[10px] font-bold text-stone-900 uppercase tracking-widest mb-3">Arrange</h3>
          <div className="grid grid-cols-1 gap-2">
            <button onClick={bringForward} className="px-3 py-2 border border-stone-200 rounded text-xs font-medium hover:bg-stone-50">Bring Forward</button>
            <button onClick={sendBackward} className="px-3 py-2 border border-stone-200 rounded text-xs font-medium hover:bg-stone-50">Send Backward</button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PropertiesPanel;
