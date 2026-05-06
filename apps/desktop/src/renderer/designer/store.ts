import { create } from 'zustand';
import { fabric } from 'fabric';
import { VdpResult } from './VdpEngine';

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

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  nickname: string;
  dob: string;
  title: string;
  idNumber: string;
  employeeId: string;
  department: string;
  hireDate: string;
  issueDate: string;
  expirationDate: string;
  phone1: string;
  phone2: string;
  fax: string;
  email: string;
  website: string;
  country: string;
  postalCode: string;
  state: string;
  city: string;
  street1: string;
  street2: string;
  gradeLevel: string;
  securityLevel: string;
  height: string;
  weight: string;
  gender: string;
  eyeColor: string;
  hairColor: string;
  profileImage: string;
  signature: string;
  fingerprint: string;
  divisionLogo: string;
  customImage: string;
  customFields?: Record<string, string>;
}

export const DEFAULT_MEMBERS: Member[] = [
  {
    id: 'm1', firstName: 'John', lastName: 'Doe', nickname: 'Johnny', dob: '1990-05-15', title: 'Software Engineer',
    idNumber: 'EMP-1001', employeeId: 'EMP-1001', department: 'Engineering', hireDate: '2020-03-01', issueDate: '2023-01-10', expirationDate: '2025-01-10',
    phone1: '+1 555-0101', phone2: '', fax: '', email: 'john.doe@example.com', website: 'johndoe.dev', country: 'USA', postalCode: '90210',
    state: 'CA', city: 'Beverly Hills', street1: '123 Tech Lane', street2: 'Suite 400', gradeLevel: '', securityLevel: 'Level 4',
    height: '6\'0"', weight: '180 lbs', gender: 'Male', eyeColor: 'Brown', hairColor: 'Black',
    profileImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80',
    signature: '', fingerprint: '', divisionLogo: '', customImage: ''
  },
  {
    id: 'm2', firstName: 'Jane', lastName: 'Smith', nickname: 'Janey', dob: '1985-08-22', title: 'Marketing Director',
    idNumber: 'EMP-1002', employeeId: 'EMP-1002', department: 'Marketing', hireDate: '2018-06-15', issueDate: '2023-01-10', expirationDate: '2025-01-10',
    phone1: '+1 555-0102', phone2: '', fax: '', email: 'jane.smith@example.com', website: 'janesmith.io', country: 'USA', postalCode: '10001',
    state: 'NY', city: 'New York', street1: '456 Market St', street2: 'Floor 12', gradeLevel: '', securityLevel: 'Level 5',
    height: '5\'6"', weight: '130 lbs', gender: 'Female', eyeColor: 'Blue', hairColor: 'Blonde',
    profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
    signature: '', fingerprint: '', divisionLogo: '', customImage: ''
  },
  {
    id: 'm3', firstName: 'Robert', lastName: 'Chen', nickname: 'Rob', dob: '1992-11-30', title: 'Financial Analyst',
    idNumber: 'EMP-1003', employeeId: 'EMP-1003', department: 'Finance', hireDate: '2021-01-20', issueDate: '2023-01-10', expirationDate: '2025-01-10',
    phone1: '+1 555-0103', phone2: '', fax: '', email: 'robert.chen@example.com', website: '', country: 'USA', postalCode: '60601',
    state: 'IL', city: 'Chicago', street1: '789 Loop Ave', street2: '', gradeLevel: '', securityLevel: 'Level 3',
    height: '5\'10"', weight: '165 lbs', gender: 'Male', eyeColor: 'Brown', hairColor: 'Black',
    profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    signature: '', fingerprint: '', divisionLogo: '', customImage: ''
  },
  {
    id: 'm4', firstName: 'Emily', lastName: 'Davis', nickname: 'Em', dob: '1988-02-14', title: 'HR Manager',
    idNumber: 'EMP-1004', employeeId: 'EMP-1004', department: 'Human Resources', hireDate: '2019-09-10', issueDate: '2023-01-10', expirationDate: '2025-01-10',
    phone1: '+1 555-0104', phone2: '', fax: '', email: 'emily.davis@example.com', website: '', country: 'USA', postalCode: '30301',
    state: 'GA', city: 'Atlanta', street1: '321 Peach Tree Ln', street2: '', gradeLevel: '', securityLevel: 'Level 4',
    height: '5\'4"', weight: '125 lbs', gender: 'Female', eyeColor: 'Green', hairColor: 'Red',
    profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80',
    signature: '', fingerprint: '', divisionLogo: '', customImage: ''
  },
  {
    id: 'm5', firstName: 'Michael', lastName: 'Johnson', nickname: 'Mike', dob: '1982-07-08', title: 'Operations Lead',
    idNumber: 'EMP-1005', employeeId: 'EMP-1005', department: 'Operations', hireDate: '2015-04-22', issueDate: '2023-01-10', expirationDate: '2025-01-10',
    phone1: '+1 555-0105', phone2: '', fax: '', email: 'michael.j@example.com', website: '', country: 'USA', postalCode: '75201',
    state: 'TX', city: 'Dallas', street1: '654 Main St', street2: 'Bldg 2', gradeLevel: '', securityLevel: 'Level 5',
    height: '6\'2"', weight: '210 lbs', gender: 'Male', eyeColor: 'Hazel', hairColor: 'Brown',
    profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
    signature: '', fingerprint: '', divisionLogo: '', customImage: ''
  },
  {
    id: 'm6', firstName: 'Sarah', lastName: 'Wilson', nickname: 'Sarah', dob: '1995-04-12', title: 'UX Designer',
    idNumber: 'EMP-1006', employeeId: 'EMP-1006', department: 'Design', hireDate: '2022-02-15', issueDate: '2023-01-10', expirationDate: '2025-01-10',
    phone1: '+1 555-0106', phone2: '', fax: '', email: 'sarah.w@example.com', website: 'sarahwilson.design', country: 'USA', postalCode: '98101',
    state: 'WA', city: 'Seattle', street1: '987 Pine St', street2: '', gradeLevel: '', securityLevel: 'Level 3',
    height: '5\'7"', weight: '135 lbs', gender: 'Female', eyeColor: 'Brown', hairColor: 'Brown',
    profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
    signature: '', fingerprint: '', divisionLogo: '', customImage: ''
  },
  {
    id: 'm7', firstName: 'David', lastName: 'Kim', nickname: 'Dave', dob: '1989-10-05', title: 'Sales Executive',
    idNumber: 'EMP-1007', employeeId: 'EMP-1007', department: 'Sales', hireDate: '2020-08-01', issueDate: '2023-01-10', expirationDate: '2025-01-10',
    phone1: '+1 555-0107', phone2: '', fax: '', email: 'david.kim@example.com', website: '', country: 'USA', postalCode: '33101',
    state: 'FL', city: 'Miami', street1: '147 Ocean Dr', street2: 'Apt 5B', gradeLevel: '', securityLevel: 'Level 2',
    height: '5\'11"', weight: '175 lbs', gender: 'Male', eyeColor: 'Brown', hairColor: 'Black',
    profileImage: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&q=80',
    signature: '', fingerprint: '', divisionLogo: '', customImage: ''
  },
  {
    id: 'm8', firstName: 'Laura', lastName: 'Martinez', nickname: 'Lau', dob: '1984-12-18', title: 'Legal Counsel',
    idNumber: 'EMP-1008', employeeId: 'EMP-1008', department: 'Legal', hireDate: '2017-11-05', issueDate: '2023-01-10', expirationDate: '2025-01-10',
    phone1: '+1 555-0108', phone2: '', fax: '', email: 'laura.m@example.com', website: '', country: 'USA', postalCode: '02108',
    state: 'MA', city: 'Boston', street1: '258 Legal Way', street2: '', gradeLevel: '', securityLevel: 'Level 5',
    height: '5\'5"', weight: '140 lbs', gender: 'Female', eyeColor: 'Brown', hairColor: 'Dark Brown',
    profileImage: 'https://images.unsplash.com/photo-1531123897727-8f129e1bf98c?w=400&q=80',
    signature: '', fingerprint: '', divisionLogo: '', customImage: ''
  },
  {
    id: 'm9', firstName: 'James', lastName: 'Taylor', nickname: 'Jim', dob: '1993-03-25', title: 'IT Support Specialist',
    idNumber: 'EMP-1009', employeeId: 'EMP-1009', department: 'IT', hireDate: '2021-07-12', issueDate: '2023-01-10', expirationDate: '2025-01-10',
    phone1: '+1 555-0109', phone2: '', fax: '', email: 'james.t@example.com', website: '', country: 'USA', postalCode: '80202',
    state: 'CO', city: 'Denver', street1: '369 Mountain Rd', street2: '', gradeLevel: '', securityLevel: 'Level 4',
    height: '6\'1"', weight: '190 lbs', gender: 'Male', eyeColor: 'Blue', hairColor: 'Blonde',
    profileImage: 'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=400&q=80',
    signature: '', fingerprint: '', divisionLogo: '', customImage: ''
  },
  {
    id: 'm10', firstName: 'Amanda', lastName: 'White', nickname: 'Mandy', dob: '1980-09-14', title: 'CEO',
    idNumber: 'EMP-1010', employeeId: 'EMP-1010', department: 'Management', hireDate: '2010-01-01', issueDate: '2023-01-10', expirationDate: '2025-01-10',
    phone1: '+1 555-0110', phone2: '', fax: '', email: 'amanda.w@example.com', website: '', country: 'USA', postalCode: '94105',
    state: 'CA', city: 'San Francisco', street1: '741 Silicon Blvd', street2: 'Penthouse', gradeLevel: '', securityLevel: 'Level 6',
    height: '5\'8"', weight: '145 lbs', gender: 'Female', eyeColor: 'Green', hairColor: 'Black',
    profileImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80',
    signature: '', fingerprint: '', divisionLogo: '', customImage: ''
  }
];

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
  members: Member[];
  addMember: (member: Omit<Member, 'id'>) => void;
  updateMember: (id: string, member: Partial<Member>) => void;
  deleteMember: (id: string) => void;
  activeTemplateId: string | null;
  setActiveTemplateId: (id: string) => void;
  previewResults: VdpResult[];
  setPreviewResults: (results: VdpResult[]) => void;
  isGeneratingPreviews: boolean;
  setIsGeneratingPreviews: (is: boolean) => void;
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
  organizationType: 'corporate' | 'education' | 'healthcare';
  setOrganizationType: (type: 'corporate' | 'education' | 'healthcare') => void;
  formConfig: { enabledFields: string[]; customFields: string[]; enabledImageFields: string[]; customImageFields: string[] } | null;
  setFormConfig: (config: { enabledFields: string[]; customFields: string[]; enabledImageFields: string[]; customImageFields: string[] } | null) => void;
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
  organizationType: 'corporate',
  setOrganizationType: (type) => set({ organizationType: type }),
  formConfig: null,
  setFormConfig: (config) => set({ formConfig: config }),
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
  
  members: (() => {
    const stored = localStorage.getItem('saved_id_members');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.length > 0) return parsed;
    }
    // Fallback to default test members
    localStorage.setItem('saved_id_members', JSON.stringify(DEFAULT_MEMBERS));
    return DEFAULT_MEMBERS;
  })(),
  addMember: (member) => set((state) => {
    const newMember = { ...member, id: Math.random().toString(36).substr(2, 9) };
    const updated = [newMember, ...state.members];
    localStorage.setItem('saved_id_members', JSON.stringify(updated));
    return { members: updated, previewResults: [] };
  }),
  updateMember: (id, updatedMember) => set((state) => {
    const updated = state.members.map(m => m.id === id ? { ...m, ...updatedMember } : m);
    localStorage.setItem('saved_id_members', JSON.stringify(updated));
    return { members: updated, previewResults: [] };
  }),
  deleteMember: (id) => set((state) => {
    const updated = state.members.filter(m => m.id !== id);
    localStorage.setItem('saved_id_members', JSON.stringify(updated));
    return { members: updated, previewResults: [] };
  }),
  activeTemplateId: null,
  setActiveTemplateId: (id) => set({ activeTemplateId: id, previewResults: [] }),
  previewResults: [],
  setPreviewResults: (results) => set({ previewResults: results }),
  isGeneratingPreviews: false,
  setIsGeneratingPreviews: (is) => set({ isGeneratingPreviews: is }),
  
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

    const json = canvas.toJSON(['id', 'name', 'selectable', 'evented', 'isVariable', 'variableType', 'placeholder']);
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
    
    // Set origins to center so it stays centered when text changes
    selectedObject.set({
      originX: 'center',
      originY: 'center'
    });
    
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
    const { canvas, side, frontData, backData, config, savedDesigns, currentDesignId } = get();
    if (!canvas) return;

    // 1. Capture current side thumbnail
    const currentThumb = canvas.toDataURL({ format: 'png', multiplier: 2.0 });
    
    // 2. Generate other side thumbnail to ensure slot punch and background are correct
    const generateOtherThumb = () => {
      const otherData = side === 'front' ? backData : frontData;
      const otherBG = side === 'front' ? config.backgroundColorBack : config.backgroundColorFront;
      
      if (!otherData) return currentThumb; // Fallback if no data yet

      const [w, h] = config.orientation === 'horizontal' ? [1013, 638] : [638, 1013];
      const tempCanvasElem = document.createElement('canvas');
      tempCanvasElem.width = w;
      tempCanvasElem.height = h;
      
      const tempFabric = new fabric.StaticCanvas(tempCanvasElem, { 
        width: w, 
        height: h, 
        backgroundColor: otherBG 
      });

      return new Promise<string>((resolve) => {
        tempFabric.loadFromJSON(otherData, () => {
          // Add slot punch to other side too
          if (config.slotPunch !== 'none') {
            const punch = new fabric.Rect({
              width: 160, height: 35, rx: 12, ry: 12, fill: '#d1d5db',
              left: config.slotPunch === 'short' ? w / 2 : 30,
              top: config.slotPunch === 'short' ? 30 : h / 2,
              angle: config.slotPunch === 'long' ? 90 : 0,
              originX: 'center', originY: 'center'
            });
            tempFabric.add(punch);
            punch.bringToFront();
          }
          tempFabric.renderAll();
          const dataUrl = tempFabric.toDataURL({ format: 'png', multiplier: 1.0 });
          tempFabric.dispose();
          resolve(dataUrl);
        });
      });
    };

    const runSave = async () => {
      const otherThumb = await generateOtherThumb();
      const isFront = side === 'front';
      
      const currentData = canvas.toJSON(['id', 'name', 'selectable', 'evented', 'isVariable', 'variableType', 'placeholder']);
      const fData = isFront ? currentData : frontData;
      const bData = !isFront ? currentData : backData;
      const fThumb = isFront ? currentThumb : otherThumb;
      const bThumb = !isFront ? currentThumb : otherThumb;

      let updatedDesigns: SavedDesign[];
      let designId = currentDesignId;

      if (currentDesignId) {
        updatedDesigns = savedDesigns.map(d => 
          d.id === currentDesignId 
            ? { ...d, front: fData, back: bData, config, thumbnailFront: fThumb, thumbnailBack: bThumb, timestamp: new Date().toISOString() }
            : d
        );
      } else {
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

      set({ 
        savedDesigns: updatedDesigns, 
        currentDesignId: designId, 
        activeTemplateId: designId,
        previewResults: [],
        frontThumbnail: fThumb,
        backThumbnail: bThumb
      });
      localStorage.setItem('saved_id_designs', JSON.stringify(updatedDesigns));
      
      get().showModal({
        title: 'Success',
        message: currentDesignId ? 'Design updated successfully!' : 'New design saved successfully!',
        type: 'info'
      });
    };

    runSave();
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
