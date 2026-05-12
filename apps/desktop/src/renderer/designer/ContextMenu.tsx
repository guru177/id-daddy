import React, { useLayoutEffect, useRef, useState } from 'react';
import { useDesignerStore } from './store';
import { 
  Type, 
  Copy, 
  Trash2, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  ChevronUp, 
  ChevronDown, 
  ChevronsUp, 
  ChevronsDown,
  Scissors,
  Layers,
  Link2,
  Image as ImageIcon,
  ScanBarcode,
  ShieldAlert,
  Group,
  Ungroup,
  AlignCenter,
  Palette,
  Settings2,
  Edit3
} from 'lucide-react';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
}

export const ContextMenu = ({ x, y, onClose }: ContextMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: x, top: y });
  const [isVisible, setIsVisible] = useState(false);

  const { 
    selectedObject, 
    canvas,
    deleteSelected, 
    duplicateSelected, 
    bringForward, 
    sendBackward, 
    bringToFront, 
    sendToBack,
    groupSelected,
    ungroupSelected,
    centerObject,
    createClippingMask,
    releaseClippingMask,
    copyStyle,
    pasteStyle,
    renameLayer,
    mergeSelected,
    saveState
  } = useDesignerStore();

  useLayoutEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const padding = 12;
      let newX = x;
      let newY = y;

      // Adjust X position
      if (x + rect.width > window.innerWidth) {
        newX = window.innerWidth - rect.width - padding;
      }
      
      // Adjust Y position
      if (y + rect.height > window.innerHeight) {
        newY = window.innerHeight - rect.height - padding;
      }

      // Final boundary check
      newX = Math.max(padding, newX);
      newY = Math.max(padding, newY);

      setPos({ left: newX, top: newY });
      setIsVisible(true);
    }
  }, [x, y]);

  if (!selectedObject) return null;

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  const isGroup = selectedObject.type === 'group';
  // @ts-ignore
  const isClipped = selectedObject.isClipped;
  const canClip = canvas && canvas.getObjects().indexOf(selectedObject) > 0;

  const MenuItem = ({ icon, label, onClick, disabled = false, danger = false }: any) => (
    <button
      onClick={() => !disabled && handleAction(onClick)}
      disabled={disabled}
      className={`w-full flex items-center gap-3 px-4 py-2 text-[11px] font-bold transition-colors ${
        disabled ? 'opacity-20 cursor-not-allowed' : 
        danger ? 'text-red-500 hover:bg-red-50' : 'text-gray-900 hover:bg-blue-50 hover:text-blue-600'
      }`}
    >
      <div className="shrink-0">{icon}</div>
      <span className="flex-1 text-left">{label}</span>
    </button>
  );

  const Separator = () => <div className="my-1 border-t border-gray-100" />;

  return (
    <>
      <div 
        className="fixed inset-0 z-[100]" 
        onClick={onClose} 
        onContextMenu={(e) => { e.preventDefault(); onClose(); }} 
      />
      <div 
        ref={menuRef}
        className={`fixed z-[101] w-56 bg-white rounded-xl  border border-gray-100 py-1.5 transition-opacity duration-75 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        style={{ left: pos.left, top: pos.top }}
      >
        {/* Group 1: Basic Management */}
        <MenuItem icon={<Edit3 size={14} />} label="Rename Layer" onClick={() => {
          const name = prompt('Enter new layer name:', (selectedObject as any).customName || '');
          if (name) renameLayer((selectedObject as any).id, name);
        }} />
        <MenuItem icon={<Copy size={14} />} label="Duplicate Layer" onClick={duplicateSelected} />
        <MenuItem icon={<Trash2 size={14} />} label="Delete Layer" onClick={() => {
          if ((selectedObject as any).placeholder) {
            if (confirm('This layer is linked to a database field. Are you sure you want to delete it?')) deleteSelected();
          } else {
            deleteSelected();
          }
        }} danger />
        <MenuItem 
          icon={selectedObject.visible ? <EyeOff size={14} /> : <Eye size={14} />} 
          label={selectedObject.visible ? 'Hide Layer' : 'Show Layer'} 
          onClick={() => { selectedObject.visible = !selectedObject.visible; canvas?.renderAll(); saveState(); }} 
        />
        <MenuItem 
          icon={selectedObject.selectable ? <Lock size={14} /> : <Unlock size={14} />} 
          label={selectedObject.selectable ? 'Lock Layer' : 'Unlock Layer'} 
          onClick={() => { 
            selectedObject.selectable = !selectedObject.selectable; 
            selectedObject.evented = selectedObject.selectable;
            canvas?.discardActiveObject();
            canvas?.renderAll(); 
            saveState(); 
          }} 
        />

        <Separator />

        {/* Group 2: Z-Order */}
        <MenuItem icon={<ChevronsUp size={14} />} label="Bring to Front" onClick={bringToFront} />
        <MenuItem icon={<ChevronUp size={14} />} label="Bring Forward" onClick={bringForward} />
        <MenuItem icon={<ChevronDown size={14} />} label="Send Backward" onClick={sendBackward} />
        <MenuItem icon={<ChevronsDown size={14} />} label="Send to Back" onClick={sendToBack} />

        <Separator />

        {/* Group 3: Masking */}
        <MenuItem 
          icon={<Scissors size={14} />} 
          label="Create Clipping Mask" 
          onClick={createClippingMask} 
          disabled={!canClip || isClipped}
        />
        <MenuItem 
          icon={<Layers size={14} />} 
          label="Release Clipping Mask" 
          onClick={releaseClippingMask} 
          disabled={!isClipped}
        />

        <Separator />

        {/* Group 4: ID Specific */}
        <MenuItem icon={<Link2 size={14} />} label="Link to Database Field..." onClick={() => alert('Linking functionality will be available after database integration.')} />
        <MenuItem icon={<ImageIcon size={14} />} label="Convert to Photo Placeholder" onClick={() => {
          (selectedObject as any).variableType = 'image';
          (selectedObject as any).placeholder = '{{photo}}';
          canvas?.renderAll();
          saveState();
        }} />
        <MenuItem icon={<ScanBarcode size={14} />} label="Convert to Barcode / QR" onClick={() => {
          (selectedObject as any).placeholder = '{{barcode}}';
          canvas?.renderAll();
          saveState();
        }} />
        
        {/* Security Submenu Placeholder */}
        <div className="relative group/sub">
          <button className="w-full flex items-center gap-3 px-4 py-2 text-[11px] font-bold text-gray-900 hover:bg-blue-50 hover:text-blue-600 transition-colors">
            <ShieldAlert size={14} />
            <span className="flex-1 text-left">Set as Security Layer</span>
            <ChevronUp size={12} className="rotate-90 opacity-40" />
          </button>
          <div className="hidden group-hover/sub:block absolute left-full top-0 w-48 bg-white rounded-xl  border border-gray-100 py-1.5 -ml-1">
             <MenuItem label="UV Fluorescent" onClick={() => {}} />
             <MenuItem label="Holographic Overlay" onClick={() => {}} />
             <MenuItem label="Non-Printing Guide" onClick={() => {}} />
          </div>
        </div>

        <Separator />

        {/* Group 5: Grouping & Alignment */}
        <MenuItem icon={<Group size={14} />} label="Group Layers" onClick={groupSelected} disabled={canvas && canvas.getActiveObjects().length <= 1} />
        <MenuItem icon={<Layers size={14} />} label="Merge Layers (Flatten)" onClick={mergeSelected} disabled={canvas && canvas.getActiveObjects().length <= 1} />
        <MenuItem icon={<Ungroup size={14} />} label="Ungroup Layers" onClick={ungroupSelected} disabled={!isGroup} />
        <MenuItem icon={<AlignCenter size={14} />} label="Center on Card" onClick={centerObject} />

        <Separator />

        {/* Group 6: Style */}
        <MenuItem icon={<Copy size={14} />} label="Copy Style" onClick={copyStyle} />
        <MenuItem icon={<Palette size={14} />} label="Paste Style" onClick={pasteStyle} disabled={!(window as any)._copiedStyle} />
        <MenuItem icon={<Settings2 size={14} />} label="Layer Properties..." onClick={() => {}} />
      </div>
    </>
  );
};
