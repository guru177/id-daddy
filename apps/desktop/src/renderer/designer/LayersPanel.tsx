import React, { useEffect, useState, useRef } from 'react';
import { useDesignerStore } from './store';
import { useShallow } from 'zustand/react/shallow';
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
  GripVertical,
  Undo2,
  Redo2
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
  onRename: (id: string, name: string) => void;
}

const SortableLayerItem = ({ obj, isSelected, onSelect, onToggleVisibility, onToggleLock, onContextMenu, onRename }: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: obj.id || obj.cacheKey || Math.random().toString() });

  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const renameRef = useRef<HTMLInputElement>(null);

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
      default: return <Layers size={14} className="text-gray-900" />;
    }
  };

  const getLayerName = (obj: any) => {
    if (obj.customName) return obj.customName;
    if (obj.placeholder) return obj.placeholder.replace('{{', '').replace('}}', '').toUpperCase();
    if (obj.type === 'i-text') return obj.text?.substring(0, 20) || 'Text Layer';
    return obj.type.charAt(0).toUpperCase() + obj.type.slice(1);
  };

  const startRename = () => {
    setRenameValue(obj.customName || getLayerName(obj));
    setIsRenaming(true);
    setTimeout(() => renameRef.current?.select(), 50);
  };

  const commitRename = () => {
    if (renameValue.trim()) {
      onRename(obj.id, renameValue.trim());
    }
    setIsRenaming(false);
  };

  // @ts-ignore
  const isClipped = obj.isClipped;

  useEffect(() => {
    if (isSelected) {
      // Use a slight delay to allow rendering/transitions to settle
      setTimeout(() => {
        document.getElementById(`layer-item-${obj.id}`)?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }, 50);
    }
  }, [isSelected, obj.id]);

  return (
    <div 
      id={`layer-item-${obj.id}`}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onSelect}
      onContextMenu={onContextMenu}
      className={`group flex items-center gap-2 px-2 py-2 cursor-pointer border-b border-gray-50 transition-all ${
        isSelected 
          ? 'bg-blue-500 text-white border-blue-600 ' 
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
        className={`p-1 rounded hover:bg-black/30 transition-colors z-20 relative ${
          isSelected ? 'text-white' : 'text-gray-900'
        }`}
      >
        {obj.visible ? <Eye size={14} /> : <EyeOff size={14} className="opacity-50" />}
      </button>

      {/* Lock Toggle */}
      <button 
        onClick={(e) => { e.stopPropagation(); onToggleLock(e); }}
        className={`p-1 rounded hover:bg-black/30 transition-colors z-20 relative ${
          isSelected ? 'text-white' : 'text-gray-900'
        }`}
      >
        {obj.selectable ? <Unlock size={14} className="opacity-20" /> : <Lock size={14} className="text-orange-400" />}
      </button>

      {/* Icon & Name */}
      <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${
        isSelected ? 'bg-white/90' : 'bg-gray-100'
      }`}>
        {getIcon(obj)}
      </div>
      
      <div className="flex-1 min-w-0">
        {isRenaming ? (
          <input
            ref={renameRef}
            autoFocus
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename();
              if (e.key === 'Escape') setIsRenaming(false);
              e.stopPropagation();
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full text-[11px] font-bold bg-white text-gray-900 border border-blue-400 rounded px-1 py-0.5 outline-none focus:ring-1 focus:ring-blue-400"
          />
        ) : (
          <p
            className={`text-[11px] font-bold truncate ${
              isSelected ? 'text-white' : 'text-gray-900'
            }`}
            onDoubleClick={(e) => { e.stopPropagation(); startRename(); }}
            title="Double-click to rename"
          >
            {getLayerName(obj)}
          </p>
        )}
      </div>
    </div>
  );
};

interface LayersPanelProps {
  onContextMenu?: (x: number, y: number) => void;
  hideHeader?: boolean;
}

