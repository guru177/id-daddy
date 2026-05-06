import { create } from 'zustand';
import { fabric } from 'fabric';

interface CardConfig {
  orientation: 'horizontal' | 'vertical';
  type: string;
  backsidePrinting: 'none' | 'bw' | 'color';
  slotPunch: 'none' | 'short' | 'long';
  backgroundColorFront: string;
  backgroundColorBack: string;
  frontLamination: 'none' | 'transparent' | 'hologram';
  backLamination: 'none' | 'transparent' | 'hologram';
  magStripeEnabled: boolean;
  magStripeTracks: {
    track1: string;
    track2: string;
    track3: string;
  };
}

interface SavedDesign {
  id: string;
  name: string;
  front: any;
  back: any;
  config: CardConfig;
  thumbnailFront: string;
  thumbnailBack: string;
  timestamp: string;
}

interface DesignerState {
  canvas: fabric.Canvas | null;
  side: 'front' | 'back';
  frontData: any;
  backData: any;
  selectedObject: fabric.Object | null;
  history: string[];
  redoStack: string[];
  config: CardConfig;
  customVariables: string[];
  activePanel: string | null;
  setActivePanel: (panel: string | null) => void;
  
  setCanvas: (canvas: fabric.Canvas) => void;
  setSide: (side: 'front' | 'back') => void;
  setConfig: (config: Partial<CardConfig>) => void;
  setSelectedObject: (obj: fabric.Object | null) => void;
  addCustomVariable: (v: string) => void;
  isImageLibraryOpen: boolean;
  setIsImageLibraryOpen: (open: boolean) => void;
  libraryMode: 'add' | 'replace';
  setLibraryMode: (mode: 'add' | 'replace') => void;
  uploadedImages: string[];
  addUploadedImage: (url: string) => void;
  
  isHistoryPaused: boolean;
  saveState: () => void;
  undo: () => void;
  redo: () => void;
  
  deleteSelected: () => void;
  duplicateSelected: () => void;
  bringForward: () => void;
  sendBackward: () => void;
  bringToFront: () => void;
  sendToBack: () => void;
  groupSelected: () => void;
  ungroupSelected: () => void;
  centerObject: () => void;
  createClippingMask: () => void;
  releaseClippingMask: () => void;
  copyStyle: () => void;
  pasteStyle: () => void;
  copyObject: () => void;
  pasteObject: () => void;
  selectAll: () => void;
  deselectAll: () => void;
  renameLayer: (id: string, name: string) => void;
  mergeSelected: () => void;
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
  downloadCanvas: () => void;
  saveDesign: () => void;
  loadDesign: (design: SavedDesign) => void;
  deleteDesign: (id: string) => void;
  exportDesign: (design: any) => void;
  newDesign: () => void;
  savedDesigns: SavedDesign[];
  currentDesignId: string | null;
  loadTrigger: number;
  frontThumbnail: string;
  backThumbnail: string;
  modal: {
    isOpen: boolean;
    title: string;
    message: string;
    type: 'info' | 'confirm' | 'error';
    onConfirm?: () => void;
  };
  showModal: (options: { title: string; message: string; type?: 'info' | 'confirm' | 'error'; onConfirm?: () => void }) => void;
  closeModal: () => void;
}

