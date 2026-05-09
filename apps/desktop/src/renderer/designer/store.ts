import { create } from 'zustand';
import { fabric } from 'fabric';
import { VdpResult } from './VdpEngine';
import { fetchRecords, createRecord, updateRecord, deleteRecord, fetchTemplates, createTemplate, updateTemplate, deleteTemplate } from '../api';

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

export interface SavedDesign {
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
    id: 'm1', firstName: 'William', lastName: 'Anderson', nickname: 'Will', dob: '1988-03-12', title: 'Sales Director',
    idNumber: 'EMP-2001', employeeId: 'EMP-2001', department: 'Sales', hireDate: '2019-05-01', issueDate: '2024-01-15', expirationDate: '2026-01-15',
    phone1: '+1 555-0201', phone2: '', fax: '', email: 'william.a@example.com', website: '', country: 'USA', postalCode: '10001',
    state: 'NY', city: 'New York', street1: '123 Business Ave', street2: 'Suite 200', gradeLevel: '', securityLevel: 'Level 5',
    height: '6\'1"', weight: '185 lbs', gender: 'Male', eyeColor: 'Brown', hairColor: 'Brown',
    profileImage: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80',
    signature: '', fingerprint: '', divisionLogo: '', customImage: ''
  },
  {
    id: 'm2', firstName: 'Emma', lastName: 'Thompson', nickname: 'Em', dob: '1992-07-24', title: 'Marketing Lead',
    idNumber: 'EMP-2002', employeeId: 'EMP-2002', department: 'Marketing', hireDate: '2020-08-15', issueDate: '2024-01-15', expirationDate: '2026-01-15',
    phone1: '+1 555-0202', phone2: '', fax: '', email: 'emma.t@example.com', website: '', country: 'USA', postalCode: '90210',
    state: 'CA', city: 'Los Angeles', street1: '456 Creative Blvd', street2: '', gradeLevel: '', securityLevel: 'Level 4',
    height: '5\'6"', weight: '130 lbs', gender: 'Female', eyeColor: 'Blue', hairColor: 'Blonde',
    profileImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80',
    signature: '', fingerprint: '', divisionLogo: '', customImage: ''
  },
  {
    id: 'm3', firstName: 'James', lastName: 'Rodriguez', nickname: 'Jim', dob: '1990-11-05', title: 'Senior Engineer',
    idNumber: 'EMP-2003', employeeId: 'EMP-2003', department: 'Engineering', hireDate: '2018-02-10', issueDate: '2024-01-15', expirationDate: '2026-01-15',
    phone1: '+1 555-0203', phone2: '', fax: '', email: 'james.r@example.com', website: 'jrodriguez.dev', country: 'USA', postalCode: '78701',
    state: 'TX', city: 'Austin', street1: '789 Tech Parkway', street2: 'Floor 3', gradeLevel: '', securityLevel: 'Level 5',
    height: '5\'10"', weight: '170 lbs', gender: 'Male', eyeColor: 'Brown', hairColor: 'Black',
    profileImage: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80',
    signature: '', fingerprint: '', divisionLogo: '', customImage: ''
  },
  {
    id: 'm4', firstName: 'Sofia', lastName: 'Patel', nickname: 'Sofi', dob: '1995-04-18', title: 'Product Designer',
    idNumber: 'EMP-2004', employeeId: 'EMP-2004', department: 'Design', hireDate: '2022-01-20', issueDate: '2024-01-15', expirationDate: '2026-01-15',
    phone1: '+1 555-0204', phone2: '', fax: '', email: 'sofia.p@example.com', website: 'sofiadesigns.com', country: 'USA', postalCode: '94105',
    state: 'CA', city: 'San Francisco', street1: '321 Design St', street2: '', gradeLevel: '', securityLevel: 'Level 3',
    height: '5\'4"', weight: '120 lbs', gender: 'Female', eyeColor: 'Brown', hairColor: 'Black',
    profileImage: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80',
    signature: '', fingerprint: '', divisionLogo: '', customImage: ''
  },
  {
    id: 'm5', firstName: 'Alexander', lastName: 'Wright', nickname: 'Alex', dob: '1985-09-30', title: 'Operations Manager',
    idNumber: 'EMP-2005', employeeId: 'EMP-2005', department: 'Operations', hireDate: '2016-11-05', issueDate: '2024-01-15', expirationDate: '2026-01-15',
    phone1: '+1 555-0205', phone2: '', fax: '', email: 'alex.w@example.com', website: '', country: 'USA', postalCode: '60601',
    state: 'IL', city: 'Chicago', street1: '654 Logistics Way', street2: 'Building A', gradeLevel: '', securityLevel: 'Level 5',
    height: '6\'0"', weight: '195 lbs', gender: 'Male', eyeColor: 'Blue', hairColor: 'Brown',
    profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80',
    signature: '', fingerprint: '', divisionLogo: '', customImage: ''
  },
  {
    id: 'm6', firstName: 'Mia', lastName: 'Chen', nickname: 'Mia', dob: '1993-12-12', title: 'Financial Analyst',
    idNumber: 'EMP-2006', employeeId: 'EMP-2006', department: 'Finance', hireDate: '2021-06-01', issueDate: '2024-01-15', expirationDate: '2026-01-15',
    phone1: '+1 555-0206', phone2: '', fax: '', email: 'mia.c@example.com', website: '', country: 'USA', postalCode: '02110',
    state: 'MA', city: 'Boston', street1: '987 Financial Dist', street2: '', gradeLevel: '', securityLevel: 'Level 4',
    height: '5\'5"', weight: '125 lbs', gender: 'Female', eyeColor: 'Brown', hairColor: 'Black',
    profileImage: 'https://images.unsplash.com/photo-1598550874175-4d0ef436c909?w=400&q=80',
    signature: '', fingerprint: '', divisionLogo: '', customImage: ''
  },
  {
    id: 'm7', firstName: 'Benjamin', lastName: 'Foster', nickname: 'Ben', dob: '1987-02-28', title: 'System Administrator',
    idNumber: 'EMP-2007', employeeId: 'EMP-2007', department: 'IT', hireDate: '2017-04-10', issueDate: '2024-01-15', expirationDate: '2026-01-15',
    phone1: '+1 555-0207', phone2: '', fax: '', email: 'ben.f@example.com', website: '', country: 'USA', postalCode: '98101',
    state: 'WA', city: 'Seattle', street1: '147 Cloud Ave', street2: 'Server Room 2', gradeLevel: '', securityLevel: 'Level 6',
    height: '5\'11"', weight: '180 lbs', gender: 'Male', eyeColor: 'Hazel', hairColor: 'Brown',
    profileImage: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=400&q=80',
    signature: '', fingerprint: '', divisionLogo: '', customImage: ''
  },
  {
    id: 'm8', firstName: 'Charlotte', lastName: 'Kim', nickname: 'Charli', dob: '1991-08-08', title: 'HR Specialist',
    idNumber: 'EMP-2008', employeeId: 'EMP-2008', department: 'Human Resources', hireDate: '2020-03-20', issueDate: '2024-01-15', expirationDate: '2026-01-15',
    phone1: '+1 555-0208', phone2: '', fax: '', email: 'charlotte.k@example.com', website: '', country: 'USA', postalCode: '30303',
    state: 'GA', city: 'Atlanta', street1: '258 People St', street2: '', gradeLevel: '', securityLevel: 'Level 3',
    height: '5\'7"', weight: '135 lbs', gender: 'Female', eyeColor: 'Brown', hairColor: 'Brown',
    profileImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80',
    signature: '', fingerprint: '', divisionLogo: '', customImage: ''
  },
  {
    id: 'm9', firstName: 'Daniel', lastName: 'Murphy', nickname: 'Dan', dob: '1984-05-14', title: 'Legal Counsel',
    idNumber: 'EMP-2009', employeeId: 'EMP-2009', department: 'Legal', hireDate: '2015-09-01', issueDate: '2024-01-15', expirationDate: '2026-01-15',
    phone1: '+1 555-0209', phone2: '', fax: '', email: 'daniel.m@example.com', website: '', country: 'USA', postalCode: '20001',
    state: 'DC', city: 'Washington', street1: '369 Justice Blvd', street2: 'Suite 500', gradeLevel: '', securityLevel: 'Level 6',
    height: '6\'2"', weight: '205 lbs', gender: 'Male', eyeColor: 'Blue', hairColor: 'Grey',
    profileImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80',
    signature: '', fingerprint: '', divisionLogo: '', customImage: ''
  },
  {
    id: 'm10', firstName: 'Ava', lastName: 'Martinez', nickname: 'Ava', dob: '1996-01-22', title: 'Sales Associate',
    idNumber: 'EMP-2010', employeeId: 'EMP-2010', department: 'Sales', hireDate: '2023-05-15', issueDate: '2024-01-15', expirationDate: '2026-01-15',
    phone1: '+1 555-0210', phone2: '', fax: '', email: 'ava.m@example.com', website: '', country: 'USA', postalCode: '33101',
    state: 'FL', city: 'Miami', street1: '741 Ocean Drive', street2: '', gradeLevel: '', securityLevel: 'Level 2',
    height: '5\'3"', weight: '115 lbs', gender: 'Female', eyeColor: 'Brown', hairColor: 'Brown',
    profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
    signature: '', fingerprint: '', divisionLogo: '', customImage: ''
  },
  {
    id: 'm11', firstName: 'Lucas', lastName: 'Taylor', nickname: 'Luke', dob: '1990-10-18', title: 'Content Strategist',
    idNumber: 'EMP-2011', employeeId: 'EMP-2011', department: 'Marketing', hireDate: '2021-02-10', issueDate: '2024-01-15', expirationDate: '2026-01-15',
    phone1: '+1 555-0211', phone2: '', fax: '', email: 'lucas.t@example.com', website: '', country: 'USA', postalCode: '80202',
    state: 'CO', city: 'Denver', street1: '852 Media Lane', street2: '', gradeLevel: '', securityLevel: 'Level 3',
    height: '5\'11"', weight: '175 lbs', gender: 'Male', eyeColor: 'Green', hairColor: 'Blonde',
    profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    signature: '', fingerprint: '', divisionLogo: '', customImage: ''
  },
  {
    id: 'm12', firstName: 'Isabella', lastName: 'White', nickname: 'Izzy', dob: '1994-06-05', title: 'Data Scientist',
    idNumber: 'EMP-2012', employeeId: 'EMP-2012', department: 'Engineering', hireDate: '2022-07-20', issueDate: '2024-01-15', expirationDate: '2026-01-15',
    phone1: '+1 555-0212', phone2: '', fax: '', email: 'isabella.w@example.com', website: '', country: 'USA', postalCode: '98109',
    state: 'WA', city: 'Seattle', street1: '963 Algorithm Way', street2: 'Lab 4', gradeLevel: '', securityLevel: 'Level 5',
    height: '5\'8"', weight: '140 lbs', gender: 'Female', eyeColor: 'Hazel', hairColor: 'Brown',
    profileImage: 'https://images.unsplash.com/photo-1531123897727-8f129e1bf98c?w=400&q=80',
    signature: '', fingerprint: '', divisionLogo: '', customImage: ''
  },
  {
    id: 'm13', firstName: 'Henry', lastName: 'Brooks', nickname: 'Hank', dob: '1989-11-30', title: 'Art Director',
    idNumber: 'EMP-2013', employeeId: 'EMP-2013', department: 'Design', hireDate: '2018-10-15', issueDate: '2024-01-15', expirationDate: '2026-01-15',
    phone1: '+1 555-0213', phone2: '', fax: '', email: 'henry.b@example.com', website: 'hankbrooks.art', country: 'USA', postalCode: '11201',
    state: 'NY', city: 'Brooklyn', street1: '159 Studio St', street2: 'Loft 8', gradeLevel: '', securityLevel: 'Level 4',
    height: '6\'0"', weight: '180 lbs', gender: 'Male', eyeColor: 'Blue', hairColor: 'Brown',
    profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
    signature: '', fingerprint: '', divisionLogo: '', customImage: ''
  },
  {
    id: 'm14', firstName: 'Harper', lastName: 'Scott', nickname: 'Harper', dob: '1992-02-14', title: 'Supply Chain Analyst',
    idNumber: 'EMP-2014', employeeId: 'EMP-2014', department: 'Operations', hireDate: '2020-11-01', issueDate: '2024-01-15', expirationDate: '2026-01-15',
    phone1: '+1 555-0214', phone2: '', fax: '', email: 'harper.s@example.com', website: '', country: 'USA', postalCode: '43215',
    state: 'OH', city: 'Columbus', street1: '753 Warehouse Rd', street2: '', gradeLevel: '', securityLevel: 'Level 4',
    height: '5\'5"', weight: '135 lbs', gender: 'Female', eyeColor: 'Brown', hairColor: 'Black',
    profileImage: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?w=400&q=80',
    signature: '', fingerprint: '', divisionLogo: '', customImage: ''
  },
  {
    id: 'm15', firstName: 'Samuel', lastName: 'Green', nickname: 'Sam', dob: '1986-07-09', title: 'Controller',
    idNumber: 'EMP-2015', employeeId: 'EMP-2015', department: 'Finance', hireDate: '2016-03-15', issueDate: '2024-01-15', expirationDate: '2026-01-15',
    phone1: '+1 555-0215', phone2: '', fax: '', email: 'samuel.g@example.com', website: '', country: 'USA', postalCode: '60611',
    state: 'IL', city: 'Chicago', street1: '852 Audit Ave', street2: 'Floor 10', gradeLevel: '', securityLevel: 'Level 6',
    height: '5\'11"', weight: '190 lbs', gender: 'Male', eyeColor: 'Brown', hairColor: 'Black',
    profileImage: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&q=80',
    signature: '', fingerprint: '', divisionLogo: '', customImage: ''
  },
  {
    id: 'm16', firstName: 'Evelyn', lastName: 'Lee', nickname: 'Evie', dob: '1995-09-25', title: 'Network Security',
    idNumber: 'EMP-2016', employeeId: 'EMP-2016', department: 'IT', hireDate: '2023-01-10', issueDate: '2024-01-15', expirationDate: '2026-01-15',
    phone1: '+1 555-0216', phone2: '', fax: '', email: 'evelyn.l@example.com', website: '', country: 'USA', postalCode: '27701',
    state: 'NC', city: 'Durham', street1: '951 Firewall St', street2: '', gradeLevel: '', securityLevel: 'Level 5',
    height: '5\'6"', weight: '125 lbs', gender: 'Female', eyeColor: 'Hazel', hairColor: 'Brown',
    profileImage: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&q=80',
    signature: '', fingerprint: '', divisionLogo: '', customImage: ''
  },
  {
    id: 'm17', firstName: 'Jackson', lastName: 'Hall', nickname: 'Jack', dob: '1991-04-03', title: 'Recruiter',
    idNumber: 'EMP-2017', employeeId: 'EMP-2017', department: 'Human Resources', hireDate: '2021-08-20', issueDate: '2024-01-15', expirationDate: '2026-01-15',
    phone1: '+1 555-0217', phone2: '', fax: '', email: 'jackson.h@example.com', website: '', country: 'USA', postalCode: '37203',
    state: 'TN', city: 'Nashville', street1: '159 Talent Row', street2: '', gradeLevel: '', securityLevel: 'Level 3',
    height: '6\'0"', weight: '175 lbs', gender: 'Male', eyeColor: 'Blue', hairColor: 'Blonde',
    profileImage: 'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=400&q=80',
    signature: '', fingerprint: '', divisionLogo: '', customImage: ''
  },
  {
    id: 'm18', firstName: 'Amelia', lastName: 'Adams', nickname: 'Amy', dob: '1988-12-29', title: 'Paralegal',
    idNumber: 'EMP-2018', employeeId: 'EMP-2018', department: 'Legal', hireDate: '2019-12-05', issueDate: '2024-01-15', expirationDate: '2026-01-15',
    phone1: '+1 555-0218', phone2: '', fax: '', email: 'amelia.a@example.com', website: '', country: 'USA', postalCode: '19103',
    state: 'PA', city: 'Philadelphia', street1: '753 Court Plaza', street2: 'Suite 2A', gradeLevel: '', securityLevel: 'Level 4',
    height: '5\'7"', weight: '130 lbs', gender: 'Female', eyeColor: 'Green', hairColor: 'Red',
    profileImage: 'https://images.unsplash.com/photo-1589571894960-20bbe2828d0a?w=400&q=80',
    signature: '', fingerprint: '', divisionLogo: '', customImage: ''
  },
  {
    id: 'm19', firstName: 'Sebastian', lastName: 'King', nickname: 'Seb', dob: '1994-01-17', title: 'Account Manager',
    idNumber: 'EMP-2019', employeeId: 'EMP-2019', department: 'Sales', hireDate: '2022-03-01', issueDate: '2024-01-15', expirationDate: '2026-01-15',
    phone1: '+1 555-0219', phone2: '', fax: '', email: 'sebastian.k@example.com', website: '', country: 'USA', postalCode: '85001',
    state: 'AZ', city: 'Phoenix', street1: '357 Client Way', street2: '', gradeLevel: '', securityLevel: 'Level 3',
    height: '5\'11"', weight: '185 lbs', gender: 'Male', eyeColor: 'Brown', hairColor: 'Black',
    profileImage: 'https://images.unsplash.com/photo-1517070208541-6ddc4d3efbcb?w=400&q=80',
    signature: '', fingerprint: '', divisionLogo: '', customImage: ''
  },
  {
    id: 'm20', firstName: 'Grace', lastName: 'Nelson', nickname: 'Gracie', dob: '1983-05-22', title: 'Chief Operating Officer',
    idNumber: 'EMP-2020', employeeId: 'EMP-2020', department: 'Management', hireDate: '2014-06-15', issueDate: '2024-01-15', expirationDate: '2026-01-15',
    phone1: '+1 555-0220', phone2: '', fax: '', email: 'grace.n@example.com', website: '', country: 'USA', postalCode: '94104',
    state: 'CA', city: 'San Francisco', street1: '100 Executive Dr', street2: 'Penthouse', gradeLevel: '', securityLevel: 'Level 7',
    height: '5\'8"', weight: '145 lbs', gender: 'Female', eyeColor: 'Blue', hairColor: 'Grey',
    profileImage: 'https://images.unsplash.com/photo-1508214751196-bfdd4ca4a72d?w=400&q=80',
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
  saveDesign: () => Promise<void>;
  loadDesign: (design: SavedDesign) => void;
  deleteDesign: (id: string) => Promise<void>;
  loadTemplatesFromDb: () => Promise<void>;
  syncLocalData: () => Promise<void>;
  exportDesign: (design: any) => void;
  newDesign: () => void;
  savedDesigns: SavedDesign[];
  members: Member[];
  loadMembersFromDb: () => Promise<void>;
  addMember: (member: Omit<Member, 'id'>) => Promise<void>;
  updateMember: (id: string, member: Partial<Member>) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  activeTemplateId: string | null;
  setActiveTemplateId: (id: string) => void;
  previewResults: VdpResult[];
  setPreviewResults: (results: VdpResult[]) => void;
  isGeneratingPreviews: boolean;
  setIsGeneratingPreviews: (is: boolean) => void;
  previewMemberId: string | null;
  setPreviewMemberId: (id: string | null) => void;
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
  guidelines: { horizontal: number[]; vertical: number[] };
  addGuideline: (type: 'horizontal' | 'vertical', pos: number) => void;
  updateGuideline: (type: 'horizontal' | 'vertical', index: number, pos: number) => void;
  removeGuideline: (type: 'horizontal' | 'vertical', index: number) => void;
  clearGuidelines: () => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  resetZoom: () => void;
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
  guidelines: { horizontal: [], vertical: [] },
  addGuideline: (type, pos) => set((state) => ({
    guidelines: {
      ...state.guidelines,
      [type]: [...state.guidelines[type], pos]
    }
  })),
  updateGuideline: (type, index, pos) => set((state) => ({
    guidelines: {
      ...state.guidelines,
      [type]: state.guidelines[type].map((p, i) => i === index ? pos : p)
    }
  })),
  removeGuideline: (type, index) => set((state) => ({
    guidelines: {
      ...state.guidelines,
      [type]: state.guidelines[type].filter((_, i) => i !== index)
    }
  })),
  clearGuidelines: () => set({ guidelines: { horizontal: [], vertical: [] } }),
  zoom: 1,
  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(5, zoom)) }),
  resetZoom: () => set({ zoom: 1 }),
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
      try {
        return JSON.parse(stored);
      } catch (e) {
        return [];
      }
    }
    return [];
  })(),
  loadMembersFromDb: async () => {
    try {
      const result = await fetchRecords();
      if (result && result.data) {
        const dbMembers = result.data.map((r: any) => ({ ...r.data, id: r.id }));
        set({ members: dbMembers });
        localStorage.setItem('saved_id_members', JSON.stringify(dbMembers));
      }
    } catch (e) {
      console.error("Failed to fetch records from DB", e);
    }
  },
  loadTemplatesFromDb: async () => {
    try {
      const result = await fetchTemplates();
      if (result && result.data) {
        const dbTemplates = result.data.map((r: any) => ({ ...r.design, id: r.id, name: r.name }));
        set({ savedDesigns: dbTemplates });
        localStorage.setItem('saved_id_designs', JSON.stringify(dbTemplates));
      }
    } catch (e) {
      console.error("Failed to fetch templates from DB", e);
    }
  },
  addMember: async (member) => {
    try {
      const result = await createRecord(member);
      const newMember = { ...member, id: result.id };
      set((state) => {
        const updated = [newMember, ...state.members];
        localStorage.setItem('saved_id_members', JSON.stringify(updated));
        return { members: updated, previewResults: [] };
      });
    } catch (e) {
      console.error("Failed to create record", e);
      // Fallback
      const newMember = { ...member, id: Math.random().toString(36).substr(2, 9) };
      set((state) => {
        const updated = [newMember, ...state.members];
        localStorage.setItem('saved_id_members', JSON.stringify(updated));
        return { members: updated, previewResults: [] };
      });
    }
  },
  updateMember: async (id, updatedMember) => {
    try {
      await updateRecord(id, updatedMember);
      set((state) => {
        const updated = state.members.map(m => m.id === id ? { ...m, ...updatedMember } : m);
        localStorage.setItem('saved_id_members', JSON.stringify(updated));
        return { members: updated, previewResults: [] };
      });
    } catch (e) {
      console.error("Failed to update record", e);
      set((state) => {
        const updated = state.members.map(m => m.id === id ? { ...m, ...updatedMember } : m);
        localStorage.setItem('saved_id_members', JSON.stringify(updated));
        return { members: updated, previewResults: [] };
      });
    }
  },
  deleteMember: async (id) => {
    try {
      await deleteRecord(id);
      set((state) => {
        const updated = state.members.filter(m => m.id !== id);
        localStorage.setItem('saved_id_members', JSON.stringify(updated));
        return { members: updated, previewResults: [] };
      });
    } catch (e) {
      console.error("Failed to delete record", e);
      set((state) => {
        const updated = state.members.filter(m => m.id !== id);
        localStorage.setItem('saved_id_members', JSON.stringify(updated));
        return { members: updated, previewResults: [] };
      });
    }
  },
  activeTemplateId: null,
  setActiveTemplateId: (id) => set({ activeTemplateId: id, previewResults: [] }),
  previewResults: [],
  setPreviewResults: (results) => set({ previewResults: results }),
  isGeneratingPreviews: false,
  setIsGeneratingPreviews: (is) => set({ isGeneratingPreviews: is }),
  previewMemberId: null,
  setPreviewMemberId: (id) => set({ previewMemberId: id }),
  
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

    const json = canvas.toJSON(['id', 'name', 'selectable', 'evented', 'isVariable', 'variableType', 'placeholder', 'variableColors']);
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
  


  syncLocalData: async () => {
    try {
      // Fetch fresh data from DB and update local state
      const [templatesRes, membersRes] = await Promise.all([
        fetchTemplates(),
        fetchRecords()
      ]);

      if (templatesRes && templatesRes.data) {
        const dbTemplates = templatesRes.data.map((r: any) => ({ ...r.design, id: r.id, name: r.name }));
        set({ savedDesigns: dbTemplates });
        localStorage.setItem('saved_id_designs', JSON.stringify(dbTemplates));
      }

      if (membersRes && membersRes.data) {
        const dbMembers = membersRes.data.map((r: any) => ({ ...r.data, id: r.id }));
        set({ members: dbMembers });
        localStorage.setItem('saved_id_members', JSON.stringify(dbMembers));
      }
    } catch (e) {
      console.error("Failed to sync local data with DB", e);
    }
  },

  saveDesign: async () => {
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
      
      const currentData = canvas.toJSON(['id', 'name', 'selectable', 'evented', 'isVariable', 'variableType', 'placeholder', 'variableColors']);
      const fData = isFront ? currentData : frontData;
      const bData = !isFront ? currentData : backData;
      const fThumb = isFront ? currentThumb : otherThumb;
      const bThumb = !isFront ? currentThumb : otherThumb;

      let updatedDesigns: SavedDesign[];
      let designId: string = currentDesignId || '';

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

      // Sync to DB
      try {
        const payload = {
          name: currentDesignId ? savedDesigns.find(d => d.id === currentDesignId)?.name || 'Design' : `Design ${savedDesigns.length + 1}`,
          design: updatedDesigns.find(d => d.id === designId)
        };
        if (currentDesignId) {
          await updateTemplate(designId, payload);
        } else {
          const result = await createTemplate(payload);
          // Update ID to match backend
          const actualId = result.id;
          const mappedDesigns = updatedDesigns.map(d => d.id === designId ? { ...d, id: actualId } : d);
          set({ savedDesigns: mappedDesigns, currentDesignId: actualId, activeTemplateId: actualId });
          localStorage.setItem('saved_id_designs', JSON.stringify(mappedDesigns));
        }
      } catch (e) {
        console.error("Failed to sync template to DB", e);
      }
    };

    await runSave();
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

  deleteDesign: async (id) => {
    const design = get().savedDesigns.find(d => d.id === id);
    const updated = get().savedDesigns.filter(d => d.id !== id);
    set({ savedDesigns: updated });
    localStorage.setItem('saved_id_designs', JSON.stringify(updated));
    get().showModal({
      title: 'Deleted',
      message: `"${design?.name || 'Design'}" has been removed from your library.`,
      type: 'info'
    });

    try {
      await deleteTemplate(id);
    } catch (e) {
      console.error("Failed to delete template from DB", e);
    }
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