const LayersPanel = ({ onContextMenu, hideHeader }: LayersPanelProps) => {
  const { 
    canvas, selectedObject, setSelectedObject, saveState, deleteSelected,
    duplicateSelected, bringForward, sendBackward, bringToFront, sendToBack,
    mergeSelected, renameLayer, history, redoStack, undo, redo
  } = useDesignerStore(useShallow(state => ({
    canvas: state.canvas, selectedObject: state.selectedObject, setSelectedObject: state.setSelectedObject,
    saveState: state.saveState, deleteSelected: state.deleteSelected, duplicateSelected: state.duplicateSelected,
    bringForward: state.bringForward, sendBackward: state.sendBackward, bringToFront: state.bringToFront,
    sendToBack: state.sendToBack, mergeSelected: state.mergeSelected, renameLayer: state.renameLayer,
    history: state.history, redoStack: state.redoStack, undo: state.undo, redo: state.redo
  })));
  const [layers, setLayers] = useState<any[]>([]);
  // Tracks the last non-shift-clicked layer index for range selection
  const pivotIndexRef = useRef<number>(-1);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (!canvas) return;
    const updateLayers = () => {
      // Filter out system objects like the slot punch overlay and safe zones
      const objects = canvas.getObjects().filter((obj: any) => 
        obj.name !== 'slot-punch-overlay' && 
        obj.name !== 'safe-zone-overlay' &&
        obj.name !== 'smart-guide'
      );
      
      // Ensure objects have stable unique IDs for dnd-kit
      objects.forEach((obj: any) => {
        if (!obj.id) obj.id = Math.random().toString(36).substr(2, 9);
      });
      
      // Layers list is shown in reverse order (Topmost layer at index 0)
      setLayers([...objects].reverse());
    };

    // Sync the canvas active object → store so checkIfSelected always reflects
    // multi-selections made via Shift+click on the canvas (not just the layers panel).
    const syncSelection = () => {
      setSelectedObject(canvas.getActiveObject() || null);
      updateLayers();
    };

    const clearSelection = () => {
      setSelectedObject(null);
      updateLayers();
    };
    
    updateLayers();
    canvas.on('object:added', updateLayers);
    canvas.on('object:removed', updateLayers);
    // Listen to our custom refresh event (not object:modified) to avoid feedback loop
    canvas.on('layers:refresh' as any, updateLayers);
    canvas.on('selection:created', syncSelection);
    canvas.on('selection:cleared', clearSelection);
    canvas.on('selection:updated', syncSelection);

    return () => {
      canvas.off('object:added', updateLayers);
      canvas.off('object:removed', updateLayers);
      canvas.off('layers:refresh' as any, updateLayers);
      canvas.off('selection:created', syncSelection);
      canvas.off('selection:cleared', clearSelection);
      canvas.off('selection:updated', syncSelection);
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

    const clickedIndex = layers.indexOf(obj);

    if (e.shiftKey && pivotIndexRef.current !== -1) {
      // --- RANGE selection: select everything between pivot and clicked ---
      const start = Math.min(pivotIndexRef.current, clickedIndex);
      const end   = Math.max(pivotIndexRef.current, clickedIndex);
      const rangeObjs = layers
        .slice(start, end + 1)
        .filter((o: any) => o.selectable !== false);

      canvas.discardActiveObject();
      if (rangeObjs.length > 1) {
        const sel = new fabric.ActiveSelection(rangeObjs, { canvas });
        canvas.setActiveObject(sel);
      } else if (rangeObjs.length === 1) {
        canvas.setActiveObject(rangeObjs[0]);
      }
      // pivot stays at the original anchor — don't update it
    } else if (e.ctrlKey || e.metaKey) {
      // --- TOGGLE individual layer (Ctrl/Cmd+click) ---
      const activeObjects = canvas.getActiveObjects();
      let newSelection: fabric.Object[];
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
      // Update pivot to this object for future range selects
      pivotIndexRef.current = clickedIndex;
    } else {
      // --- Normal single click ---
      canvas.setActiveObject(obj);
      pivotIndexRef.current = clickedIndex;
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
    <div className="w-full flex flex-col h-full bg-white">
      {/* Header */}
      {!hideHeader && (
        <div className="h-12 px-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
          <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-[2px] flex items-center gap-2">
            <Layers size={14} className="text-gray-900" />
            Layers
          </h3>
          <span className="text-[10px] font-bold text-gray-300">{layers.length} Total</span>
        </div>
      )}

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
                    onRename={(id, name) => renameLayer(id, name)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-2 border-t border-gray-100 bg-gray-50/50">
        {/* Undo/Redo row */}
        <div className="flex items-center gap-1 mb-1.5 pb-1.5 border-b border-gray-100">
          <button
            onClick={undo}
            disabled={history.length <= 1}
            title={`Undo (${Math.max(0, history.length - 1)} steps)`}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg hover:bg-white text-gray-900 disabled:opacity-20 transition-all text-[10px] font-bold"
          >
            <Undo2 size={13} />
            {history.length > 1 && <span className="text-[9px] bg-gray-200 rounded px-1">{history.length - 1}</span>}
          </button>
          <button
            onClick={redo}
            disabled={redoStack.length === 0}
            title={`Redo (${redoStack.length} steps)`}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg hover:bg-white text-gray-900 disabled:opacity-20 transition-all text-[10px] font-bold"
          >
            <Redo2 size={13} />
            {redoStack.length > 0 && <span className="text-[9px] bg-gray-200 rounded px-1">{redoStack.length}</span>}
          </button>
        </div>
        {/* Layer ordering & management row */}
        <div className="grid grid-cols-6 gap-1">
          <button onClick={sendToBack} disabled={!selectedObject} title="Send to Back" className="p-1.5 flex items-center justify-center rounded-lg hover:bg-white text-gray-900 disabled:opacity-20 transition-all"><ChevronsDown size={16} /></button>
          <button onClick={sendBackward} disabled={!selectedObject} title="Send Backward" className="p-1.5 flex items-center justify-center rounded-lg hover:bg-white text-gray-900 disabled:opacity-20 transition-all"><ChevronDown size={16} /></button>
          <button onClick={bringForward} disabled={!selectedObject} title="Bring Forward" className="p-1.5 flex items-center justify-center rounded-lg hover:bg-white text-gray-900 disabled:opacity-20 transition-all"><ChevronUp size={16} /></button>
          <button onClick={bringToFront} disabled={!selectedObject} title="Bring to Front" className="p-1.5 flex items-center justify-center rounded-lg hover:bg-white text-gray-900 disabled:opacity-20 transition-all"><ChevronsUp size={16} /></button>
          <button onClick={duplicateSelected} disabled={!selectedObject} title="Duplicate Layer" className="p-1.5 flex items-center justify-center rounded-lg hover:bg-white text-gray-900 disabled:opacity-20 transition-all"><Copy size={14} /></button>
          <button onClick={mergeSelected} disabled={!canvas || canvas.getActiveObjects().length <= 1} title="Merge Layers (Flatten)" className="p-1.5 flex items-center justify-center rounded-lg hover:bg-white text-gray-900 disabled:opacity-20 transition-all"><Layers size={14} /></button>
          <button onClick={deleteSelected} disabled={!selectedObject} title="Delete Layer" className="p-1.5 col-span-6 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-400 disabled:opacity-20 transition-all gap-1.5 text-[10px] font-bold"><Trash2 size={13} /> Delete Selected</button>
        </div>
      </div>
    </div>
  );
};

export default LayersPanel;
