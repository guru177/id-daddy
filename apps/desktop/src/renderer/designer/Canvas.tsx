import React, { useEffect, useRef } from 'react';
import { fabric } from 'fabric';
import { useDesignerStore } from './store';

const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { setCanvas, setSelectedObject, saveState, config, side, setActivePanel, showGrid, showSafeZones, loadTrigger, zoom, setZoom, resetZoom } = useDesignerStore();

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
    (fabric.Object.prototype as any).borderDashArray = null; // solid selection border
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

    const PADDING = 300;
    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: width + PADDING * 2,
      height: height + PADDING * 2,
      preserveObjectStacking: true,
      controlsAboveOverlay: true,
    });

    fabricCanvas.setViewportTransform([1, 0, 0, 1, PADDING, PADDING]);
    
    const wrapperEl = (fabricCanvas as any).wrapperEl as HTMLElement | undefined;
    if (wrapperEl) {
      wrapperEl.style.position = 'absolute';
      wrapperEl.style.left = `-${PADDING}px`;
      wrapperEl.style.top = `-${PADDING}px`;
    }

    const originalToDataURL = fabricCanvas.toDataURL.bind(fabricCanvas);
    fabricCanvas.toDataURL = (options: any) => {
       return originalToDataURL({
          left: PADDING,
          top: PADDING,
          width: width,
          height: height,
          ...(options || {})
       });
    };

    setCanvas(fabricCanvas);

    // Tracks all transient overlay objects (snap guides + distance indicators)
    const guideLines: fabric.Object[] = [];

    // Helper to clear all transient overlays
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

    // Photoshop/Figma-style distance indicator:
    // draws a dimension line (with tick marks + px label) between two points.
    const drawDistanceLine = (x1: number, y1: number, x2: number, y2: number) => {
      const isHoriz = Math.abs(y2 - y1) < 0.5;
      const dist = Math.round(Math.abs(isHoriz ? x2 - x1 : y2 - y1));
      if (dist < 2) return;

      const COLOR = '#e11d48';
      const TICK = 5;
      const addObj = (o: fabric.Object) => { fabricCanvas.add(o); guideLines.push(o); };

      // Main gap line
      addObj(new fabric.Line([x1, y1, x2, y2], {
        stroke: COLOR, strokeWidth: 1.5, selectable: false, evented: false,
        // @ts-ignore
        name: 'smart-guide'
      }));
      // Start tick
      addObj(new fabric.Line(
        isHoriz ? [x1, y1 - TICK, x1, y1 + TICK] : [x1 - TICK, y1, x1 + TICK, y1],
        { stroke: COLOR, strokeWidth: 1.5, selectable: false, evented: false, name: 'smart-guide' as any }
      ));
      // End tick
      addObj(new fabric.Line(
        isHoriz ? [x2, y2 - TICK, x2, y2 + TICK] : [x2 - TICK, y2, x2 + TICK, y2],
        { stroke: COLOR, strokeWidth: 1.5, selectable: false, evented: false, name: 'smart-guide' as any }
      ));
      // Distance label
      const label = new fabric.Text(`${dist}px`, {
        left: (x1 + x2) / 2,
        top:  (y1 + y2) / 2,
        fontSize: 9,
        fontFamily: 'Inter, system-ui, sans-serif',
        fill: '#ffffff',
        backgroundColor: COLOR,
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false,
        padding: 3,
        // @ts-ignore
        name: 'smart-guide',
      });
      addObj(label);
    };

    // Helper to apply current config to canvas
    const applyConfigToCanvas = (fabricCanvas: fabric.Canvas) => {
      // Set background color on the fabric canvas itself so thumbnails/exports are correct
      const bgColor = side === 'front' ? config.backgroundColorFront : config.backgroundColorBack;
      fabricCanvas.setBackgroundColor(bgColor, fabricCanvas.renderAll.bind(fabricCanvas));

      const [width, height] = config.orientation === 'horizontal' ? [1013, 638] : [638, 1013];

      // Clip objects strictly to the card dimensions so they don't leak into the padded area
      fabricCanvas.clipPath = new fabric.Rect({
        left: 0,
        top: 0,
        width: width,
        height: height,
        absolutePositioned: true
      });

      // Remove previous overlays
      fabricCanvas.getObjects().forEach(obj => {
        if ((obj as any).name === 'slot-punch-overlay' || (obj as any).name === 'safe-zone-overlay') {
          fabricCanvas.remove(obj);
        }
      });

      // Safe Zone Indicator (3mm margin roughly 35px at this resolution)
      const { showSafeZones, config: currentConfig } = useDesignerStore.getState();
      if (showSafeZones) {
        const margin = currentConfig.safeMargin ?? 25; 
        const safeZone = new fabric.Rect({
          left: margin,
          top: margin,
          width: width - margin * 2,
          height: height - margin * 2,
          fill: 'transparent',
          stroke: '#f43f5e',
          strokeWidth: 1,
          strokeDashArray: [10, 5],
          selectable: false,
          evented: false,
          // @ts-ignore
          name: 'safe-zone-overlay',
          // @ts-ignore
          excludeFromExport: true
        });
        fabricCanvas.add(safeZone);
        safeZone.bringToFront();
      }

      if (config.slotPunch !== 'none') {
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
        // Use getActiveObject() to capture the full ActiveSelection for multi-select,
        // not just e.selected[0] which only returns one of the newly selected objects.
        const active = fabricCanvas.getActiveObject();
        setSelectedObject(active || null);
        const state = useDesignerStore.getState();
        if (active && state.activeRightPanel !== 'layers') {
          state.setActiveRightPanel('customize');
        }
      });
      fabricCanvas.on('selection:updated', (e) => {
        const active = fabricCanvas.getActiveObject();
        setSelectedObject(active || null);
        const state = useDesignerStore.getState();
        if (active && state.activeRightPanel !== 'layers') {
          state.setActiveRightPanel('customize');
        }
      });
      fabricCanvas.on('selection:cleared', () => {
        setSelectedObject(null);
        clearSmartGuides();
      });
      fabricCanvas.on('object:modified', () => {
        clearSmartGuides();
        saveState();
      });
      // layers:refresh is fired by saveState() to avoid the
      // object:modified → saveState() feedback loop
      fabricCanvas.on('layers:refresh' as any, () => {});

      // Re-apply non-serialized overlays (safe zone, slot punch) after undo/redo
      fabricCanvas.on('overlays:reapply' as any, () => {
        applyConfigToCanvas(fabricCanvas);
      });

      // Only save history for real user objects — NOT system overlays or smart guides.
      // Smart guide lines are added/removed on every mouse-move tick during a drag;
      // without this guard each guide draw/clear would create a separate undo entry.
      const isSystemObject = (obj: any) =>
        obj?.name === 'smart-guide' ||
        obj?.name === 'slot-punch-overlay' ||
        obj?.name === 'safe-zone-overlay';

      fabricCanvas.on('object:added', (e: any) => {
        if (isSystemObject(e.target)) return;
        saveState();

        // Auto-enable backside printing when content is first added to the back canvas.
        // This prevents the design from showing as BLANK in previews/downloads even
        // when the user has clearly edited the back side.
        if (side === 'back') {
          const { config: currentConfig, setConfig } = useDesignerStore.getState();
          if (currentConfig.backsidePrinting === 'none') {
            setConfig({ backsidePrinting: 'color' });
          }
        }
      });
      fabricCanvas.on('object:removed', (e: any) => {
        if (isSystemObject(e.target)) return;
        saveState();
      });

      // Guaranteed guide cleanup on every mouse release.
      // object:modified doesn't always fire (e.g. when object snaps back to
      // its starting position), which leaves guide lines stuck on the canvas.
      // mouse:up always fires, so we use it as the definitive cleanup point.
      fabricCanvas.on('mouse:up', () => {
        if (movingRafId !== null) { cancelAnimationFrame(movingRafId); movingRafId = null; }
        clearSmartGuides();
        fabricCanvas.requestRenderAll();
      });

    let movingRafId: number | null = null;

      // SMART GUIDES & ALIGNMENT SNAPPING — throttled to one rAF per frame
      fabricCanvas.on('object:moving', (options) => {
        if (movingRafId !== null) return; // skip if a frame is already queued
        movingRafId = requestAnimationFrame(() => {
          movingRafId = null;
          const obj = options.target;
          if (!obj) return;

        clearSmartGuides();
        const snapThreshold = 5;
        const centerSnapThreshold = 12;

        // Card dimensions in world coordinates (0,0 is top-left of card due to viewport transform)
        const { config: currentConfig } = useDesignerStore.getState();
        const cardW = currentConfig.orientation === 'horizontal' ? 1013 : 638;
        const cardH = currentConfig.orientation === 'horizontal' ? 638 : 1013;
        const centerX = cardW / 2;
        const centerY = cardH / 2;

        // getCenterPoint() returns world coords — no offset adjustment needed
        const cp = obj.getCenterPoint();
        const objCenterX = cp.x;
        const objCenterY = cp.y;

        // getBoundingRect(true) returns world-space bounding box
        const wr = obj.getBoundingRect(true);

        let snappedV = false;
        let snappedH = false;

        const isCenterV = Math.abs(objCenterX - centerX) < centerSnapThreshold;
        const isCenterH = Math.abs(objCenterY - centerY) < centerSnapThreshold;

        // 1. CENTER SNAP — move so visual center lands exactly on card center
        if (isCenterV) {
          obj.set('left', (obj.left ?? 0) + (centerX - objCenterX));
          snappedV = true;
        }
        if (isCenterH) {
          obj.set('top', (obj.top ?? 0) + (centerY - objCenterY));
          snappedH = true;
        }

        if (isCenterV && isCenterH) {
          drawGuideLine('v', centerX, '#ef4444', true);
          drawGuideLine('h', centerY, '#ef4444', true);
        } else {
          if (isCenterV) drawGuideLine('v', centerX, '#3b82f6', false);
          if (isCenterH) drawGuideLine('h', centerY, '#3b82f6', false);
        }

        obj.setCoords();

        // 2. OBJECT & EDGE SNAP ─────────────────────────────────────────────
        // Collect edge points and CENTER points separately so we can give
        // centers a stronger magnetic pull (like Figma / Photoshop).
        const OBJ_CENTER_THRESHOLD = 8; // px — stronger pull for center alignment
        const EDGE_THRESHOLD       = 5; // px — standard edge snap

        // Card edges
        const vEdgePoints   = new Set<number>([0, cardW]);
        const hEdgePoints   = new Set<number>([0, cardH]);
        // Other objects: centers get a dedicated set, edges go to edge sets
        const vCenterPoints = new Set<number>();
        const hCenterPoints = new Set<number>();
        // Also store each object so we can draw a connecting guide line
        const objBoundsMap  = new Map<number, { minY: number; maxY: number }>(); // vPoint → span
        const objBoundsMapH = new Map<number, { minX: number; maxX: number }>(); // hPoint → span

        fabricCanvas.getObjects().forEach(other => {
          if (other === obj || (other as any).name === 'smart-guide' || (other as any).name === 'slot-punch-overlay' || (other as any).name === 'safe-zone-overlay') return;
          const r = other.getBoundingRect(true);
          const rL = r.left, rR = r.left + r.width, rT = r.top, rB = r.top + r.height;
          const rCX = rL + r.width  / 2;
          const rCY = rT + r.height / 2;

          // Edges
          vEdgePoints.add(rL); vEdgePoints.add(rR);
          hEdgePoints.add(rT); hEdgePoints.add(rB);
          // Centers — track min/max for guide line span
          vCenterPoints.add(rCX);
          objBoundsMap.set(rCX, { minY: Math.min(rT, wr.top), maxY: Math.max(rB, wr.top + wr.height) });
          hCenterPoints.add(rCY);
          objBoundsMapH.set(rCY, { minX: Math.min(rL, wr.left), maxX: Math.max(rR, wr.left + wr.width) });
        });

        const { guidelines } = useDesignerStore.getState();
        guidelines.vertical.forEach(p   => vEdgePoints.add(p));
        guidelines.horizontal.forEach(p => hEdgePoints.add(p));

        const objVPoints = [wr.left, objCenterX, wr.left + wr.width];
        const objHPoints = [wr.top,  objCenterY, wr.top  + wr.height];

        // 2a. Object CENTER snap (orange, strong pull)
        if (!snappedV) {
          for (const p of Array.from(vCenterPoints)) {
            if (Math.abs(objCenterX - p) < OBJ_CENTER_THRESHOLD) {
              obj.set('left', (obj.left ?? 0) + (p - objCenterX));
              // Draw orange center guide spanning both objects
              const span = objBoundsMap.get(p)!;
              const line = new fabric.Line([p, span.minY, p, span.maxY], {
                stroke: '#f97316', strokeWidth: 1.5, selectable: false, evented: false,
                strokeDashArray: [], // @ts-ignore
                name: 'smart-guide'
              });
              fabricCanvas.add(line); guideLines.push(line);
              snappedV = true;
              break;
            }
          }
        }

        if (!snappedH) {
          for (const p of Array.from(hCenterPoints)) {
            if (Math.abs(objCenterY - p) < OBJ_CENTER_THRESHOLD) {
              obj.set('top', (obj.top ?? 0) + (p - objCenterY));
              const span = objBoundsMapH.get(p)!;
              const line = new fabric.Line([span.minX, p, span.maxX, p], {
                stroke: '#f97316', strokeWidth: 1.5, selectable: false, evented: false,
                strokeDashArray: [], // @ts-ignore
                name: 'smart-guide'
              });
              fabricCanvas.add(line); guideLines.push(line);
              snappedH = true;
              break;
            }
          }
        }

        // 2b. Distribution Snap (Equidistance / Magnetic Pause)
        // Find existing gaps between peers and snap the dragged object to match them
        const DIST_SNAP_THRESHOLD = 6;
        const validOthers = fabricCanvas.getObjects().filter(o => o !== obj && !['smart-guide', 'slot-punch-overlay', 'safe-zone-overlay'].includes((o as any).name));

        if (!snappedH) { // Top/Bottom snapping (Vertical gaps)
          const vPeers = validOthers.filter(o => {
            const r = o.getBoundingRect(true);
            return Math.min(wr.left + wr.width, r.left + r.width) - Math.max(wr.left, r.left) > 0;
          });
          if (vPeers.length >= 2) {
            const vGaps = new Set<number>();
            for (let i = 0; i < vPeers.length; i++) {
              for (let j = 0; j < vPeers.length; j++) {
                if (i === j) continue;
                const r1 = vPeers[i].getBoundingRect(true);
                const r2 = vPeers[j].getBoundingRect(true);
                if (r1.top + r1.height <= r2.top) {
                  vGaps.add(Math.round(r2.top - (r1.top + r1.height)));
                }
              }
            }
            for (const peer of vPeers) {
              const pr = peer.getBoundingRect(true);
              for (const gap of vGaps) {
                // Try to snap obj below peer
                const targetTopBelow = pr.top + pr.height + gap;
                if (Math.abs(wr.top - targetTopBelow) < DIST_SNAP_THRESHOLD) {
                  obj.set('top', (obj.top ?? 0) + (targetTopBelow - wr.top));
                  snappedH = true; break;
                }
                // Try to snap obj above peer
                const targetTopAbove = pr.top - gap - wr.height;
                if (Math.abs(wr.top - targetTopAbove) < DIST_SNAP_THRESHOLD) {
                  obj.set('top', (obj.top ?? 0) + (targetTopAbove - wr.top));
                  snappedH = true; break;
                }
              }
              if (snappedH) break;
            }
          }
        }

        if (!snappedV) { // Left/Right snapping (Horizontal gaps)
          const hPeers = validOthers.filter(o => {
            const r = o.getBoundingRect(true);
            return Math.min(wr.top + wr.height, r.top + r.height) - Math.max(wr.top, r.top) > 0;
          });
          if (hPeers.length >= 2) {
            const hGaps = new Set<number>();
            for (let i = 0; i < hPeers.length; i++) {
              for (let j = 0; j < hPeers.length; j++) {
                if (i === j) continue;
                const r1 = hPeers[i].getBoundingRect(true);
                const r2 = hPeers[j].getBoundingRect(true);
                if (r1.left + r1.width <= r2.left) {
                  hGaps.add(Math.round(r2.left - (r1.left + r1.width)));
                }
              }
            }
            for (const peer of hPeers) {
              const pr = peer.getBoundingRect(true);
              for (const gap of hGaps) {
                // Try to snap obj right of peer
                const targetLeftRight = pr.left + pr.width + gap;
                if (Math.abs(wr.left - targetLeftRight) < DIST_SNAP_THRESHOLD) {
                  obj.set('left', (obj.left ?? 0) + (targetLeftRight - wr.left));
                  snappedV = true; break;
                }
                // Try to snap obj left of peer
                const targetLeftLeft = pr.left - gap - wr.width;
                if (Math.abs(wr.left - targetLeftLeft) < DIST_SNAP_THRESHOLD) {
                  obj.set('left', (obj.left ?? 0) + (targetLeftLeft - wr.left));
                  snappedV = true; break;
                }
              }
              if (snappedV) break;
            }
          }
        }

        // 2c. Edge snap (blue, standard pull)
        if (!snappedV) {
          for (const p of Array.from(vEdgePoints)) {
            for (const objP of objVPoints) {
              if (Math.abs(objP - p) < EDGE_THRESHOLD) {
                obj.set('left', (obj.left ?? 0) + (p - objP));
                drawGuideLine('v', p, '#3b82f6', false);
                snappedV = true;
                break;
              }
            }
            if (snappedV) break;
          }
        }

        if (!snappedH) {
          for (const p of Array.from(hEdgePoints)) {
            for (const objP of objHPoints) {
              if (Math.abs(objP - p) < EDGE_THRESHOLD) {
                obj.set('top', (obj.top ?? 0) + (p - objP));
                drawGuideLine('h', p, '#3b82f6', false);
                snappedH = true;
                break;
              }
            }
            if (snappedH) break;
          }
        }


        if (snappedV || snappedH) obj.setCoords();

        // ── DISTANCE INDICATORS (Photoshop / Figma style) ───────────────────
        // After snapping, measure the gap from the dragged object to every
        // adjacent element and draw a red dimension line with a px label.
        const objWr = obj.getBoundingRect(true);
        const oL = objWr.left, oR = objWr.left + objWr.width;
        const oT = objWr.top,  oB = objWr.top  + objWr.height;

        fabricCanvas.getObjects().forEach(other => {
          if (other === obj) return;
          const n = (other as any).name;
          if (n === 'smart-guide' || n === 'slot-punch-overlay' || n === 'safe-zone-overlay') return;

          const r   = other.getBoundingRect(true);
          const rL  = r.left, rR = r.left + r.width;
          const rT  = r.top,  rB = r.top  + r.height;

          const objCX = oL + objWr.width / 2;
          const objCY = oT + objWr.height / 2;
          const rCX = rL + r.width / 2;
          const rCY = rT + r.height / 2;

          // Only show vertical gap if they share a horizontal center
          if (Math.abs(objCX - rCX) < 8) { // 8px center threshold
            // Average center to draw the line perfectly straight
            const lineX = (objCX + rCX) / 2;
            if (rB <= oT) drawDistanceLine(lineX, rB, lineX, oT); // other above
            else if (rT >= oB) drawDistanceLine(lineX, oB, lineX, rT); // other below
          }

          // Only show horizontal gap if they share a vertical center
          if (Math.abs(objCY - rCY) < 8) {
            const lineY = (objCY + rCY) / 2;
            if (rR <= oL) drawDistanceLine(rR, lineY, oL, lineY); // other left
            else if (rL >= oR) drawDistanceLine(oR, lineY, rL, lineY); // other right
          }
        });
        // ────────────────────────────────────────────────────────────────────
        }); // end rAF
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
      // Ctrl+Y — standard redo shortcut
      if (cmd && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        useDesignerStore.getState().redo();
      }

      // 6. Zoom — read live zoom from store (closure value is stale between re-renders)
      if (cmd && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        const currentZoom = useDesignerStore.getState().zoom;
        setZoom(currentZoom + 0.1);
      }
      if (cmd && e.key === '-') {
        e.preventDefault();
        const currentZoom = useDesignerStore.getState().zoom;
        setZoom(currentZoom - 0.1);
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

      // 5. Copy / Paste / Cut — unified _clipboard key
      if (cmd && e.key.toLowerCase() === 'c') {
        if (activeObject) {
          e.preventDefault();
          activeObject.clone((cloned: any) => {
            (window as any)._clipboard = cloned;
          });
        }
      }
      if (cmd && e.key.toLowerCase() === 'x') {
        if (activeObject) {
          e.preventDefault();
          activeObject.clone((cloned: any) => {
            (window as any)._clipboard = cloned;
            useDesignerStore.getState().deleteSelected();
          });
        }
      }
      if (cmd && e.key.toLowerCase() === 'v') {
        const clipboard = (window as any)._clipboard;
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
    const { canvas, side, config, showSafeZones } = useDesignerStore.getState();
    if (!canvas) return;
    
    // Restore background color on canvas so exports/thumbnails render correctly
    const bgColor = side === 'front' ? config.backgroundColorFront : config.backgroundColorBack;
    canvas.setBackgroundColor(bgColor, canvas.renderAll.bind(canvas));

    // Update Slot Punch and Safe Zones
    const existingPunch = canvas.getObjects().find(obj => (obj as any).name === 'slot-punch-overlay');
    const existingSafeZone = canvas.getObjects().find(obj => (obj as any).name === 'safe-zone-overlay');
    
    if (existingPunch) canvas.remove(existingPunch);
    if (existingSafeZone) canvas.remove(existingSafeZone);

    const [width, height] = config.orientation === 'horizontal' ? [1013, 638] : [638, 1013];

    if (showSafeZones) {
      const margin = config.safeMargin ?? 25;
      const safeZone = new fabric.Rect({
        left: margin,
        top: margin,
        width: width - margin * 2,
        height: height - margin * 2,
        fill: 'transparent',
        stroke: '#f43f5e',
        strokeWidth: 1,
        strokeDashArray: [10, 5],
        selectable: false,
        evented: false,
        // @ts-ignore
        name: 'safe-zone-overlay',
        // @ts-ignore
        excludeFromExport: true
      });
      canvas.add(safeZone);
      safeZone.bringToFront();
    }

    if (config.slotPunch !== 'none') {
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
      canvas.add(punch);
      punch.bringToFront();
    }
    canvas.renderAll();
  }, [config.backgroundColorFront, config.backgroundColorBack, config.slotPunch, showSafeZones, config.safeMargin]);

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
        backgroundColor: side === 'front' ? config.backgroundColorFront : config.backgroundColorBack,
        position: 'relative',
        overflow: 'visible'
      }}>
        {/* Card-sized shadow layer — sits behind the canvas so it is NOT drawn
            inside the 60 px padded zone and doesn't create faint edge lines */}
        <div style={{
          position: 'absolute',
          inset: 0,
          boxShadow: '0 0 40px rgba(0,0,0,0.12)',
          zIndex: -1,
          pointerEvents: 'none'
        }} />
        <canvas ref={canvasRef} />
        {showGrid && (
          <div 
            className="absolute inset-0 pointer-events-none z-[100]" 
            style={{ 
              backgroundImage: `
                linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px),
                linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)
              `,
              backgroundSize: '100px 100px, 100px 100px, 20px 20px, 20px 20px'
            }} 
          />
        )}
      </div>
    </div>
  );
};

export default Canvas;

