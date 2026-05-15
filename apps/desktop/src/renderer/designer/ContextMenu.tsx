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
  AlignLeft,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  Palette,
  Settings2,
  Edit3,
  LayoutGrid
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
    saveState,
    showModal,
    showInputModal,
  } = useDesignerStore();

  useLayoutEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const padding = 12;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // Natural position
      let newX = x;
      let newY = y;

      // Clamp X — if it overflows right, flip to left of cursor
      if (newX + rect.width > vw - padding) {
        newX = Math.max(padding, vw - rect.width - padding);
      }

      // Clamp Y — if the menu bottom exceeds viewport, push up.
      // The menu's rendered height may be taller than the viewport;
      // in that case pin to top with padding (scroll handles the rest).
      const menuH = Math.min(rect.height, vh - padding * 2);
      if (newY + menuH > vh - padding) {
        newY = Math.max(padding, vh - menuH - padding);
      }

      // Final safety clamp
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
  const isMultiSelect = canvas && canvas.getActiveObjects().length > 1;
  // @ts-ignore
  const isClipped = selectedObject.isClipped;
  const canClip = canvas && canvas.getObjects().indexOf(selectedObject) > 0;

  // Alignment helpers (relative to canvas center, safe-margin aware)
  const alignObject = (alignType: string) => {
    if (!canvas || !selectedObject) return;
    const cw = canvas.width!;
    const ch = canvas.height!;
    const obj = selectedObject;

    // Respect the safe margin if the guide is enabled
    const { config: cfg, showSafeZones } = useDesignerStore.getState();
    const margin = showSafeZones ? (cfg.safeMargin ?? 25) : 0;

    switch (alignType) {
      case 'left':
        obj.set({ left: margin, originX: 'left' });
        break;
      case 'center-h':
        obj.set({ left: cw / 2, originX: 'center' });
        break;
      case 'right':
        obj.set({ left: cw - margin, originX: 'right' });
        break;
      case 'top':
        obj.set({ top: margin, originY: 'top' });
        break;
      case 'center-v':
        obj.set({ top: ch / 2, originY: 'center' });
        break;
      case 'bottom':
        obj.set({ top: ch - margin, originY: 'bottom' });
        break;
    }

    obj.setCoords();
    canvas.renderAll();
    saveState();
  };

  const MenuItem = ({ icon, label, onClick, disabled = false, danger = false, shortcut }: any) => (
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
      {shortcut && <span className="text-[9px] text-gray-400 font-normal">{shortcut}</span>}
    </button>
  );

  const Separator = () => <div className="my-1 border-t border-gray-100" />;
  const SectionLabel = ({ label }: { label: string }) => (
    <div className="px-4 pt-2 pb-0.5">
      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
    </div>
  );

  return (
    <>
      <div 
        className="fixed inset-0 z-[100]" 
        onClick={onClose} 
        onContextMenu={(e) => { e.preventDefault(); onClose(); }} 
      />
      <div 
        ref={menuRef}
        className={`fixed z-[101] w-60 bg-white rounded-xl shadow-2xl border border-gray-100 py-1.5 transition-opacity duration-75 overflow-y-auto custom-scrollbar ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        style={{ left: pos.left, top: pos.top, maxHeight: 'calc(100vh - 24px)' }}
      >
        {/* Group 1: Basic Management */}
        <SectionLabel label="Layer" />
        <MenuItem icon={<Edit3 size={14} />} label="Rename Layer" shortcut="Dbl-click" onClick={() => {
          showInputModal({
            title: 'Rename Layer',
            message: 'Enter a new name for this layer.',
            defaultValue: (selectedObject as any).customName || '',
            placeholder: 'Layer name...',
            onConfirmWithValue: (name) => {
              if (name.trim()) renameLayer((selectedObject as any).id, name.trim());
            }
          });
        }} />
        <MenuItem icon={<Copy size={14} />} label="Duplicate Layer" shortcut="Ctrl+D" onClick={duplicateSelected} />
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
        <MenuItem icon={<Trash2 size={14} />} label="Delete Layer" shortcut="Del" onClick={() => {
          if ((selectedObject as any).placeholder) {
            showModal({
              title: 'Delete Variable Layer',
              message: 'This layer is linked to a database field. Are you sure you want to delete it?',
              type: 'confirm',
              onConfirm: () => deleteSelected()
            });
          } else {
            deleteSelected();
          }
        }} danger />

        <Separator />

        {/* Group 2: Z-Order */}
        <SectionLabel label="Arrange" />
        <MenuItem icon={<ChevronsUp size={14} />} label="Bring to Front" shortcut="Ctrl+Shift+]" onClick={bringToFront} />
        <MenuItem icon={<ChevronUp size={14} />} label="Bring Forward" shortcut="Ctrl+]" onClick={bringForward} />
        <MenuItem icon={<ChevronDown size={14} />} label="Send Backward" shortcut="Ctrl+[" onClick={sendBackward} />
        <MenuItem icon={<ChevronsDown size={14} />} label="Send to Back" shortcut="Ctrl+Shift+[" onClick={sendToBack} />

        <Separator />

        {/* Group 3: Alignment */}
        <SectionLabel label="Align on Card" />
        <div className="flex items-center justify-between px-3 py-1.5 gap-1">
          {[
            { title: 'Align Left', icon: <AlignLeft size={14} />, align: 'left' },
            { title: 'Center Horizontally', icon: <AlignCenter size={14} />, align: 'center-h' },
            { title: 'Align Right', icon: <AlignRight size={14} />, align: 'right' },
            { title: 'Align Top', icon: <AlignStartVertical size={14} />, align: 'top' },
            { title: 'Center Vertically', icon: <AlignCenterVertical size={14} />, align: 'center-v' },
            { title: 'Align Bottom', icon: <AlignEndVertical size={14} />, align: 'bottom' },
          ].map(({ title, icon, align }) => (
            <button
              key={align}
              title={title}
              onClick={() => handleAction(() => alignObject(align))}
              className="flex-1 p-1.5 flex items-center justify-center rounded hover:bg-blue-50 hover:text-blue-600 text-gray-600 transition-colors"
            >
              {icon}
            </button>
          ))}
        </div>
        <MenuItem icon={<LayoutGrid size={14} />} label="Center on Card" onClick={centerObject} />

        <Separator />

        {/* Group 4: Masking */}
        <SectionLabel label="Masking" />
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

        {/* Group 5: ID Specific */}
        <SectionLabel label="Variable Data" />
        <MenuItem icon={<ImageIcon size={14} />} label="Set as Photo Placeholder" onClick={() => {
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
        
        {/* Security Submenu */}
        <div className="relative group/sub">
          <button className="w-full flex items-center gap-3 px-4 py-2 text-[11px] font-bold text-gray-900 hover:bg-blue-50 hover:text-blue-600 transition-colors">
            <ShieldAlert size={14} />
            <span className="flex-1 text-left">Set as Security Layer</span>
            <ChevronUp size={12} className="rotate-90 opacity-40" />
          </button>
          <div className="hidden group-hover/sub:block absolute left-full top-0 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 -ml-1">
             <MenuItem label="UV Fluorescent" onClick={() => {}} />
             <MenuItem label="Holographic Overlay" onClick={() => {}} />
             <MenuItem label="Non-Printing Guide" onClick={() => {}} />
          </div>
        </div>

        <Separator />

        {/* Group 6: Grouping */}
        <SectionLabel label="Group" />
        <MenuItem icon={<Group size={14} />} label="Group Layers" shortcut="Ctrl+G" onClick={groupSelected} disabled={!isMultiSelect} />
        <MenuItem icon={<Layers size={14} />} label="Merge Layers (Flatten)" onClick={mergeSelected} disabled={!isMultiSelect} />
        <MenuItem icon={<Ungroup size={14} />} label="Ungroup Layers" onClick={ungroupSelected} disabled={!isGroup} />

        <Separator />

        {/* Group 7: Style */}
        <SectionLabel label="Style" />
        <MenuItem icon={<Copy size={14} />} label="Copy Style" onClick={copyStyle} />
        <MenuItem icon={<Palette size={14} />} label="Paste Style" onClick={pasteStyle} disabled={!(window as any)._copiedStyle} />
      </div>
    </>
  );
};
