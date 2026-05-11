import React, { useEffect, useRef } from 'react';
import { fabric } from 'fabric';
import { useDesignerStore } from './store';

const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { setCanvas, setSelectedObject, saveState, config, side, setActivePanel, showGrid, loadTrigger, zoom, setZoom, resetZoom } = useDesignerStore();

  useEffect(() => {
    if (!canvasRef.current) return;

    const [width, height] = config.orientation === 'horizontal' ? [1013, 638] : [638, 1013];
    const bgColor = side === 'front' ? config.backgroundColorFront : config.backgroundColorBack;

    // Global Modern Fabric Settings
    fabric.Object.prototype.transparentCorners = false;
    fabric.Object.prototype.cornerColor = '#ffffff';
    fabric.Object.prototype.cornerStrokeColor = '#3b82f6';
    fabric.Object.prototype.cornerSize = 10;
    fabric.Object.prototype.cornerStyle = 'circle';
    fabric.Object.prototype.borderColor = '#3b82f6';
    fabric.Object.prototype.borderDashArray = [3, 3];
    fabric.Object.prototype.padding = 10;

    // Custom Rotation Controls on corners
    const rotateIcon = "data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12 4V1L8 5L12 9V6C15.31 6 18 8.69 18 12C18 13.66 17.33 15.16 16.24 16.24L17.66 17.66C19.1 16.22 20 14.21 20 12C20 7.58 16.42 4 12 4ZM12 18C8.69 18 6 15.31 6 12C6 10.34 6.67 8.84 7.76 7.76L6.34 6.34C4.9 7.78 4 9.79 4 12C4 16.42 7.58 20 12 20V23L16 19L12 15V18Z' fill='%233B82F6'/%3E%3C/svg%3E";
    const rotateImg = document.createElement('img');
    rotateImg.src = rotateIcon;

    const renderRotateControl = (ctx: CanvasRenderingContext2D, left: number, top: number, styleOverride: any, fabricObject: fabric.Object) => {
      const size = 24;
      ctx.save();
      ctx.translate(left, top);
      ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle || 0));
      ctx.drawImage(rotateImg, -size / 2, -size / 2, size, size);
      ctx.restore();
    };

    const rotationConfig = {
      actionHandler: (fabric as any).controlsUtils.rotationWithSnapping,
      cursorStyle: 'crosshair',
      actionName: 'rotate',
      render: renderRotateControl,
      cornerSize: 24,
      withConnection: false
    };

    // @ts-ignore
    fabric.Object.prototype.controls.tr_rotate = new fabric.Control({ x: 0.5, y: -0.5, offsetY: -25, ...rotationConfig });
    // @ts-ignore
    fabric.Object.prototype.controls.tl_rotate = new fabric.Control({ x: -0.5, y: -0.5, offsetY: -25, ...rotationConfig });
    // @ts-ignore
    fabric.Object.prototype.controls.br_rotate = new fabric.Control({ x: 0.5, y: 0.5, offsetY: 25, ...rotationConfig });
    // @ts-ignore
    fabric.Object.prototype.controls.bl_rotate = new fabric.Control({ x: -0.5, y: 0.5, offsetY: 25, ...rotationConfig });
    fabric.Object.prototype.controls.mtr.visible = false;

    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: bgColor,
      preserveObjectStacking: true,
    });

    setCanvas(fabricCanvas);

    // Ref to track smart guide lines so we can remove them easily
    const guideLines: fabric.Line[] = [];

    // Helper to clear smart guides
    const clearSmartGuides = () => {
      guideLines.forEach(line => fabricCanvas.remove(line));
      guideLines.length = 0;
    };

    // Helper to draw a smart guide line
    const drawGuideLine = (type: 'h' | 'v', pos: number, color: string = '#3b82f6', isCenter: boolean = false) => {
      const line = new fabric.Line(
        type === 'h' ? [0, pos, width, pos] : [pos, 0, pos, height],
        {
          stroke: color,
          strokeWidth: isCenter ? 2 : 1,
          selectable: false,
          evented: false,
          opacity: 0.8,
          // @ts-ignore
          name: 'smart-guide',
          strokeDashArray: isCenter ? [] : [5, 5]
        }
      );
      fabricCanvas.add(line);
      guideLines.push(line);
    };

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
          // @ts-ignore
          excludeFromExport: true,
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
      fabricCanvas.on('selection:cleared', () => {
        setSelectedObject(null);
        clearSmartGuides();
      });
      fabricCanvas.on('object:modified', () => {
        clearSmartGuides();
        saveState();
      });
      fabricCanvas.on('object:added', () => saveState());
      fabricCanvas.on('object:removed', () => saveState());

      // SMART GUIDES & ALIGNMENT SNAPPING
      fabricCanvas.on('object:moving', (options) => {
        const obj = options.target;
        if (!obj) return;

        clearSmartGuides();
        const snapThreshold = 5;
        const centerSnapThreshold = 12; // Stronger, smoother magnetic pull to the center
        const canvasWidth = fabricCanvas.width!;
        const canvasHeight = fabricCanvas.height!;

        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;

        const objRect = obj.getBoundingRect();
        const objCenterX = objRect.left + objRect.width / 2;
        const objCenterY = objRect.top + objRect.height / 2;

        let snappedV = false;
        let snappedH = false;

        const isCenterV = Math.abs(objCenterX - centerX) < centerSnapThreshold;
        const isCenterH = Math.abs(objCenterY - centerY) < centerSnapThreshold;

        // 1. PERFECT CENTER PRIORITY (Smooth Magnetic Snap)
        if (isCenterV) {
          obj.set('left', obj.left! + (centerX - objCenterX));
          snappedV = true;
        }
        if (isCenterH) {
          obj.set('top', obj.top! + (centerY - objCenterY));
          snappedH = true;
        }

        if (isCenterV && isCenterH) {
          // Double cross line at exactly the same time
          drawGuideLine('v', centerX, '#ef4444', true);
          drawGuideLine('h', centerY, '#ef4444', true);
        } else {
          // Slide along single axis
          if (isCenterV) drawGuideLine('v', centerX, '#3b82f6', false);
          if (isCenterH) drawGuideLine('h', centerY, '#3b82f6', false);
        }

        obj.setCoords();

        // 2. OTHER SMART GUIDES (Only if not already snapped to center)
        const vPoints = new Set<number>([0, canvasWidth]);
        const hPoints = new Set<number>([0, canvasHeight]);

        fabricCanvas.getObjects().forEach(other => {
          if (other === obj || (other as any).name === 'smart-guide' || (other as any).name === 'slot-punch-overlay') return;
          const rect = other.getBoundingRect();
          vPoints.add(rect.left); vPoints.add(rect.left + rect.width / 2); vPoints.add(rect.left + rect.width);
          hPoints.add(rect.top); hPoints.add(rect.top + rect.height / 2); hPoints.add(rect.top + rect.height);
        });

        const { guidelines } = useDesignerStore.getState();
        guidelines.vertical.forEach(p => vPoints.add(p));
        guidelines.horizontal.forEach(p => hPoints.add(p));

        const objVPoints = [objRect.left, objCenterX, objRect.left + objRect.width];
        const objHPoints = [objRect.top, objCenterY, objRect.top + objRect.height];

        if (!snappedV) {
          for (const p of Array.from(vPoints)) {
            for (const objP of objVPoints) {
              if (Math.abs(objP - p) < snapThreshold) {
                obj.set('left', obj.left! + (p - objP));
                drawGuideLine('v', p, '#3b82f6', false);
                snappedV = true;
                break;
              }
            }
            if (snappedV) break;
          }
        }

        if (!snappedH) {
          for (const p of Array.from(hPoints)) {
            for (const objP of objHPoints) {
              if (Math.abs(objP - p) < snapThreshold) {
                obj.set('top', obj.top! + (p - objP));
                drawGuideLine('h', p, '#3b82f6', false);
                snappedH = true;
                break;
              }
            }
            if (snappedH) break;
          }
        }

        if (snappedV || snappedH) obj.setCoords();
      });
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

      // 6. Zoom
      if (cmd && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        setZoom(zoom + 0.1);
      }
      if (cmd && e.key === '-') {
        e.preventDefault();
        setZoom(zoom - 0.1);
      }
      if (cmd && e.key === '0') {
        e.preventDefault();
        resetZoom();
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

      // 5. Copy / Paste / Cut
      if (cmd && e.key.toLowerCase() === 'c') {
        if (activeObject) {
          e.preventDefault();
          activeObject.clone((cloned: any) => {
            (window as any)._fabricClipboard = cloned;
          });
        }
      }
      if (cmd && e.key.toLowerCase() === 'x') {
        if (activeObject) {
          e.preventDefault();
          activeObject.clone((cloned: any) => {
            (window as any)._fabricClipboard = cloned;
            useDesignerStore.getState().deleteSelected();
          });
        }
      }
      if (cmd && e.key.toLowerCase() === 'v') {
        const clipboard = (window as any)._fabricClipboard;
        if (clipboard) {
          e.preventDefault();
          clipboard.clone((clonedObj: any) => {
            fabricCanvas.discardActiveObject();
            clonedObj.set({
              left: clonedObj.left + 20,
              top: clonedObj.top + 20,
              evented: true,
            });
            if (clonedObj.type === 'activeSelection') {
              clonedObj.canvas = fabricCanvas;
              clonedObj.forEachObject((obj: any) => {
                fabricCanvas.add(obj);
              });
              clonedObj.setCoords();
            } else {
              fabricCanvas.add(clonedObj);
            }
            // Update clipboard position for next paste
            clipboard.top += 20;
            clipboard.left += 20;
            fabricCanvas.setActiveObject(clonedObj);
            fabricCanvas.requestRenderAll();
            saveState();
          });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      fabricCanvas.off('object:modified');
      fabricCanvas.off('object:added');
      fabricCanvas.off('object:removed');
      fabricCanvas.dispose();
      // Clear the store reference so nothing tries to use a disposed canvas
      setCanvas(null as any);
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
    <div
      ref={containerRef}
      className="w-full h-full relative"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => e.preventDefault()}
    >
      <div style={{
        transform: `scale(${(config.orientation === 'horizontal' ? 700 / 1013 : 400 / 638) * zoom})`,
        transformOrigin: 'top left',
        width: config.orientation === 'horizontal' ? '1013px' : '638px',
        height: config.orientation === 'horizontal' ? '638px' : '1013px',
        backgroundColor: '#fff',
        boxShadow: '0 0 40px rgba(0,0,0,0.1)',
        position: 'relative'
      }}>
        <canvas ref={canvasRef} />
        {showGrid && <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '10px 10px' }} />}
      </div>
    </div>
  );
};

export default Canvas;
