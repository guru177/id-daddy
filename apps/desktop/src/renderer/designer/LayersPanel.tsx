import React, { useEffect, useState } from 'react';
import { useDesignerStore } from './store';
import { fabric } from 'fabric';
import { 
  Layers, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Type, 
  Image as ImageIcon, 
  Square, 
  Circle,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  ChevronsUp,
  ChevronsDown,
  Triangle,
  Minus,
  GripVertical
} from 'lucide-react';

import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableItemProps {
  obj: any;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onToggleVisibility: (e: React.MouseEvent) => void;
  onToggleLock: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

const SortableLayerItem = ({ obj, isSelected, onSelect, onToggleVisibility, onToggleLock, onContextMenu }: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: obj.id || obj.cacheKey || Math.random().toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  const getIcon = (obj: any) => {
    const type = obj.type;
    const ph = obj.placeholder;
    if (ph === '{{barcode}}' || ph === '{{qr_code}}' || ph === '{{pdf417}}' || ph === '{{datamatrix}}') return <ImageIcon size={14} className="text-purple-500" />;
    switch (type) {
      case 'i-text':
      case 'text': return <Type size={14} className="text-blue-500" />;
      case 'image': return <ImageIcon size={14} className="text-green-500" />;
      case 'rect': return <Square size={14} className="text-orange-500" />;
      case 'circle': return <Circle size={14} className="text-orange-500" />;
      case 'triangle': return <Triangle size={14} className="text-orange-500" />;
      case 'line': return <Minus size={14} className="text-orange-500" />;
      default: return <Layers size={14} className="text-gray-500" />;
    }
  };

  const getLayerName = (obj: any) => {
    if (obj.customName) return obj.customName;
    if (obj.placeholder) return obj.placeholder.replace('{{', '').replace('}}', '').toUpperCase();
    if (obj.type === 'i-text') return obj.text?.substring(0, 20) || 'Text Layer';
    return obj.type.charAt(0).toUpperCase() + obj.type.slice(1);
  };

  // @ts-ignore
  const isClipped = obj.isClipped;

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onSelect}
      onContextMenu={onContextMenu}
      className={`group flex items-center gap-2 px-2 py-2 cursor-pointer border-b border-gray-50 transition-all ${
        isSelected 
          ? 'bg-blue-500 text-white border-blue-600 shadow-inner' 
          : 'bg-white hover:bg-gray-50'
      } ${isClipped ? 'pl-8 bg-gray-50/50' : ''}`}
    >
      {/* Clipping Indicator */}
      {isClipped && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 border-l-2 border-b-2 border-gray-300 rounded-bl" />
      )}
      {/* Drag Icon (Visual only) */}
      <div className={`p-1 ${isSelected ? 'text-white/40' : 'text-gray-300'}`}>
        <GripVertical size={14} />
      </div>

      {/* Visibility Toggle */}
      <button 
        onClick={(e) => { e.stopPropagation(); onToggleVisibility(e); }}
        className={`p-1 rounded hover:bg-black/10 transition-colors z-20 relative ${
          isSelected ? 'text-white' : 'text-gray-400'
        }`}
      >
        {obj.visible ? <Eye size={14} /> : <EyeOff size={14} className="opacity-50" />}
      </button>

      {/* Lock Toggle */}
      <button 
        onClick={(e) => { e.stopPropagation(); onToggleLock(e); }}
        className={`p-1 rounded hover:bg-black/10 transition-colors z-20 relative ${
          isSelected ? 'text-white' : 'text-gray-400'
        }`}
      >
        {obj.selectable ? <Unlock size={14} className="opacity-20" /> : <Lock size={14} className="text-orange-400" />}
      </button>

      {/* Icon & Name */}
      <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${
        isSelected ? 'bg-white/20' : 'bg-gray-100'
      }`}>
        {getIcon(obj)}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className={`text-[11px] font-bold truncate ${
          isSelected ? 'text-white' : 'text-gray-700'
        }`}>
          {getLayerName(obj)}
        </p>
      </div>
    </div>
  );
};

interface LayersPanelProps {
  onContextMenu?: (x: number, y: number) => void;
}

const LayersPanel = ({ onContextMenu }: LayersPanelProps) => {
  const { 
    canvas, 
    selectedObject, 
    setSelectedObject, 
    saveState,
    deleteSelected,
    duplicateSelected,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    mergeSelected
  } = useDesignerStore();
  const [layers, setLayers] = useState<any[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (!canvas) return;
    const updateLayers = () => {
      // Filter out system objects like the slot punch overlay
      const objects = canvas.getObjects().filter((obj: any) => obj.name !== 'slot-punch-overlay');
      
      // Ensure objects have stable unique IDs for dnd-kit
      objects.forEach((obj: any) => {
        if (!obj.id) obj.id = Math.random().toString(36).substr(2, 9);
      });
      
      // Layers list is shown in reverse order (Topmost layer at index 0)
      setLayers([...objects].reverse());
    };
    
    updateLayers();
    canvas.on('object:added', updateLayers);
    canvas.on('object:removed', updateLayers);
    canvas.on('object:modified', updateLayers);
    canvas.on('selection:created', updateLayers);
    canvas.on('selection:cleared', updateLayers);
    canvas.on('selection:updated', updateLayers);

    return () => {
      canvas.off('object:added', updateLayers);
      canvas.off('object:removed', updateLayers);
      canvas.off('object:modified', updateLayers);
      canvas.off('selection:created', updateLayers);
      canvas.off('selection:cleared', updateLayers);
      canvas.off('selection:updated', updateLayers);
    };
  }, [canvas]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !canvas) return;

    const oldIndex = layers.findIndex(l => l.id === active.id);
    const newIndex = layers.findIndex(l => l.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Reorder local state first for immediate UI feedback
    const newLayers = arrayMove(layers, oldIndex, newIndex);
    setLayers(newLayers);

    // Calculate the new absolute index in the Fabric stack
    // Visual index 0 (Top) maps to Fabric index (TotalLayers - 1)
    const targetObj = layers[oldIndex];
    const fabricNewIndex = layers.length - 1 - newIndex;
    
    // Move the object to the new position
    targetObj.moveTo(fabricNewIndex);
    
    // Ensure the slot punch stays at the very top if it exists
    const punch = canvas.getObjects().find((obj: any) => obj.name === 'slot-punch-overlay');
    if (punch) {
      punch.bringToFront();
    }

    canvas.renderAll();
    saveState();
  };

  const toggleVisibility = (e: React.MouseEvent, obj: any) => {
    e.stopPropagation();
    obj.visible = !obj.visible;
    canvas?.renderAll();
    setLayers([...layers]);
    saveState();
  };

  const toggleLock = (e: React.MouseEvent, obj: any) => {
    e.stopPropagation();
    obj.selectable = !obj.selectable;
    obj.evented = obj.selectable;
    canvas?.discardActiveObject();
    canvas?.renderAll();
    setLayers([...layers]);
    saveState();
  };

  const selectLayer = (e: React.MouseEvent, obj: any) => {
    if (!canvas) return;
    
    const isMultiSelect = e.shiftKey || e.ctrlKey || e.metaKey;
    
    if (isMultiSelect) {
      const activeObjects = canvas.getActiveObjects();
      let newSelection: fabric.Object[] = [];
      
      if (activeObjects.includes(obj)) {
        newSelection = activeObjects.filter(o => o !== obj);
      } else {
        newSelection = [...activeObjects, obj];
      }
      
      canvas.discardActiveObject();
      if (newSelection.length > 1) {
        const sel = new fabric.ActiveSelection(newSelection, { canvas });
        canvas.setActiveObject(sel);
      } else if (newSelection.length === 1) {
        canvas.setActiveObject(newSelection[0]);
      }
    } else {
      canvas.setActiveObject(obj);
    }
    
    canvas.renderAll();
    setSelectedObject(canvas.getActiveObject());
  };

  const handleContextMenu = (e: React.MouseEvent, obj: any) => {
    e.preventDefault();
    if (!canvas?.getActiveObjects().includes(obj)) {
      selectLayer(e, obj);
    }
    if (onContextMenu) {
      onContextMenu(e.clientX, e.clientY);
    }
  };

  const checkIfSelected = (obj: any) => {
    if (!selectedObject) return false;
    if (selectedObject === obj) return true;
    if (selectedObject.type === 'activeSelection') {
      // @ts-ignore
      return (selectedObject as fabric.ActiveSelection).getObjects().includes(obj);
    }
    return false;
  };

  return (
    <div className="w-64 bg-white border-l border-gray-200 flex flex-col h-full shadow-2xl z-10">
      {/* Header */}
      <div className="h-12 px-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[2px] flex items-center gap-2">
          <Layers size={14} className="text-gray-400" />
          Layers
        </h3>
        <span className="text-[10px] font-bold text-gray-300">{layers.length} Total</span>
      </div>

      {/* Layer List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar overflow-x-hidden">
        {layers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center opacity-30">
            <Layers size={32} className="mb-2" />
            <p className="text-[10px] font-bold uppercase tracking-wider">No Layers Yet</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={layers.map(l => l.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col">
                {layers.map((obj) => (
                  <SortableLayerItem
                    key={obj.id}
                    obj={obj}
                    isSelected={checkIfSelected(obj)}
                    onSelect={(e) => selectLayer(e, obj)}
                    onToggleVisibility={(e) => toggleVisibility(e, obj)}
                    onToggleLock={(e) => toggleLock(e, obj)}
                    onContextMenu={(e) => handleContextMenu(e, obj)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-2 border-t border-gray-100 bg-gray-50/50 grid grid-cols-6 gap-1">
        <button onClick={sendToBack} disabled={!selectedObject} title="Send to Back" className="p-1.5 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-gray-500 disabled:opacity-20 transition-all"><ChevronsDown size={16} /></button>
        <button onClick={sendBackward} disabled={!selectedObject} title="Send Backward" className="p-1.5 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-gray-500 disabled:opacity-20 transition-all"><ChevronDown size={16} /></button>
        <button onClick={bringForward} disabled={!selectedObject} title="Bring Forward" className="p-1.5 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-gray-500 disabled:opacity-20 transition-all"><ChevronUp size={16} /></button>
        <button onClick={bringToFront} disabled={!selectedObject} title="Bring to Front" className="p-1.5 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-gray-500 disabled:opacity-20 transition-all"><ChevronsUp size={16} /></button>
        <button onClick={duplicateSelected} disabled={!selectedObject} title="Duplicate Layer" className="p-1.5 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-gray-500 disabled:opacity-20 transition-all"><Copy size={14} /></button>
        <button onClick={mergeSelected} disabled={!canvas || canvas.getActiveObjects().length <= 1} title="Merge Layers (Flatten)" className="p-1.5 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-gray-500 disabled:opacity-20 transition-all"><Layers size={14} /></button>
        <button onClick={deleteSelected} disabled={!selectedObject} title="Delete Layer" className="p-1.5 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-red-500 disabled:opacity-20 transition-all"><Trash2 size={14} /></button>
      </div>
    </div>
  );
};

export default LayersPanel;
