import React, { useEffect, useRef } from 'react';
import { fabric } from 'fabric';
import { useDesignerStore } from './store';

const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
    const { setCanvas, setSelectedObject, saveState, config, side, setActivePanel, showGrid, loadTrigger } = useDesignerStore();
  
    useEffect(() => {
      if (!canvasRef.current) return;
  
      // Standard ID Card Size (300 DPI)
      const [width, height] = config.orientation === 'horizontal' ? [1013, 638] : [638, 1013];
      const bgColor = side === 'front' ? config.backgroundColorFront : config.backgroundColorBack;

      const fabricCanvas = new fabric.Canvas(canvasRef.current, {
        width,
        height,
        backgroundColor: bgColor,
        preserveObjectStacking: true,
      });

      setCanvas(fabricCanvas);

      // Helper to apply current config to canvas
      const applyConfigToCanvas = (fabricCanvas: fabric.Canvas) => {
        const bgColor = side === 'front' ? config.backgroundColorFront : config.backgroundColorBack;
        fabricCanvas.setBackgroundColor(bgColor, fabricCanvas.renderAll.bind(fabricCanvas));

        const existingPunch = fabricCanvas.getObjects().find(obj => (obj as any).name === 'slot-punch-overlay');
        if (existingPunch) fabricCanvas.remove(existingPunch);

        if (config.slotPunch !== 'none') {
          const [width, height] = config.orientation === 'horizontal' ? [1013, 638] : [638, 1013];
          const punch = new fabric.Rect({
            width: 160,
            height: 35,
            rx: 12,
            ry: 12,
            fill: '#d1d5db',
            selectable: false,
            evented: false,
            // @ts-ignore
            name: 'slot-punch-overlay',
            originX: 'center',
            originY: 'center',
            left: config.slotPunch === 'short' ? width / 2 : 30,
            top: config.slotPunch === 'short' ? 30 : height / 2,
            angle: config.slotPunch === 'long' ? 90 : 0
          });
          fabricCanvas.add(punch);
          punch.bringToFront();
        }
        fabricCanvas.renderAll();
      };

      const setupEvents = () => {
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
      };

      // Load existing data if available
      const existingData = side === 'front' ? useDesignerStore.getState().frontData : useDesignerStore.getState().backData;
      if (existingData) {
        fabricCanvas.loadFromJSON(existingData, () => {
          applyConfigToCanvas(fabricCanvas);
          setupEvents();
          saveState();
        });
      } else {
        applyConfigToCanvas(fabricCanvas);
        setupEvents();
        saveState();
      }

      // ... existing event handlers ...
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
        if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
        
        const activeObject = fabricCanvas.getActiveObject();
        const step = e.shiftKey ? 10 : 1;
        const isMac = (navigator.platform.toUpperCase().indexOf('MAC') >= 0);
        const cmd = isMac ? e.metaKey : e.ctrlKey;

        // 1. Arrow Key Movement
        if (activeObject) {
          if (e.key === 'ArrowLeft') {
            activeObject.set('left', activeObject.left! - step);
            e.preventDefault();
          } else if (e.key === 'ArrowRight') {
            activeObject.set('left', activeObject.left! + step);
            e.preventDefault();
          } else if (e.key === 'ArrowUp') {
            activeObject.set('top', activeObject.top! - step);
            e.preventDefault();
          } else if (e.key === 'ArrowDown') {
            activeObject.set('top', activeObject.top! + step);
            e.preventDefault();
          }
          if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
            activeObject.setCoords();
            fabricCanvas.renderAll();
            saveState();
            return;
          }
        }

        // 2. Delete / Backspace
        if (e.key === 'Delete' || e.key === 'Backspace') {
          if (activeObject && !(activeObject as any).isEditing) useDesignerStore.getState().deleteSelected();
        }

        // 3. Undo/Redo
        if (cmd && e.key.toLowerCase() === 'z') {
          e.preventDefault();
          if (e.shiftKey) useDesignerStore.getState().redo();
          else useDesignerStore.getState().undo();
        }

        // 4. Layer Ordering (Forward/Backward)
        if (cmd && e.key === ']') {
          e.preventDefault();
          if (e.shiftKey) useDesignerStore.getState().bringToFront();
          else useDesignerStore.getState().bringForward();
        }
        if (cmd && e.key === '[') {
          e.preventDefault();
          if (e.shiftKey) useDesignerStore.getState().sendToBack();
          else useDesignerStore.getState().sendBackward();
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        fabricCanvas.off('object:modified');
        fabricCanvas.off('object:added');
        fabricCanvas.off('object:removed');
        fabricCanvas.dispose();
        if (container) {
          container.removeEventListener('drop', handleDrop);
          container.removeEventListener('dragover', handleDragOver);
        }
        window.removeEventListener('keydown', handleKeyDown);
      };
    }, [side, config.orientation, loadTrigger]); // ONLY re-init on side switch or orientation change

    // EFFECT 2: Update existing canvas when config (colors, punch) changes
    useEffect(() => {
      const { canvas, side, config } = useDesignerStore.getState();
      if (!canvas) return;

      // Update Background Color
      const bgColor = side === 'front' ? config.backgroundColorFront : config.backgroundColorBack;
      canvas.setBackgroundColor(bgColor, canvas.renderAll.bind(canvas));

      // Update Slot Punch
      const existingPunch = canvas.getObjects().find(obj => (obj as any).name === 'slot-punch-overlay');
      if (existingPunch) canvas.remove(existingPunch);

      if (config.slotPunch !== 'none') {
        const [width, height] = config.orientation === 'horizontal' ? [1013, 638] : [638, 1013];
        const punch = new fabric.Rect({
          width: 160,  // Proportional to 1013px width
          height: 35,
          rx: 12,
          ry: 12,
          fill: '#d1d5db',
          selectable: false,
          evented: false,
          // @ts-ignore
          name: 'slot-punch-overlay',
          originX: 'center',
          originY: 'center',
          left: config.slotPunch === 'short' ? width / 2 : 30,
          top: config.slotPunch === 'short' ? 30 : height / 2,
          angle: config.slotPunch === 'long' ? 90 : 0
        });
        canvas.add(punch);
        punch.bringToFront();
      }
      canvas.renderAll();
    }, [config.backgroundColorFront, config.backgroundColorBack, config.slotPunch]);

  return (
    <div className="flex-1 w-full flex items-center justify-center px-4 pt-10 pb-32">
      <div 
        ref={containerRef} 
        className="bg-white shadow-2xl relative overflow-hidden transition-all" 
        style={{
          borderRadius: '3.18mm', // Standard ID corner radius
          width: config.orientation === 'horizontal' ? 'min(90vw, 700px)' : 'min(90vw, 400px)',
          aspectRatio: config.orientation === 'horizontal' ? '1.58/1' : '1/1.58',
          ... (showGrid ? {
            backgroundImage: 'linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          } : {})
        }}
      >
        <div style={{
          transform: `scale(${config.orientation === 'horizontal' ? 700/1013 : 400/638})`,
          transformOrigin: 'top left',
          width: config.orientation === 'horizontal' ? '1013px' : '638px',
          height: config.orientation === 'horizontal' ? '638px' : '1013px',
        }}>
          <canvas ref={canvasRef} />
        </div>

        
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