export const useDesignerStore = create<DesignerState>((set, get) => ({
  canvas: null,
  side: 'front',
  frontData: null,
  backData: null,
  selectedObject: null,
  history: [],
  redoStack: [],
  config: {
    orientation: 'horizontal',
    type: '30 Mil PVC',
    backsidePrinting: 'none',
    slotPunch: 'none',
    backgroundColorFront: '#ffffff',
    backgroundColorBack: '#ffffff',
    frontLamination: 'none',
    backLamination: 'none',
    magStripeEnabled: false,
    magStripeTracks: {
      track1: '',
      track2: '',
      track3: '',
    },
  },
  customVariables: [],
  activePanel: 'card-options',
  setActivePanel: (panel: string | null) => set({ activePanel: panel }),
  showGrid: false,
  setShowGrid: (show: boolean) => set({ showGrid: show }),
  
  addCustomVariable: (v: string) => set((state) => ({ 
    customVariables: [...state.customVariables, v] 
  })),
  isImageLibraryOpen: false,
  setIsImageLibraryOpen: (open: boolean) => set({ isImageLibraryOpen: open }),
  libraryMode: 'add',
  setLibraryMode: (mode: 'add' | 'replace') => set({ libraryMode: mode }),
  uploadedImages: [],
  addUploadedImage: (url: string) => set((state) => ({ 
    uploadedImages: [url, ...state.uploadedImages] 
  })),
  currentDesignId: null,
  loadTrigger: 0,
  frontThumbnail: '',
  backThumbnail: '',
  modal: {
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  },
  showModal: (options) => set({ 
    modal: { 
      isOpen: true, 
      type: 'info', 
      ...options 
    } 
  }),
  closeModal: () => set((state) => ({ 
    modal: { ...state.modal, isOpen: false } 
  })),
  setCanvas: (canvas: fabric.Canvas) => set({ canvas }),
  
  setSide: (side: 'front' | 'back') => {
    set({ side });
  },

  setConfig: (newConfig: Partial<CardConfig>) => set((state) => ({ 
    config: { ...state.config, ...newConfig } 
  })),

  setSelectedObject: (obj: fabric.Object | null) => set({ selectedObject: obj }),

  isHistoryPaused: false,
  saveState: () => {
    const { canvas, history, isHistoryPaused, side } = get();
    if (!canvas || isHistoryPaused) return;

    const json = canvas.toJSON(['id', 'name', 'selectable', 'evented', 'isVariable', 'variableType']);
    const jsonStr = JSON.stringify(json);
    
    // Deduplicate history
    if (history.length > 0 && JSON.stringify(history[history.length - 1]) === jsonStr) return;

    const updates: any = {
      history: [...history, json].slice(-50),
      redoStack: []
    };

    if (side === 'front') updates.frontData = json;
    else updates.backData = json;

    // Also update thumbnail for current side
    const thumb = canvas.toDataURL({ format: 'png', multiplier: 1.0 });
    if (side === 'front') updates.frontThumbnail = thumb;
    else updates.backThumbnail = thumb;

    set(updates);
    
    // Notify layers panel to refresh
    canvas.fire('object:modified');
  },

  undo: () => {
    const { canvas, history, redoStack } = get();
    if (!canvas || history.length <= 1) return;

    const currentState = history[history.length - 1];
    const prevState = history[history.length - 2];
    
    canvas.loadFromJSON(prevState, () => {
      canvas.renderAll();
      const updates: any = {
        history: history.slice(0, -1),
        redoStack: [...redoStack, currentState]
      };
      if (get().side === 'front') updates.frontData = prevState;
      else updates.backData = prevState;
      set(updates);
    });
  },

  redo: () => {
    const { canvas, history, redoStack } = get();
    if (!canvas || redoStack.length === 0) return;

    const nextState = redoStack[redoStack.length - 1];
    
    canvas.loadFromJSON(nextState, () => {
      canvas.renderAll();
      const updates: any = {
        history: [...history, nextState],
        redoStack: redoStack.slice(0, -1)
      };
      if (get().side === 'front') updates.frontData = nextState;
      else updates.backData = nextState;
      set(updates);
    });
  },

  deleteSelected: () => {
    const { canvas, selectedObject, saveState } = get();
    if (!canvas || !selectedObject) return;
    
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length > 0) {
      activeObjects.forEach(obj => canvas.remove(obj));
      canvas.discardActiveObject();
      canvas.renderAll();
      saveState();
    }
  },

  duplicateSelected: () => {
    const { canvas, saveState } = get();
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (!activeObject) return;

    activeObject.clone((cloned: fabric.Object) => {
      canvas.discardActiveObject();
      cloned.set({
        left: (cloned.left || 0) + 10,
        top: (cloned.top || 0) + 10,
        evented: true,
      });
      if (cloned.type === 'activeSelection') {
        (cloned as any).canvas = canvas;
        (cloned as any).forEachObject((obj: any) => {
          canvas.add(obj);
        });
        cloned.setCoords();
      } else {
        canvas.add(cloned);
      }
      canvas.setActiveObject(cloned);
      canvas.requestRenderAll();
      saveState();
    });
  },

  bringForward: () => {
    const { canvas, selectedObject, saveState } = get();
    if (!canvas || !selectedObject) return;
    canvas.bringForward(selectedObject);
    const punch = canvas.getObjects().find((o: any) => o.name === 'slot-punch-overlay');
    if (punch) punch.bringToFront();
    canvas.renderAll();
    canvas.fire('object:modified');
    saveState();
  },

  sendBackward: () => {
    const { canvas, selectedObject, saveState } = get();
    if (!canvas || !selectedObject) return;
    canvas.sendBackwards(selectedObject);
    canvas.renderAll();
    canvas.fire('object:modified');
    saveState();
  },

  bringToFront: () => {
    const { canvas, selectedObject, saveState } = get();
    if (!canvas || !selectedObject) return;
    canvas.bringToFront(selectedObject);
    const punch = canvas.getObjects().find((o: any) => o.name === 'slot-punch-overlay');
    if (punch) punch.bringToFront();
    canvas.renderAll();
    canvas.fire('object:modified');
    saveState();
  },

  sendToBack: () => {
    const { canvas, selectedObject, saveState } = get();
    if (!canvas || !selectedObject) return;
    canvas.sendToBack(selectedObject);
    canvas.renderAll();
    canvas.fire('object:modified');
    saveState();
  },

  groupSelected: () => {
    const { canvas, saveState } = get();
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (!activeObject || activeObject.type !== 'activeSelection') return;
    
    // Explicitly set origin to avoid shifts
    activeObject.set({ originX: 'left', originY: 'top' });
    (activeObject as fabric.ActiveSelection).toGroup();
    
    canvas.requestRenderAll();
    saveState();
  },

  ungroupSelected: () => {
    const { canvas, selectedObject, saveState } = get();
    if (!canvas || !selectedObject || selectedObject.type !== 'group') return;
    
    // Explicitly set origin to avoid shifts during ungroup
    selectedObject.set({ originX: 'left', originY: 'top' });
    (selectedObject as fabric.Group).toActiveSelection();
    
    canvas.requestRenderAll();
    saveState();
  },

  centerObject: () => {
    const { canvas, selectedObject, saveState } = get();
    if (!canvas || !selectedObject) return;
    canvas.centerObject(selectedObject);
    selectedObject.setCoords();
    canvas.renderAll();
    saveState();
  },

  createClippingMask: () => {
    const { canvas, selectedObject, saveState } = get();
    if (!canvas || !selectedObject) return;
    const objects = canvas.getObjects();
    const idx = objects.indexOf(selectedObject);
    if (idx <= 0) return;
    const mask = objects[idx - 1];
    mask.clone((clonedMask: fabric.Object) => {
      clonedMask.set({
        fill: 'black',
        stroke: undefined,
        strokeWidth: 0,
        // @ts-ignore
        absolutePositioned: true
      });
      selectedObject.set({
        clipPath: clonedMask,
        // @ts-ignore
        isClipped: true,
        // @ts-ignore
        clipId: (mask as any).id
      });
      mask.set({ visible: false, selectable: false });
      canvas.discardActiveObject();
      canvas.renderAll();
      saveState();
    });
  },

  releaseClippingMask: () => {
    const { canvas, selectedObject, saveState } = get();
    if (!canvas || !selectedObject) return;
    // @ts-ignore
    const clipId = selectedObject.clipId;
    if (clipId) {
      const originalMask = canvas.getObjects().find((o: any) => o.id === clipId);
      if (originalMask) {
        originalMask.set({ visible: true, selectable: true });
      }
    }
    selectedObject.set({ 
      clipPath: undefined,
      // @ts-ignore
      isClipped: false,
      // @ts-ignore
      clipId: undefined
    });
    canvas.renderAll();
    saveState();
  },

  copyStyle: () => {
    const { selectedObject } = get();
    if (!selectedObject) return;
    const style = {
      fill: selectedObject.fill,
      stroke: selectedObject.stroke,
      strokeWidth: selectedObject.strokeWidth,
      opacity: selectedObject.opacity,
      shadow: selectedObject.shadow,
    };
    // @ts-ignore
    window._copiedStyle = style;
  },

  pasteStyle: () => {
    const { selectedObject, canvas, saveState } = get();
    // @ts-ignore
    const style = window._copiedStyle;
    if (!selectedObject || !style) return;
    selectedObject.set(style);
    canvas?.renderAll();
    saveState();
  },

  copyObject: () => {
    const { canvas } = get();
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (!activeObject) return;
    activeObject.clone((cloned: any) => {
      // @ts-ignore
      window._clipboard = cloned;
    });
  },

  pasteObject: () => {
    const { canvas, saveState } = get();
    // @ts-ignore
    const clipboard = window._clipboard;
    if (!canvas || !clipboard) return;
    clipboard.clone((clonedObj: any) => {
      canvas.discardActiveObject();
      clonedObj.set({
        left: clonedObj.left + 10,
        top: clonedObj.top + 10,
        evented: true,
      });
      if (clonedObj.type === 'activeSelection') {
        clonedObj.canvas = canvas;
        clonedObj.forEachObject((obj: any) => {
          canvas.add(obj);
        });
        clonedObj.setCoords();
      } else {
        canvas.add(clonedObj);
      }
      clipboard.top += 10;
      clipboard.left += 10;
      canvas.setActiveObject(clonedObj);
      canvas.requestRenderAll();
      saveState();
    });
  },

  selectAll: () => {
    const { canvas } = get();
    if (!canvas) return;
    canvas.discardActiveObject();
    const sel = new fabric.ActiveSelection(canvas.getObjects(), {
      canvas: canvas,
    });
    canvas.setActiveObject(sel);
    canvas.requestRenderAll();
  },

  deselectAll: () => {
    const { canvas } = get();
    if (!canvas) return;
    canvas.discardActiveObject();
    canvas.requestRenderAll();
  },

  renameLayer: (id: string, name: string) => {
    const { canvas } = get();
    if (!canvas) return;
    const obj = canvas.getObjects().find((o: any) => o.id === id);
    if (obj) {
      // @ts-ignore
      obj.customName = name;
      canvas.renderAll();
      canvas.fire('object:modified');
    }
  },

  mergeSelected: () => {
    const { canvas, saveState } = get();
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (!activeObject) return;

    const objectsToMerge = canvas.getActiveObjects();
    if (objectsToMerge.length <= 1) return;

    // Use getBoundingRect for absolute canvas positioning
    const rect = activeObject.getBoundingRect();
    const multiplier = 2;

    // 1. Temporarily hide all other objects and background to get a CLEAN capture
    const originalBG = canvas.backgroundColor;
    canvas.backgroundColor = 'rgba(0,0,0,0)';
    
    const allObjects = canvas.getObjects();
    const otherObjects = allObjects.filter(obj => !objectsToMerge.includes(obj));
    
    // Remember visibility to restore later
    const visibilityMap = new Map();
    otherObjects.forEach(obj => {
      visibilityMap.set(obj, obj.visible);
      obj.visible = false;
    });

    // 2. Capture exactly what's on the canvas at that location
    const dataURL = canvas.toDataURL({
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      multiplier,
      format: 'png'
    });

    // 3. Restore visibility and background
    otherObjects.forEach(obj => {
      obj.visible = visibilityMap.get(obj);
    });
    canvas.backgroundColor = originalBG;

    // 4. Atomic History handling
    set({ isHistoryPaused: true });
    set({ isHistoryPaused: false });
    saveState();
    set({ isHistoryPaused: true });

    // 5. Replace originals with the new image
    canvas.discardActiveObject();
    objectsToMerge.forEach(obj => canvas.remove(obj));
    
    fabric.Image.fromURL(dataURL, (img) => {
      if (img) {
        img.set({
          left: rect.left,
          top: rect.top,
          scaleX: 1 / multiplier,
          scaleY: 1 / multiplier,
        });
        (img as any).id = Math.random().toString(36).substr(2, 9);
        (img as any).customName = 'Merged Layer';
        
        canvas.add(img);
        canvas.setActiveObject(img);
        
        set({ isHistoryPaused: false });
        canvas.renderAll();
        saveState();
      }
    });
  },

  downloadCanvas: () => {
    const { canvas, side, frontData, backData, config } = get();
    if (!canvas) return;
    
    // Discard active object to clean up export
    canvas.discardActiveObject();
    canvas.renderAll();

    const downloadLink = (dataURL: string, filename: string) => {
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    const currentDataURL = canvas.toDataURL({
      format: 'png',
      multiplier: 3, // High quality
      enableRetinaScaling: true
    });
    downloadLink(currentDataURL, `id-design-${side}-${Date.now()}.png`);

    // Export the other side
    const otherSideData = side === 'front' ? backData : frontData;
    const otherSideName = side === 'front' ? 'back' : 'front';
    const bgColor = side === 'front' ? config.backgroundColorBack : config.backgroundColorFront;

    if (otherSideData) {
      const [width, height] = config.orientation === 'horizontal' ? [1013, 638] : [638, 1013];
      const tempCanvasElem = document.createElement('canvas');
      tempCanvasElem.width = width;
      tempCanvasElem.height = height;
      
      const tempFabric = new fabric.StaticCanvas(tempCanvasElem, {
        width, height, backgroundColor: bgColor
      });
      
      tempFabric.loadFromJSON(otherSideData, () => {
        if (config.slotPunch !== 'none') {
          const punch = new fabric.Rect({
            width: 160, height: 35, rx: 12, ry: 12, fill: '#d1d5db',
            left: config.slotPunch === 'short' ? width / 2 : 30,
            top: config.slotPunch === 'short' ? 30 : height / 2,
            angle: config.slotPunch === 'long' ? 90 : 0,
            originX: 'center', originY: 'center'
          });
          tempFabric.add(punch);
        }
        tempFabric.renderAll();
        const otherDataURL = tempFabric.toDataURL({
          format: 'png', multiplier: 3, enableRetinaScaling: true
        });
        downloadLink(otherDataURL, `id-design-${otherSideName}-${Date.now()}.png`);
      });
    }
  },

  exportDesign: (design: any) => {
    const downloadLink = (dataURL: string, filename: string) => {
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    const [width, height] = design.config.orientation === 'horizontal' ? [1013, 638] : [638, 1013];
    
    // Front side
    if (design.front) {
      const tempFront = document.createElement('canvas');
      tempFront.width = width;
      tempFront.height = height;
      const fabFront = new fabric.StaticCanvas(tempFront, { width, height, backgroundColor: design.config.backgroundColorFront });
      fabFront.loadFromJSON(design.front, () => {
        if (design.config.slotPunch !== 'none') {
          const punch = new fabric.Rect({
            width: 160, height: 35, rx: 12, ry: 12, fill: '#d1d5db',
            left: design.config.slotPunch === 'short' ? width / 2 : 30,
            top: design.config.slotPunch === 'short' ? 30 : height / 2,
            angle: design.config.slotPunch === 'long' ? 90 : 0,
            originX: 'center', originY: 'center'
          });
          fabFront.add(punch);
        }
        fabFront.renderAll();
        downloadLink(fabFront.toDataURL({ format: 'png', multiplier: 3 }), `${design.name.replace(/\s+/g, '-')}-front.png`);
      });
    }

    // Back side
    if (design.back) {
      const tempBack = document.createElement('canvas');
      tempBack.width = width;
      tempBack.height = height;
      const fabBack = new fabric.StaticCanvas(tempBack, { width, height, backgroundColor: design.config.backgroundColorBack });
      fabBack.loadFromJSON(design.back, () => {
        if (design.config.slotPunch !== 'none') {
          const punch = new fabric.Rect({
            width: 160, height: 35, rx: 12, ry: 12, fill: '#d1d5db',
            left: design.config.slotPunch === 'short' ? width / 2 : 30,
            top: design.config.slotPunch === 'short' ? 30 : height / 2,
            angle: design.config.slotPunch === 'long' ? 90 : 0,
            originX: 'center', originY: 'center'
          });
          fabBack.add(punch);
        }
        fabBack.renderAll();
        downloadLink(fabBack.toDataURL({ format: 'png', multiplier: 3 }), `${design.name.replace(/\s+/g, '-')}-back.png`);
      });
    }
  },

  savedDesigns: JSON.parse(localStorage.getItem('saved_id_designs') || '[]'),

  saveDesign: () => {
    const { canvas, side, frontData, backData, config, savedDesigns, frontThumbnail, backThumbnail, currentDesignId } = get();
    if (!canvas) return;

    const currentData = canvas.toJSON(['id', 'name', 'selectable', 'evented', 'isVariable', 'variableType']);
    const isFront = side === 'front';
    const currentThumb = canvas.toDataURL({ format: 'png', multiplier: 2.0, quality: 1.0 });

    const fData = isFront ? currentData : frontData;
    const bData = !isFront ? currentData : backData;
    const fThumb = isFront ? currentThumb : frontThumbnail || currentThumb;
    const bThumb = !isFront ? currentThumb : backThumbnail || currentThumb;

    let updatedDesigns: SavedDesign[];
    let designId = currentDesignId;

    if (currentDesignId) {
      // Overwrite existing
      updatedDesigns = savedDesigns.map(d => 
        d.id === currentDesignId 
          ? { ...d, front: fData, back: bData, config, thumbnailFront: fThumb, thumbnailBack: bThumb, timestamp: new Date().toISOString() }
          : d
      );
    } else {
      // Create new
      designId = Math.random().toString(36).substr(2, 9);
      const newDesign: SavedDesign = {
        id: designId,
        name: `Design ${savedDesigns.length + 1}`,
        front: fData,
        back: bData,
        config,
        thumbnailFront: fThumb,
        thumbnailBack: bThumb,
        timestamp: new Date().toISOString()
      };
      updatedDesigns = [newDesign, ...savedDesigns];
    }

    set({ savedDesigns: updatedDesigns, currentDesignId: designId });
    localStorage.setItem('saved_id_designs', JSON.stringify(updatedDesigns));
    get().showModal({
      title: 'Success',
      message: currentDesignId ? 'Design updated successfully!' : 'New design saved successfully!',
      type: 'info'
    });
  },

  loadDesign: (design) => {
    set((state) => ({
      frontData: design.front,
      backData: design.back,
      frontThumbnail: design.thumbnailFront,
      backThumbnail: design.thumbnailBack,
      config: design.config,
      currentDesignId: design.id,
      side: 'front',
      history: [],
      redoStack: [],
      loadTrigger: state.loadTrigger + 1
    }));
  },

  deleteDesign: (id) => {
    const design = get().savedDesigns.find(d => d.id === id);
    const updated = get().savedDesigns.filter(d => d.id !== id);
    set({ savedDesigns: updated });
    localStorage.setItem('saved_id_designs', JSON.stringify(updated));
    get().showModal({
      title: 'Deleted',
      message: `"${design?.name || 'Design'}" has been removed from your library.`,
      type: 'info'
    });
  },

  newDesign: () => {
    const { canvas, saveState, showModal, config } = get();
    if (!canvas) return;
    
    showModal({
      title: 'New Design',
      message: 'Are you sure you want to start a new design? All unsaved changes will be lost.',
      type: 'confirm',
      onConfirm: () => {
        canvas.clear();
        const bgColor = config.backgroundColorFront;
        canvas.setBackgroundColor(bgColor, canvas.renderAll.bind(canvas));
        set({ 
          frontData: null, 
          backData: null,
          frontThumbnail: '',
          backThumbnail: '',
          currentDesignId: null,
          history: [],
          redoStack: []
        });
        saveState();
      }
    });
  }
}));
