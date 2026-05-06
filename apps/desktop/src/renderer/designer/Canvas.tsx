import React, { useEffect, useRef } from 'react';
import { fabric } from 'fabric';
import { useDesignerStore } from './store';

const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { setCanvas, setSelectedObject, saveState, config, side, setActivePanel, showGrid } = useDesignerStore();

  useEffect(() => {
    if (!canvasRef.current) return;

    const [width, height] = config.orientation === 'horizontal' ? [700, 400] : [400, 700];
    const bgColor = side === 'front' ? config.backgroundColorFront : config.backgroundColorBack;

    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: bgColor,
      preserveObjectStacking: true,
    });

    // Add Slot Punch Overlay if needed
    if (config.slotPunch !== 'none') {
      const punchWidth = 40;
      const punchHeight = 10;
      const punchRadius = 4;
      
      let left = 0;
      let top = 0;
      let angle = 0;

      if (config.slotPunch === 'short') {
        left = width / 2;
        top = 15;
      } else if (config.slotPunch === 'long') {
        left = 15;
        top = height / 2;
        angle = 90;
      }

      const punch = new fabric.Rect({
        width: punchWidth,
        height: punchHeight,
        rx: punchRadius,
        ry: punchRadius,
        fill: '#d1d5db', // tailwind gray-300
        opacity: 1,
        left,
        top,
        angle,
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false,
        // @ts-ignore
        name: 'slot-punch-overlay'
      });
      fabricCanvas.add(punch);
      punch.bringToFront();
    }

    setCanvas(fabricCanvas);
    saveState();

    fabricCanvas.on('selection:created', (e) => {
      setSelectedObject(e.selected?.[0] || null);
      if (e.selected?.[0]) setActivePanel('customize');
    });
    fabricCanvas.on('selection:updated', (e) => {
      setSelectedObject(e.selected?.[0] || null);
      if (e.selected?.[0]) setActivePanel('customize');
    });
    fabricCanvas.on('selection:cleared', () => setSelectedObject(null));
    fabricCanvas.on('object:modified', () => saveState());
    fabricCanvas.on('object:added', () => saveState());
    fabricCanvas.on('object:removed', () => saveState());

    const SNAP_THRESHOLD = 5;
    fabricCanvas.on('object:moving', (options) => {
      const obj = options.target;
      if (!obj) return;
      const centerX = fabricCanvas.width! / 2;
      const centerY = fabricCanvas.height! / 2;
      const objCenter = obj.getCenterPoint();
      if (Math.abs(objCenter.x - centerX) < SNAP_THRESHOLD) {
        obj.setPositionByOrigin(new fabric.Point(centerX, objCenter.y), 'center', 'center');
      }
      if (Math.abs(objCenter.y - centerY) < SNAP_THRESHOLD) {
        obj.setPositionByOrigin(new fabric.Point(objCenter.x, centerY), 'center', 'center');
      }
    });

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer?.getData('type');
      if (!type) return;
      const pointer = fabricCanvas.getPointer(e);
      
      switch (type) {
        case 'text':
          const text = new fabric.IText('Double click to edit', {
            left: pointer.x,
            top: pointer.y,
            fontSize: 20,
            fontFamily: 'Inter',
          });
          fabricCanvas.add(text);
          fabricCanvas.setActiveObject(text);
          break;
        case 'rect':
          const rect = new fabric.Rect({
            left: pointer.x,
            top: pointer.y,
            fill: '#3b82f6',
            width: 100,
            height: 100,
          });
          fabricCanvas.add(rect);
          fabricCanvas.setActiveObject(rect);
          break;
        case 'circle':
          const circle = new fabric.Circle({
            left: pointer.x,
            top: pointer.y,
            fill: '#ef4444',
            radius: 50,
          });
          fabricCanvas.add(circle);
          fabricCanvas.setActiveObject(circle);
          break;
      }
    };

    const handleDragOver = (e: DragEvent) => e.preventDefault();

    const container = containerRef.current;
    if (container) {
      container.addEventListener('drop', handleDrop);
      container.addEventListener('dragover', handleDragOver);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if we are typing in an input or textarea
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmd = isMac ? e.metaKey : e.ctrlKey;
      const shift = e.shiftKey;
      const alt = e.altKey;

      // 1. Delete / Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeObject = fabricCanvas.getActiveObject();
        if (activeObject && !(activeObject as any).isEditing) {
          useDesignerStore.getState().deleteSelected();
        }
      }

      // 2. Undo/Redo (Ctrl+Z, Ctrl+Shift+Z, Ctrl+Y)
      if (cmd && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (shift) useDesignerStore.getState().redo();
        else useDesignerStore.getState().undo();
      }
      if (cmd && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        useDesignerStore.getState().redo();
      }

      // 3. Copy/Paste Object (Ctrl+C, Ctrl+V)
      if (cmd && e.key.toLowerCase() === 'c' && !alt) {
        e.preventDefault();
        useDesignerStore.getState().copyObject();
      }
      if (cmd && e.key.toLowerCase() === 'v' && !alt) {
        e.preventDefault();
        useDesignerStore.getState().pasteObject();
      }

      // 4. Copy/Paste Style (Ctrl+Alt+C, Ctrl+Alt+V)
      if (cmd && alt && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        useDesignerStore.getState().copyStyle();
      }
      if (cmd && alt && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        useDesignerStore.getState().pasteStyle();
      }

      // 5. Group/Ungroup (Ctrl+G, Ctrl+Shift+G)
      if (cmd && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        if (shift) useDesignerStore.getState().ungroupSelected();
        else useDesignerStore.getState().groupSelected();
      }

      // 6. Duplicate (Ctrl+J)
      if (cmd && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        useDesignerStore.getState().duplicateSelected();
      }

      // 7. Select All (Ctrl+A)
      if (cmd && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        useDesignerStore.getState().selectAll();
      }

      // 8. Arrangement (Ctrl+[ , Ctrl+] , Ctrl+Shift+[ , Ctrl+Shift+])
      if (cmd && e.key === ']') {
        e.preventDefault();
        if (shift) useDesignerStore.getState().bringToFront();
        else useDesignerStore.getState().bringForward();
      }
      if (cmd && e.key === '[') {
        e.preventDefault();
        if (shift) useDesignerStore.getState().sendToBack();
        else useDesignerStore.getState().sendBackward();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      fabricCanvas.dispose();
      if (container) {
        container.removeEventListener('drop', handleDrop);
        container.removeEventListener('dragover', handleDragOver);
      }
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [setCanvas, setSelectedObject, saveState, config, side]);

  return (
    <div className="flex-1 w-full flex items-center justify-center px-4 pt-10 pb-32">
      <div 
        ref={containerRef} 
        className="bg-white shadow-2xl relative" 
      >
        <canvas ref={canvasRef} />
        
        {/* Grid Overlay - pointer-events-none ensures it doesn't block clicks */}
        {showGrid && (
          <div 
            className="absolute inset-0 pointer-events-none transition-opacity duration-300"
            style={{
              backgroundImage: `
                linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px',
              opacity: 0.6
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Canvas;
