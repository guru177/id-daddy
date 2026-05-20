import React, { useState, useRef, useEffect } from 'react';
import { Plus, ChevronUp, Image as ImageIcon, X, Settings, Upload, Download, FolderUp, FileSpreadsheet, Search, ChevronLeft, ChevronRight, Sparkles, RotateCcw, Folder, FolderPlus, FolderOpen, MoreVertical, Pencil, Trash2, ArrowLeft, Users } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useDesignerStore, DEFAULT_ENABLED_FIELDS, DEFAULT_ENABLED_IMAGE_FIELDS } from './store';
import { useShallow } from 'zustand/react/shallow';
import { useAuthStore } from '../store';
import { api } from '../api';

const initialFormState = {
  firstName: '', lastName: '', nickname: '', dob: '', title: '', idNumber: '',
  employeeId: '', department: '', hireDate: '', issueDate: '', expirationDate: '',
  phone1: '', phone2: '', fax: '', email: '', website: '', country: '', postalCode: '',
  state: '', city: '', street1: '', street2: '', gradeLevel: '', securityLevel: '',
  height: '', weight: '', gender: '', eyeColor: '', hairColor: '', profileImage: '',
  signature: '', fingerprint: '', divisionLogo: '', customImage: '',
  bloodGroup: '', parentName: '', parentPhone: '', emergencyContact: '', emergencyPhone: '',
  rfidNo: '', busRoute: '', hostelName: '', roomNo: '', role: 'Student'
};
const STANDARD_FIELDS = [
  'First Name', 'Last Name', 'Nickname', 'Date of Birth', 'Title', 'ID number',
  'Employee ID', 'Department', 'Hire Date', 'Issue Date', 'Expiration Date',
  'Phone 1', 'Fax', 'Email', 'Website', 'Country', 'Postal Code', 'State', 'City',
  'Street 1', 'Street 2', 'Grade Level', 'Security Level', 'Height', 'Weight',
  'Gender', 'Eye color', 'Hair color', 'Blood Group', 'Parent Name', 'Parent Phone',
  'Emergency Contact', 'Emergency Phone', 'RFID No', 'Bus Route', 'Hostel Name', 'Room No', 'Role'
];
const STANDARD_IMAGE_FIELDS = ['Signature', 'Fingerprint', 'Division Logo'];


// Section Subcomponent
const Section = ({ title, children }: { title: string, children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="pt-2">
      <div
        className="flex items-center gap-2 mb-6 cursor-pointer group"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h2 className="text-[11px] font-black text-gray-900 group-hover:text-green-600 transition-colors">{title}</h2>
        <ChevronUp size={14} className={`text-gray-900 transition-transform duration-300 ${isOpen ? '' : 'rotate-180'}`} />
      </div>
      {isOpen && (
        <div className="animate-in slide-in-from-top-2 fade-in duration-300">
          {children}
        </div>
      )}
      <div className="h-px bg-gray-100 w-full mt-8" />
    </div>
  );
};

// Form Field Subcomponent
const FormField = ({ label, placeholder, required = false, value, onChange, originalLabel }: { label: string, placeholder?: string, required?: boolean, value: string, onChange: (v: string) => void, originalLabel?: string }) => {
  const { formConfig } = useDesignerStore();
  const idToMatch = originalLabel || label;
  if (formConfig && idToMatch !== 'First Name' && !formConfig.enabledFields.includes(idToMatch)) {
    return null;
  }
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-black text-gray-900 tracking-wide">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-900 placeholder-gray-300 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
      />
    </div>
  );
};

export const DataUpload = () => {
  const { members, deleteMember, addMember, updateMember, showModal, organizationType, setOrganizationType, formConfig, setFormConfig, isProcessingBulkBG, setIsProcessingBulkBG, bgProgress, setBgProgress, selectedMembers, setSelectedMembers, folders, createFolder, renameFolder, deleteFolder, moveMemberToFolder, loadMembersFromDb, loadFoldersFromDb } = useDesignerStore(useShallow(state => ({
    members: state.members, deleteMember: state.deleteMember, addMember: state.addMember, updateMember: state.updateMember, showModal: state.showModal, organizationType: state.organizationType, setOrganizationType: state.setOrganizationType, formConfig: state.formConfig, setFormConfig: state.setFormConfig, isProcessingBulkBG: state.isProcessingBulkBG, setIsProcessingBulkBG: state.setIsProcessingBulkBG, bgProgress: state.bgProgress, setBgProgress: state.setBgProgress, selectedMembers: state.selectedMembers, setSelectedMembers: state.setSelectedMembers, folders: state.folders, createFolder: state.createFolder, renameFolder: state.renameFolder, deleteFolder: state.deleteFolder, moveMemberToFolder: state.moveMemberToFolder, loadMembersFromDb: state.loadMembersFromDb, loadFoldersFromDb: state.loadFoldersFromDb
  })));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempConfig, setTempConfig] = useState<{ enabledFields: string[], customFields: string[], enabledImageFields: string[], customImageFields: string[] }>({ enabledFields: DEFAULT_ENABLED_FIELDS, customFields: [], enabledImageFields: DEFAULT_ENABLED_IMAGE_FIELDS, customImageFields: [] });
  const [tempOrganizationType, setTempOrganizationType] = useState<'corporate' | 'education' | 'healthcare'>('corporate');
  const [formData, setFormData] = useState(initialFormState);
  const [customFieldsList, setCustomFieldsList] = useState<{ label: string, value: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);
  const bulkImageInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSavingMember, setIsSavingMember] = useState(false);

  // File-manager view state
  const [view, setView] = useState<'folders' | 'members'>('folders'); // 'folders' = landing, 'members' = inside folder
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null); // null = All Members
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renamingFolderName, setRenamingFolderName] = useState('');
  const [movingMemberId, setMovingMemberId] = useState<string | null>(null);
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);
  const [deleteFolderWithMembers, setDeleteFolderWithMembers] = useState(false);

  const [imageViewerMemberId, setImageViewerMemberId] = useState<string | null>(null);

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [bulkBgColor, setBulkBgColor] = useState('#ffffff');

  const filteredMembers = members.filter(m => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const fullName = `${m.firstName || ''} ${m.lastName || ''}`.toLowerCase();
    const idNum = String(m.idNumber || '').toLowerCase();
    const empId = String(m.employeeId || '').toLowerCase();
    const dept = (m.department || '').toLowerCase();
    return fullName.includes(query) || idNum.includes(query) || empId.includes(query) || dept.includes(query);
  });

  const folderFilteredMembers = members.filter(m => {
    const matchesSearch = !searchQuery || (() => {
      const q = searchQuery.toLowerCase();
      return ` `.toLowerCase().includes(q)
        || String(m.idNumber||'').toLowerCase().includes(q)
        || String(m.employeeId||'').toLowerCase().includes(q)
        || String(m.department||'').toLowerCase().includes(q);
    })();
    const matchesFolder = selectedFolderId === null ? true : (m.folderId ?? null) === selectedFolderId;
    return matchesSearch && matchesFolder;
  });

  // Sync members and folders from the server on every mount.
  // This is critical for SUPER_ADMIN who never visits the Dashboard
  // (the only other place that calls loadMembersFromDb).
  useEffect(() => {
    void loadMembersFromDb();
    void loadFoldersFromDb();
  }, []);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, itemsPerPage, selectedFolderId, view]);
  const totalPages = Math.ceil(folderFilteredMembers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMembers = folderFilteredMembers.slice(startIndex, startIndex + itemsPerPage);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = new Set(folderFilteredMembers.map(m => m.id));
      setSelectedMembers(allIds);
    } else {
      setSelectedMembers(new Set());
    }
  };

  const handleSelectMember = (id: string, checked: boolean) => {
    const next = new Set(selectedMembers);
    if (checked) {
      next.add(id);
    } else {
      next.delete(id);
    }
    setSelectedMembers(next);
  };

  const getErrorMessage = (error: unknown) => error instanceof Error ? error.message : 'Please try again.';

  const handleBulkDelete = async () => {
    let failedCount = 0;

    for (const id of selectedMembers) {
      try {
        await deleteMember(id);
      } catch (error) {
        failedCount++;
        console.error("Failed to delete member", error);
      }
    }

    setSelectedMembers(new Set());
    setIsDeleteConfirmOpen(false);
    showModal({
      title: failedCount ? 'Delete Failed' : 'Success',
      message: failedCount
        ? `${failedCount} member${failedCount === 1 ? '' : 's'} could not be deleted from the database.`
        : 'Selected members have been deleted.',
      type: failedCount ? 'error' : 'info'
    });
  };

  const handleDownloadTemplate = () => {
    const config = formConfig || { enabledFields: DEFAULT_ENABLED_FIELDS, customFields: [], enabledImageFields: DEFAULT_ENABLED_IMAGE_FIELDS, customImageFields: [] };

    const row: any = {};

    STANDARD_FIELDS.forEach(f => {
      if (config.enabledFields.includes(f)) {
        row[getLabel(f, organizationType)] = '';
      }
    });

    config.customFields.forEach(cf => {
      if (config.enabledFields.includes(cf)) {
        row[cf] = '';
      }
    });

    row['Profile Image'] = '';

    STANDARD_IMAGE_FIELDS.forEach(f => {
      if (config.enabledImageFields?.includes(f)) {
        row[f] = '';
      }
    });

    config.customImageFields?.forEach(cf => {
      if (config.enabledImageFields?.includes(cf)) {
        row[cf] = '';
      }
    });

    const worksheet = XLSX.utils.json_to_sheet([row]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, "ID_Daddy_Template.xlsx");
  };

  const handleExportExcel = () => {
    if (members.length === 0) return;

    const config = formConfig || { enabledFields: DEFAULT_ENABLED_FIELDS, customFields: [], enabledImageFields: DEFAULT_ENABLED_IMAGE_FIELDS, customImageFields: [] };

    const exportData = members.map(m => {
      const row: any = {};
      
      const standardMap: Record<string, any> = {
        'First Name': m.firstName,
        'Last Name': m.lastName,
        'Nickname': m.nickname,
        'Date of Birth': m.dob,
        'Title': m.title,
        'ID number': m.idNumber,
        'Employee ID': m.employeeId,
        'Department': m.department,
        'Hire Date': m.hireDate,
        'Issue Date': m.issueDate,
        'Expiration Date': m.expirationDate,
        'Phone 1': m.phone1,
        'Phone 2': m.phone2,
        'Fax': m.fax,
        'Email': m.email,
        'Website': m.website,
        'Country': m.country,
        'Postal Code': m.postalCode,
        'State': m.state,
        'City': m.city,
        'Street 1': m.street1,
        'Street 2': m.street2,
        'Grade Level': m.gradeLevel,
        'Security Level': m.securityLevel,
        'Height': m.height,
        'Weight': m.weight,
        'Gender': m.gender,
        'Eye Color': m.eyeColor,
        'Hair Color': m.hairColor,
        'Blood Group': m.bloodGroup,
        'Parent Name': m.parentName,
        'Parent Phone': m.parentPhone,
        'Emergency Contact': m.emergencyContact,
        'Emergency Phone': m.emergencyPhone,
        'RFID No': m.rfidNo,
        'Bus Route': m.busRoute,
        'Hostel Name': m.hostelName,
        'Room No': m.roomNo,
        'Role': m.role,
      };

      row['First Name'] = m.firstName;

      STANDARD_FIELDS.forEach(f => {
        if (f !== 'First Name' && config.enabledFields.includes(f)) {
          row[getLabel(f, organizationType)] = standardMap[f];
        }
      });

      config.customFields.forEach(cf => {
        if (config.enabledFields.includes(cf)) {
          const val = m.customFields?.[cf];
          row[cf] = val?.startsWith('data:image') ? '[Image Attached]' : val;
        }
      });

      row['Profile Image'] = m.profileImage?.startsWith('data:image') ? '[Image Attached]' : m.profileImage;

      const imageMap: Record<string, any> = {
        'Signature': m.signature,
        'Fingerprint': m.fingerprint,
        'Division Logo': m.divisionLogo,
      };

      STANDARD_IMAGE_FIELDS.forEach(f => {
        if (config.enabledImageFields?.includes(f)) {
          const val = imageMap[f];
          row[f] = val?.startsWith('data:image') ? '[Image Attached]' : val;
        }
      });

      config.customImageFields?.forEach(cf => {
        if (config.enabledImageFields?.includes(cf)) {
          const val = m.customFields?.[cf];
          row[cf] = val?.startsWith('data:image') ? '[Image Attached]' : val;
        }
      });

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Members");
    XLSX.writeFile(workbook, "ID_Daddy_Members.xlsx");
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true, dateNF: 'yyyy-mm-dd' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { raw: false, dateNF: 'yyyy-mm-dd' });

        let importedCount = 0;
        let skippedCount = 0;
        let failedCount = 0;
        let firstErrorMessage = '';

        const user = useAuthStore.getState().user;
        const isFreeTrial = user?.plan === 'FREE_TRIAL';
        let limit = 50;
        
        if (isFreeTrial) {
          try {
            const sysSettings = await api<any>("/auth/system-settings");
            limit = sysSettings?.FREE_TRIAL_LIMIT ?? 50;
          } catch (e) {
            console.error("Failed to fetch fresh settings");
          }
        }

        const toCreate: any[] = [];
        const toUpdate: { id: string, data: any }[] = [];

        for (const row of data as any[]) {
          try {
          const getVal = (possibleKeys: string[]) => {
            for (const k of possibleKeys) {
              const exact = row[k];
              if (exact !== undefined && exact !== null && exact !== '') return String(exact);
              const keyMatch = Object.keys(row).find(rk => rk.toLowerCase().replace(/\s/g, '') === k.toLowerCase().replace(/\s/g, ''));
              if (keyMatch !== undefined) return row[keyMatch] !== undefined && row[keyMatch] !== null ? String(row[keyMatch]) : '';
            }
            return '';
          };

          // Normalize any date format (JS Date string, serial, ISO) to YYYY-MM-DD
          const getDateVal = (possibleKeys: string[]) => {
            const raw = getVal(possibleKeys);
            if (!raw) return '';
            const d = new Date(raw);
            if (!isNaN(d.getTime())) {
              const yyyy = d.getFullYear();
              const mm = String(d.getMonth() + 1).padStart(2, '0');
              const dd = String(d.getDate()).padStart(2, '0');
              return `${yyyy}-${mm}-${dd}`;
            }
            return raw;
          };

          const newMember = {
            firstName: getVal(['First Name', 'FirstName', 'First', 'Name']),
            lastName: getVal(['Last Name', 'LastName', 'Last']),
            nickname: getVal(['Nickname']),
            dob: getDateVal(['Date of Birth', 'Date Of Birth', 'DOB', 'Birthday']),
            title: getVal(['Title', 'Position']),
            idNumber: getVal(['ID number', 'ID Number', 'IDNumber', 'ID No', 'IDNo']),
            employeeId: getVal(['Employee ID', 'EmployeeID', 'EmpID']),
            department: getVal(['Department', 'Dept', 'Grade/Class', 'Class']),
            hireDate: getDateVal(['Hire Date', 'HireDate']),
            issueDate: getDateVal(['Issue Date', 'IssueDate']),
            expirationDate: getDateVal(['Expiration Date', 'ExpDate', 'Expiry']),
            phone1: getVal(['Phone 1', 'Phone', 'Phone1', 'Mobile']),
            phone2: getVal(['Phone 2', 'Phone2']),
            fax: getVal(['Fax']),
            email: getVal(['Email', 'Email Address']),
            website: getVal(['Website', 'Web', 'URL']),
            country: getVal(['Country']),
            postalCode: getVal(['Postal Code', 'Zip Code', 'Zip']),
            state: getVal(['State', 'Province']),
            city: getVal(['City']),
            street1: getVal(['Street 1', 'Street', 'Address', 'Address 1']),
            street2: getVal(['Street 2', 'Address 2']),
            gradeLevel: getVal(['Grade Level']),
            securityLevel: getVal(['Security Level', 'Clearance']),
            height: getVal(['Height']),
            weight: getVal(['Weight']),
            gender: getVal(['Gender', 'Sex']),
            eyeColor: getVal(['Eye Color', 'Eye color', 'Eyes']),
            hairColor: getVal(['Hair Color', 'Hair color', 'Hair']),
            bloodGroup: getVal(['Blood Group', 'BloodGroup', 'Blood Type']),
            parentName: getVal(['Parent Name', 'ParentName', 'Guardian Name', 'Guardian']),
            parentPhone: getVal(['Parent Phone', 'ParentPhone', 'Guardian Phone']),
            emergencyContact: getVal(['Emergency Contact', 'EmergencyContact']),
            emergencyPhone: getVal(['Emergency Phone', 'EmergencyPhone']),
            rfidNo: getVal(['RFID No', 'RFID', 'RFIDNo']),
            busRoute: getVal(['Bus Route', 'BusRoute', 'Bus']),
            hostelName: getVal(['Hostel Name', 'HostelName', 'Hostel']),
            roomNo: getVal(['Room No', 'RoomNo', 'Room']),
            role: getVal(['Role']),
            profileImage: getVal(['Profile Image', 'Photo', 'Image', 'Picture']),
            signature: getVal(['Signature', 'Sign']),
            fingerprint: getVal(['Fingerprint', 'Thumbprint']),
            divisionLogo: getVal(['Division Logo', 'Logo', 'Dept Logo']),
            customFields: {} as Record<string, string>
          };

          const knownFields = ['First Name', 'FirstName', 'First', 'Name', 'Last Name', 'LastName', 'Last', 'Nickname', 'Date of Birth', 'Date Of Birth', 'DOB', 'Birthday', 'Title', 'Position', 'ID number', 'ID Number', 'IDNumber', 'ID No', 'IDNo', 'Employee ID', 'EmployeeID', 'EmpID', 'Department', 'Dept', 'Grade/Class', 'Class', 'Hire Date', 'HireDate', 'Issue Date', 'IssueDate', 'Expiration Date', 'ExpDate', 'Expiry', 'Phone 1', 'Phone', 'Phone1', 'Mobile', 'Phone 2', 'Phone2', 'Fax', 'Email', 'Email Address', 'Website', 'Web', 'URL', 'Country', 'Postal Code', 'Zip Code', 'Zip', 'State', 'Province', 'City', 'Street 1', 'Street', 'Address', 'Address 1', 'Street 2', 'Address 2', 'Grade Level', 'Security Level', 'Clearance', 'Height', 'Weight', 'Gender', 'Sex', 'Eye Color', 'Eye color', 'Eyes', 'Hair Color', 'Hair color', 'Hair', 'Blood Group', 'BloodGroup', 'Blood Type', 'Parent Name', 'ParentName', 'Guardian Name', 'Guardian', 'Parent Phone', 'ParentPhone', 'Guardian Phone', 'Emergency Contact', 'EmergencyContact', 'Emergency Phone', 'EmergencyPhone', 'RFID No', 'RFID', 'RFIDNo', 'Bus Route', 'BusRoute', 'Bus', 'Hostel Name', 'HostelName', 'Hostel', 'Room No', 'RoomNo', 'Room', 'Role', 'Profile Image', 'Photo', 'Image', 'Picture', 'Signature', 'Sign', 'Fingerprint', 'Thumbprint', 'Division Logo', 'Logo', 'Dept Logo'];

          Object.keys(row).forEach(k => {
            const val = row[k];
            const isKnown = knownFields.some(kf => kf.toLowerCase().replace(/\s/g, '') === k.toLowerCase().replace(/\s/g, ''));
            if (!isKnown && val && !k.startsWith('__EMPTY')) {
              newMember.customFields[k] = String(val);
            }
          });

          if (newMember.firstName || newMember.lastName) {
            const currentMembers = useDesignerStore.getState().members;

            // Deduplication logic: Match by Employee ID, ID Number, or Full Name
            const existingMember = currentMembers.find(m => {
              if (m.employeeId && newMember.employeeId && String(m.employeeId).toLowerCase() === String(newMember.employeeId).toLowerCase()) return true;
              if (m.idNumber && newMember.idNumber && String(m.idNumber).toLowerCase() === String(newMember.idNumber).toLowerCase()) return true;

              const mName = `${m.firstName || ''} ${m.lastName || ''}`.trim().toLowerCase();
              const newName = `${newMember.firstName || ''} ${newMember.lastName || ''}`.trim().toLowerCase();
              if (mName && newName && mName === newName) return true;

              return false;
            });

            // Prevent overwriting existing images with the "[Image Attached]" export placeholder
            const cleanNewMember: any = { ...newMember };
            ['profileImage', 'signature', 'fingerprint', 'divisionLogo'].forEach(imgField => {
              if (cleanNewMember[imgField] === '[Image Attached]') {
                delete cleanNewMember[imgField];
              }
            });

            if (existingMember) {
              toUpdate.push({ id: existingMember.id, data: cleanNewMember });
            } else {
              const currentLength = useDesignerStore.getState().members.length + toCreate.length;
              if (isFreeTrial && currentLength >= limit) {
                skippedCount++;
                continue;
              }
              // Ensure we don't save the placeholder text for new members either
              ['profileImage', 'signature', 'fingerprint', 'divisionLogo'].forEach(imgField => {
                if (cleanNewMember[imgField] === '[Image Attached]') cleanNewMember[imgField] = '';
              });
              toCreate.push({ ...cleanNewMember, customImage: '', folderId: selectedFolderId ?? undefined });
            }
          }
          } catch (error) {
            failedCount++;
            if (!firstErrorMessage) {
              const getErrorMessage = (err: any) => err instanceof Error ? err.message : String(err);
              firstErrorMessage = getErrorMessage(error);
            }
            console.error("Failed to parse member row", error);
          }
        }

        try {
          if (toCreate.length > 0 || toUpdate.length > 0) {
            await useDesignerStore.getState().bulkUpsertMembers({ create: toCreate, update: toUpdate });
            importedCount = toCreate.length + toUpdate.length;
          }
        } catch (error) {
          failedCount += toCreate.length + toUpdate.length;
          const getErrorMessage = (err: any) => err instanceof Error ? err.message : String(err);
          if (!firstErrorMessage) firstErrorMessage = getErrorMessage(error);
          console.error("Bulk upsert failed", error);
        }

        const extraMsg = skippedCount > 0 ? `\n\nNote: ${skippedCount} records were skipped because you reached your Free Trial limit of ${limit} members. Upgrade your plan to add unlimited members.` : '';
        showModal({
          title: failedCount > 0
            ? 'Import Complete with Errors'
            : skippedCount > 0
              ? 'Import Complete with Skipped Records'
              : 'Import Successful',
          message: `Successfully imported ${importedCount} members from Excel.`
            + extraMsg
            + (failedCount > 0
              ? `\n\n${failedCount} record${failedCount === 1 ? '' : 's'} could not be saved to the database.${firstErrorMessage ? ` First error: ${firstErrorMessage}` : ''}`
              : ''),
          type: failedCount > 0 || skippedCount > 0 ? 'error' : 'info'
        });
      } catch (err) {
        showModal({
          title: 'Import Failed',
          message: 'Could not parse the Excel file. Please check the format.',
          type: 'error'
        });
      }
      if (excelInputRef.current) excelInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  const handleBulkImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    let matchCount = 0;
    const membersUpdates = new Map<string, Partial<typeof initialFormState & { customFields: Record<string, string> }>>();

    // Process all files sequentially to avoid complex race conditions
    for (const file of Array.from(files)) {
      const fileName = file.name;
      const fileNameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;

      let fieldToUpdate = '';

      let memberToUpdate = members.find(m => {
        const standardFields = ['profileImage', 'signature', 'fingerprint', 'divisionLogo'];
        for (const field of standardFields) {
          const val = m[field as keyof typeof m] as string | undefined;
          if (val && !val.startsWith('data:image')) {
            const cleanVal = val.trim().toLowerCase();
            if (cleanVal === fileName.toLowerCase() || cleanVal === fileNameWithoutExt.toLowerCase()) {
              fieldToUpdate = field;
              return true;
            }
          }
        }

        if (m.customFields) {
          for (const key of Object.keys(m.customFields)) {
            const val = m.customFields[key];
            if (val && typeof val === 'string' && !val.startsWith('data:image')) {
              const cleanVal = val.trim().toLowerCase();
              if (cleanVal === fileName.toLowerCase() || cleanVal === fileNameWithoutExt.toLowerCase()) {
                fieldToUpdate = `custom:${key}`;
                return true;
              }
            }
          }
        }
        return false;
      });

      // Fallback: If no explicit field match was found in the Excel data, 
      // automatically try matching the filename to the member's identity fields
      if (!memberToUpdate) {
        memberToUpdate = members.find(m => {
          const fullName = `${m.firstName || ''} ${m.lastName || ''}`.trim().toLowerCase();
          const fileLower = fileNameWithoutExt.toLowerCase();
          const fileLowerSpaces = fileLower.replace(/_/g, ' ').replace(/-/g, ' ');
          if (
            (m.idNumber && String(m.idNumber).toLowerCase() === fileLower) ||
            (m.employeeId && String(m.employeeId).toLowerCase() === fileLower) ||
            (m.rfidNo && String(m.rfidNo).toLowerCase() === fileLower) ||
            (fullName && fullName === fileLower) ||
            (fullName && fullName === fileLowerSpaces)
          ) {
            fieldToUpdate = 'profileImage';
            return true;
          }
          return false;
        });
      }

      if (memberToUpdate && fieldToUpdate !== '') {
        // Wait for base64
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (f) => resolve(f.target?.result as string);
          reader.readAsDataURL(file);
        });

        // Accumulate
        const existingUpdate = membersUpdates.get(memberToUpdate.id) || {};
        if (fieldToUpdate.startsWith('custom:')) {
          const customKey = fieldToUpdate.split('custom:')[1];
          const existingCustomFields = existingUpdate.customFields || memberToUpdate.customFields || {};
          existingUpdate.customFields = {
            ...existingCustomFields,
            [customKey]: base64
          };
        } else {
          (existingUpdate as any)[fieldToUpdate] = base64;
        }
        membersUpdates.set(memberToUpdate.id, existingUpdate);
        matchCount++;
      }
    }

    // Apply accumulated updates
    let failedCount = 0;
    for (const [id, update] of membersUpdates) {
      try {
        await updateMember(id, update as any);
      } catch (error) {
        failedCount++;
        console.error("Failed to update member image", error);
      }
    }

    showModal({
      title: failedCount ? 'Bulk Upload Complete with Errors' : 'Bulk Upload Complete',
      message: `Successfully matched ${matchCount - failedCount} images to member profiles out of ${files.length} uploaded files.`
        + (failedCount ? ` ${failedCount} update${failedCount === 1 ? '' : 's'} could not be saved to the database.` : ''),
      type: failedCount ? 'error' : 'info'
    });

    if (bulkImageInputRef.current) bulkImageInputRef.current.value = '';
  };

  useEffect(() => {
    if (!isModalOpen) return;

    // Only truly user-added custom fields — never standard fields or standard image fields
    const allStandardLabels = new Set([
      ...STANDARD_FIELDS,
      ...STANDARD_IMAGE_FIELDS,
      // also cover alternate casings/spacing that might be stored
      'First Name', 'Last Name', 'Nickname', 'Date of Birth', 'Title', 'ID number',
      'Employee ID', 'Department', 'Hire Date', 'Issue Date', 'Expiration Date',
      'Phone 1', 'Phone 2', 'Fax', 'Email', 'Website', 'Country', 'Postal Code',
      'State', 'City', 'Street 1', 'Street 2', 'Grade Level', 'Security Level',
      'Height', 'Weight', 'Gender', 'Eye color', 'Hair color', 'Blood Group',
      'Parent Name', 'Parent Phone', 'Emergency Contact', 'Emergency Phone',
      'RFID No', 'Bus Route', 'Hostel Name', 'Room No', 'Role',
      'Signature', 'Fingerprint', 'Division Logo',
    ]);

    const activeCustomFields = (formConfig?.customFields || [])
      .filter(cf => formConfig!.enabledFields.includes(cf) && !allStandardLabels.has(cf));

    const activeCustomImageFields = (formConfig?.customImageFields || [])
      .filter(cf => (formConfig?.enabledImageFields || []).includes(cf) && !allStandardLabels.has(cf));

    if (editingMemberId) {
      // EDIT mode: pre-fill custom field values from the member being edited
      const member = members.find(m => m.id === editingMemberId);
      const memberCustomFields = member?.customFields || {};

      const combined = [
        ...activeCustomFields.map(cf => ({
          label: cf,
          value: String(memberCustomFields[cf] ?? '')
        })),
        ...activeCustomImageFields.map(cf => ({
          label: cf,
          value: String(memberCustomFields[cf] ?? '')
        }))
      ];
      setCustomFieldsList(combined);
    } else {
      // ADD mode: start with empty values
      const combined = [
        ...activeCustomFields.map(cf => ({ label: cf, value: '' })),
        ...activeCustomImageFields.map(cf => ({ label: cf, value: '' }))
      ];
      setCustomFieldsList(combined);
    }
  }, [isModalOpen, formConfig, editingMemberId, members]);

  const handleChange = (field: keyof typeof initialFormState, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getLabel = (field: string, explicitType?: string) => {
    const typeToCheck = explicitType || organizationType;
    if (typeToCheck === 'education') {
      if (field === 'Employee ID') return 'Student/Staff ID';
      if (field === 'Department') return 'Grade/Class';
      if (field === 'Title') return 'Role (Student/Faculty)';
      if (field === 'Hire Date') return 'Enrollment Date';
      if (field === 'Employment Details') return 'School Details';
    } else if (typeToCheck === 'healthcare') {
      if (field === 'Employee ID') return 'Staff ID';
      if (field === 'Department') return 'Department/Ward';
      if (field === 'Title') return 'Role/Specialty';
    }
    return field;
  };

  const handleSave = async () => {
    if (!formData.firstName) {
      showModal({
        title: 'Missing Field',
        message: 'First Name is required.',
        type: 'error'
      });
      return;
    }

    const customFieldsRecord: Record<string, string> = {};
    customFieldsList.forEach(f => {
      if (f.label.trim()) {
        customFieldsRecord[f.label.trim()] = f.value;
      }
    });

    setIsSavingMember(true);
    try {
      if (editingMemberId) {
        await updateMember(editingMemberId, { ...formData, customFields: customFieldsRecord } as any);
      } else {
        await addMember({ ...formData, customFields: customFieldsRecord, folderId: selectedFolderId ?? undefined } as any);
      }

      setFormData(initialFormState);
      setCustomFieldsList([]);
      setIsModalOpen(false);
      setEditingMemberId(null);

      showModal({
        title: 'Success',
        message: editingMemberId
          ? `${formData.firstName}'s data has been updated.`
          : `${formData.firstName} has been added to your members list.`,
        type: 'info'
      });
    } catch (error) {
      showModal({
        title: 'Save Failed',
        message: `${formData.firstName}'s data was not saved to the database. ${getErrorMessage(error)}`,
        type: 'error'
      });
    } finally {
      setIsSavingMember(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (f) => {
        handleChange('profileImage', f.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F4EFE6] overflow-hidden text-gray-900">

      {/* ══════════════════════════════════════════════════════
           FOLDER GRID VIEW  (landing screen)
          ══════════════════════════════════════════════════════ */}
      {view === 'folders' && (
        <div className="flex flex-col h-full">
          {/* Folder view header */}
          <div className="bg-[#FAF7F2] border-b border-[#E8DFD0] px-6 lg:px-8 py-5 flex flex-wrap items-center justify-between gap-4 shrink-0 z-10">
            <div>
              <h1 className="text-xl font-black text-gray-900">Data Upload</h1>
              <p className="text-xs text-gray-400 mt-0.5 font-medium">Select a folder to view or add members</p>
            </div>
            <div className="flex items-center gap-3">
              {/* New folder button — green gradient */}
              <button
                data-tour="upload-new-folder"
                onClick={() => setIsCreatingFolder(true)}
                className="h-9 flex items-center gap-2 px-5 rounded-xl bg-gradient-to-br from-[#1a5d1a] to-[#2d7a2d] text-white text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm shadow-green-900/20"
              >
                <FolderPlus size={14} /> New Folder
              </button>
            </div>
          </div>

          {/* ── Create Folder Modal ── */}
          {isCreatingFolder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => { setIsCreatingFolder(false); setNewFolderName(''); }}>
              <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-in zoom-in-95 fade-in duration-200"
                onClick={e => e.stopPropagation()}
              >
                {/* Modal header */}
                <div className="bg-gradient-to-br from-[#1a5d1a] to-[#2d7a2d] px-6 py-5 flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
                    <FolderPlus size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-white">Create New Folder</h2>
                    <p className="text-[11px] text-green-200 font-medium mt-0.5">Organise your members into folders</p>
                  </div>
                </div>

                {/* Modal body */}
                <div className="px-6 py-6">
                  <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2">Folder Name</label>
                  <input
                    autoFocus
                    type="text"
                    value={newFolderName}
                    onChange={e => setNewFolderName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && newFolderName.trim()) { createFolder(newFolderName.trim()); setNewFolderName(''); setIsCreatingFolder(false); }
                      if (e.key === 'Escape') { setIsCreatingFolder(false); setNewFolderName(''); }
                    }}
                    placeholder="e.g. Grade 10 — Section A"
                    className="w-full h-11 px-4 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1a5d1a] focus:ring-4 focus:ring-green-500/10 transition-all bg-gray-50 font-medium"
                  />
                </div>

                {/* Modal footer */}
                <div className="px-6 pb-6 flex gap-3">
                  <button
                    onClick={() => { setIsCreatingFolder(false); setNewFolderName(''); }}
                    className="flex-1 h-10 rounded-xl border-2 border-gray-200 text-gray-600 text-[11px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
                  >
                    Discard
                  </button>
                  <button
                    onClick={() => {
                      if (newFolderName.trim()) {
                        createFolder(newFolderName.trim());
                        setNewFolderName('');
                        setIsCreatingFolder(false);
                      }
                    }}
                    disabled={!newFolderName.trim()}
                    className="flex-1 h-10 rounded-xl bg-gradient-to-br from-[#1a5d1a] to-[#2d7a2d] text-white text-[11px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                  >
                    <FolderPlus size={13} /> Create Folder
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Folder grid */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">

              {/* All Members card */}
              <button
                data-tour="upload-all-members"
                onClick={() => { setSelectedFolderId(null); setView('members'); }}
                className="group flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border-2 border-gray-100 hover:border-[#1a5d1a] hover:shadow-lg hover:shadow-green-900/5 transition-all p-6 aspect-square hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center group-hover:bg-green-100 transition-colors">
                  <Users size={28} className="text-[#1a5d1a]" />
                </div>
                <div className="text-center w-full">
                  <p className="text-base font-black text-gray-900 truncate w-full">All Members</p>
                  <p className="text-xs text-gray-500 font-bold mt-0.5">{members.length} records</p>
                </div>
              </button>

              {/* User folders */}
              {folders.map(folder => {
                const count = members.filter(m => m.folderId === folder.id).length;
                const isRenaming = renamingFolderId === folder.id;
                return (
                  <div key={folder.id} className="relative group">
                    {isRenaming ? (
                      <div className="flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border-2 border-blue-400 p-6 aspect-square">
                        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center">
                          <Folder size={28} className="text-blue-500" />
                        </div>
                        <input
                          autoFocus
                          type="text"
                          value={renamingFolderName}
                          onChange={e => setRenamingFolderName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && renamingFolderName.trim()) { renameFolder(folder.id, renamingFolderName.trim()); setRenamingFolderId(null); }
                            if (e.key === 'Escape') setRenamingFolderId(null);
                          }}
                          onBlur={() => { if (renamingFolderName.trim()) renameFolder(folder.id, renamingFolderName.trim()); setRenamingFolderId(null); }}
                          className="w-full text-center text-xs border border-blue-400 rounded-lg px-2 py-1 focus:outline-none"
                        />
                      </div>
                    ) : (
                      <button
                        onClick={() => { setSelectedFolderId(folder.id); setView('members'); }}
                        className="w-full group flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border-2 border-gray-100 hover:border-[#1a5d1a] hover:shadow-lg hover:shadow-green-900/5 transition-all p-6 aspect-square hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                          <Folder size={28} className="text-amber-500" />
                        </div>
                        <div className="text-center w-full">
                          <p className="text-base font-black text-gray-900 truncate w-full">{folder.name}</p>
                          <p className="text-xs text-gray-500 font-bold mt-0.5">{count} records</p>
                        </div>
                      </button>
                    )}

                    {/* Folder context actions (hover) */}
                    {!isRenaming && (
                      <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={e => { e.stopPropagation(); setRenamingFolderId(folder.id); setRenamingFolderName(folder.name); }}
                          className="w-8 h-8 rounded-xl bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all"
                          title="Rename"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); setDeletingFolderId(folder.id); }}
                          className="w-8 h-8 rounded-xl bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-400 hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition-all"
                          title="Delete folder"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Empty state */}
            {folders.length === 0 && members.length === 0 && (
              <div className="mt-12 flex flex-col items-center justify-center gap-4 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center">
                  <FolderOpen size={36} className="text-gray-300" />
                </div>
                <div>
                  <p className="font-black text-gray-700 text-lg">No data yet</p>
                  <p className="text-sm text-gray-400 mt-1">Click "All Members" to add your first record, or create a folder to organise.</p>
                </div>
              </div>
            )}
          {/* -- Delete Folder Confirmation Modal -- */}
          {deletingFolderId && (() => {
            const folder = folders.find(f => f.id === deletingFolderId);
            const count = members.filter(m => m.folderId === deletingFolderId).length;
            return (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setDeletingFolderId(null)}>
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-in zoom-in-95 fade-in duration-200" onClick={e => e.stopPropagation()}>
                  <div className="bg-gradient-to-br from-red-600 to-red-500 px-6 py-5 flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/90 rounded-xl flex items-center justify-center shrink-0">
                      <Trash2 size={20} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-white">Delete Folder</h2>
                      <p className="text-[11px] text-red-200 font-medium mt-0.5">This action cannot be undone</p>
                    </div>
                  </div>
                  <div className="px-6 py-6 space-y-3">
                    <p className="text-sm font-bold text-gray-900">
                      You are about to delete <span className="text-red-600">&ldquo;{folder?.name}&rdquo;</span>.
                    </p>
                    <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 space-y-1.5">
                      <p className="text-[11px] font-black text-red-700 uppercase tracking-widest">⚠ What will happen:</p>
                      <ul className="text-xs text-red-600 font-medium space-y-1 list-disc list-inside">
                        <li>The folder will be permanently removed.</li>
                        {count > 0 && <li>The <strong>{count} member{count > 1 ? 's' : ''}</strong> inside will be <strong>{deleteFolderWithMembers ? 'permanently deleted' : 'moved to All Members'}</strong>.</li>}
                        <li>This action <strong>cannot be undone</strong>.</li>
                      </ul>
                    </div>
                    {count > 0 && (
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={deleteFolderWithMembers}
                          onChange={e => setDeleteFolderWithMembers(e.target.checked)}
                          className="w-4 h-4 rounded accent-red-600 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-red-700 group-hover:text-red-900">
                          Also permanently delete all {count} member{count > 1 ? 's' : ''} inside
                        </span>
                      </label>
                    )}
                  </div>
                  <div className="px-6 pb-6 flex gap-3">
                    <button onClick={() => { setDeletingFolderId(null); setDeleteFolderWithMembers(false); }} className="flex-1 h-10 rounded-xl border-2 border-gray-200 text-gray-600 text-[11px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all">
                      Cancel
                    </button>
                    <button onClick={() => { deleteFolder(deletingFolderId!, deleteFolderWithMembers); setDeletingFolderId(null); setDeleteFolderWithMembers(false); }} className="flex-1 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-500 text-white text-[11px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                      <Trash2 size={13} /> Accept &amp; Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
           MEMBER LIST VIEW  (inside a folder)
          ══════════════════════════════════════════════════════ */}
      {view === 'members' && (
      <>

      {/* -- Delete Member Confirmation Modal -- */}
      {deletingMemberId && (() => {
        const member = members.find(m => m.id === deletingMemberId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setDeletingMemberId(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-in zoom-in-95 fade-in duration-200" onClick={e => e.stopPropagation()}>
              <div className="bg-gradient-to-br from-red-600 to-red-500 px-6 py-5 flex items-center gap-3">
                <div className="w-10 h-10 bg-white/90 rounded-xl flex items-center justify-center shrink-0">
                  <Trash2 size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white">Delete Member</h2>
                  <p className="text-[11px] text-red-200 font-medium mt-0.5">This action cannot be undone</p>
                </div>
              </div>
              <div className="px-6 py-6 space-y-3">
                <p className="text-sm font-bold text-gray-900">
                  You are about to delete <span className="text-red-600">&ldquo;{member?.firstName} {member?.lastName}&rdquo;</span>.
                </p>
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 space-y-1.5">
                  <p className="text-[11px] font-black text-red-700 uppercase tracking-widest">? What will happen:</p>
                  <ul className="text-xs text-red-600 font-medium space-y-1 list-disc list-inside">
                    <li>This member's record will be permanently removed.</li>
                    <li>This action <strong>cannot be undone</strong>.</li>
                  </ul>
                </div>
              </div>
              <div className="px-6 pb-6 flex gap-3">
                <button onClick={() => setDeletingMemberId(null)} className="flex-1 h-10 rounded-xl border-2 border-gray-200 text-gray-600 text-[11px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all">
                  Cancel
                </button>
                <button onClick={async () => {
                  try {
                    await deleteMember(deletingMemberId);
                    setDeletingMemberId(null);
                  } catch (error) {
                    setDeletingMemberId(null);
                    showModal({ title: 'Delete Failed', message: `The member was not deleted. ${getErrorMessage(error)}`, type: 'error' });
                  }
                }} className="flex-1 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-500 text-white text-[11px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm shadow-red-900/20">
                  <Trash2 size={13} /> Accept &amp; Delete
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      {/* Move to folder modal */}
      {movingMemberId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/200" onClick={() => setMovingMemberId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-72 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <h3 className="font-black text-gray-900 mb-4 text-sm">Move to Folder</h3>
            <div className="flex flex-col gap-1">
              <button onClick={async () => { await moveMemberToFolder(movingMemberId, null); setMovingMemberId(null); }} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50">
                <Users size={16} className="text-gray-400" /> All Members (root)
              </button>
              {folders.map(f => (
                <button key={f.id} onClick={async () => { await moveMemberToFolder(movingMemberId, f.id); setMovingMemberId(null); }} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-gray-700 hover:bg-green-50 hover:text-green-700">
                  <Folder size={16} className="text-gray-400" /> {f.name}
                </button>
              ))}
              {folders.length === 0 && <p className="text-xs text-gray-400 py-2 text-center">No folders yet.</p>}
            </div>
            <button onClick={() => setMovingMemberId(null)} className="mt-4 w-full text-xs font-bold text-gray-400 hover:text-gray-600">Cancel</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-[#FAF7F2] border-b border-[#E8DFD0] px-6 lg:px-8 py-5 flex flex-wrap items-center justify-between gap-4 shrink-0 z-10">
        <div className="flex items-center flex-wrap gap-4 min-w-0">
          {/* Back button */}
          <button onClick={() => { setView('folders'); setSelectedMembers(new Set()); }} className="flex items-center gap-1.5 text-gray-400 hover:text-[#1a5d1a] transition-colors shrink-0">
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-xl font-black text-gray-900 shrink-0">
            {selectedFolderId === null ? `All Members` : (folders.find(f => f.id === selectedFolderId)?.name ?? 'Folder')}
            <span className="ml-2 text-sm font-bold text-gray-400">({folderFilteredMembers.length})</span>
          </h1>
          <div className="relative w-48 xl:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-900" />
            <input
              type="text"
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-4 h-11 bg-gray-50 border border-gray-200 rounded-xl text-sm w-full focus:outline-none focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/5 transition-all placeholder:text-gray-900 font-medium"
            />
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <input type="file" ref={excelInputRef} accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportExcel} />
          <input type="file" ref={bulkImageInputRef} accept="image/*" multiple className="hidden" onChange={handleBulkImageUpload} />

          {selectedMembers.size === 0 && (
            <>
              <button
                data-tour="upload-settings"
                onClick={() => {
                  setTempConfig(formConfig || { enabledFields: DEFAULT_ENABLED_FIELDS, customFields: [], enabledImageFields: DEFAULT_ENABLED_IMAGE_FIELDS, customImageFields: [] });
                  setTempOrganizationType(organizationType);
                  setIsSettingsOpen(true);
                }}
                className={`h-11 border text-[10px] uppercase tracking-widest font-black px-5 rounded-xl transition-all flex items-center gap-2.5 ${isSettingsOpen ? 'border-green-500 text-green-700 bg-green-50 ring-2 ring-green-500/10' : 'border-gray-200 text-gray-900 hover:border-gray-300 hover:bg-gray-50 bg-white'}`}
              >
                <Settings size={16} /> Variable Checklist
              </button>

              <div className="h-8 w-px bg-gray-200 mx-1" />

              <button
                data-tour="upload-download-template"
                onClick={handleDownloadTemplate}
                className="h-11 bg-white border border-gray-200 text-gray-900 text-[10px] uppercase tracking-widest font-black px-4 rounded-xl transition-all flex items-center gap-2 hover:bg-gray-50 hover:text-green-600 hover:border-green-200"
                title="Download Template"
              >
                <FileSpreadsheet size={16} /> Template
              </button>

              <button
                data-tour="upload-import-excel"
                onClick={() => excelInputRef.current?.click()}
                className="h-11 bg-white border border-gray-200 text-gray-900 text-[10px] uppercase tracking-widest font-black px-4 rounded-xl transition-all flex items-center gap-2 hover:bg-gray-50 hover:text-green-600 hover:border-green-200"
                title="Import Excel"
              >
                <Upload size={16} /> Import
              </button>

              <button
                onClick={handleExportExcel}
                className="h-11 bg-white border border-gray-200 text-gray-900 text-[10px] uppercase tracking-widest font-black px-4 rounded-xl transition-all flex items-center gap-2 hover:bg-gray-50 hover:text-green-600 hover:border-green-200"
                title="Export Excel"
              >
                <Download size={16} /> Export
              </button>
            </>
          )}

          {selectedMembers.size === 0 && (
            <button
              onClick={() => bulkImageInputRef.current?.click()}
              className="h-11 bg-blue-50/50 border border-blue-100 text-blue-600 text-[10px] uppercase tracking-widest font-black px-4 rounded-xl transition-all flex items-center gap-2 hover:bg-blue-100/50 hover:border-blue-200 animate-in zoom-in-95 duration-200"
              title="Bulk upload images to match filenames in Excel"
            >
              <FolderUp size={16} /> Bulk Images
            </button>
          )}

          <div className="h-8 w-px bg-gray-200 mx-1" />
          
          {selectedMembers.size > 0 ? (
            <button
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="h-11 bg-red-50 border border-red-200 text-red-600 text-[10px] uppercase tracking-widest font-black px-8 rounded-xl transition-all flex items-center gap-2.5 hover:bg-red-100   animate-in zoom-in-95 duration-200"
            >
              <X size={18} /> Delete Selected ({selectedMembers.size})
            </button>
          ) : (
            <button
              data-tour="upload-add-member"
              onClick={async () => {
                const user = useAuthStore.getState().user;
                if (user?.plan === 'FREE_TRIAL') {
                  try {
                    const sysSettings = await api<any>("/auth/system-settings");
                    const limit = sysSettings?.FREE_TRIAL_LIMIT ?? 50;
                    if (members.length >= limit) {
                      showModal({
                        title: 'Free Trial Limit Reached',
                        message: `You have reached the maximum limit of ${limit} records for the free trial. Please upgrade your plan to add more members.`,
                        type: 'error'
                      });
                      return;
                    }
                  } catch (e) {
                    console.error("Failed to check limit", e);
                  }
                }

                setEditingMemberId(null);
                setFormData(initialFormState);
                setCustomFieldsList([]);
                setIsModalOpen(true);
              }}
              className="h-11 bg-gradient-to-br from-[#1a5d1a] to-[#2d7a2d] hover:scale-[1.02] active:scale-[0.98] text-white px-8 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all   flex items-center gap-2.5"
            >
              <Plus size={18} /> Add New Member
            </button>
          )}
        </div>
      </div>

      {/* Settings Modal Popup */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-8">
          <div className="bg-white rounded-xl  w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-200">
            <div className="bg-gray-50 border-b border-gray-200 px-8 py-4 flex items-center justify-between shrink-0">
              <h2 className="text-lg font-black text-gray-900">Variable Checklist & Profile</h2>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-2 text-gray-900 hover:bg-gray-200 hover:text-gray-900 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
              <div className="mb-8">
                <h3 className="text-sm font-black text-gray-900 mb-4">Organization Profile Type</h3>
                <p className="text-xs text-gray-900 mb-3">Select the type of organization to automatically adapt the field labels.</p>
                <select
                  value={tempOrganizationType}
                  onChange={(e) => setTempOrganizationType(e.target.value as any)}
                  className="bg-white border border-gray-200 text-stone-900 px-3 py-2.5 rounded font-bold text-[12px] uppercase tracking-wide focus:outline-none focus:border-green-500 transition-colors  w-64"
                >
                  <option value="corporate">Corporate Profile</option>
                  <option value="education">Education Profile</option>
                  <option value="healthcare">Healthcare Profile</option>
                </select>
              </div>

              <div className="pt-8 border-t border-gray-100">
                <h3 className="text-sm font-black text-gray-900 mb-4">Configure Form Checklist</h3>
                <div className="grid grid-cols-4 gap-4 mb-8">
                  {STANDARD_FIELDS.map(f => {
                    const label = getLabel(f, tempOrganizationType);
                    const isChecked = tempConfig.enabledFields.includes(f);
                    // First Name is always required
                    const disabled = f === 'First Name';
                    return (
                      <label key={f} className={`flex items-center gap-2 text-xs font-bold ${disabled ? 'text-gray-900' : 'text-gray-900 cursor-pointer'}`}>
                        <input
                          type="checkbox"
                          disabled={disabled}
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTempConfig({ ...tempConfig, enabledFields: [...tempConfig.enabledFields, f] });
                            } else {
                              setTempConfig({ ...tempConfig, enabledFields: tempConfig.enabledFields.filter(x => x !== f) });
                            }
                          }}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        {label}
                      </label>
                    );
                  })}
                  {tempConfig.customFields.map((cf, idx) => {
                    const isChecked = tempConfig.enabledFields.includes(cf);
                    return (
                      <label key={`custom-${idx}`} className="flex items-center gap-2 text-xs font-bold text-gray-900 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTempConfig({ ...tempConfig, enabledFields: [...tempConfig.enabledFields, cf] });
                            } else {
                              setTempConfig({ ...tempConfig, enabledFields: tempConfig.enabledFields.filter(x => x !== cf) });
                            }
                          }}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span className="text-blue-700">{cf}</span>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setTempConfig({
                              ...tempConfig,
                              customFields: tempConfig.customFields.filter((_, i) => i !== idx),
                              enabledFields: tempConfig.enabledFields.filter(x => x !== cf)
                            });
                          }}
                          className="opacity-0 group-hover:opacity-100 ml-1 text-gray-300 hover:text-red-500 transition-opacity"
                          title="Delete custom field"
                        >
                          <X size={12} />
                        </button>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-8 border-t border-gray-100">
                <h3 className="text-sm font-black text-gray-900 mb-4">Configure Image Checklist</h3>
                <div className="grid grid-cols-4 gap-4 mb-8">
                  {STANDARD_IMAGE_FIELDS.map(f => {
                    const isChecked = tempConfig.enabledImageFields?.includes(f);
                    return (
                      <label key={f} className="flex items-center gap-2 text-xs font-bold text-gray-900 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTempConfig({ ...tempConfig, enabledImageFields: [...(tempConfig.enabledImageFields || []), f] });
                            } else {
                              setTempConfig({ ...tempConfig, enabledImageFields: (tempConfig.enabledImageFields || []).filter(x => x !== f) });
                            }
                          }}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span className="text-purple-700">{f}</span>
                      </label>
                    );
                  })}
                  {tempConfig.customImageFields?.map((cf, idx) => {
                    const isChecked = tempConfig.enabledImageFields?.includes(cf);
                    return (
                      <label key={`custom-img-${idx}`} className="flex items-center gap-2 text-xs font-bold text-gray-900 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTempConfig({ ...tempConfig, enabledImageFields: [...(tempConfig.enabledImageFields || []), cf] });
                            } else {
                              setTempConfig({ ...tempConfig, enabledImageFields: (tempConfig.enabledImageFields || []).filter(x => x !== cf) });
                            }
                          }}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span className="text-purple-700 underline">{cf}</span>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setTempConfig({
                              ...tempConfig,
                              customImageFields: (tempConfig.customImageFields || []).filter((_, i) => i !== idx),
                              enabledImageFields: (tempConfig.enabledImageFields || []).filter(x => x !== cf)
                            });
                          }}
                          className="opacity-0 group-hover:opacity-100 ml-1 text-gray-300 hover:text-red-500 transition-opacity"
                          title="Delete custom image field"
                        >
                          <X size={12} />
                        </button>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-8 border-t border-gray-100 flex gap-12">
                <div>
                  <h3 className="text-sm font-black text-gray-900 mb-4">Add Custom Text Field</h3>
                  <div className="flex gap-2 w-64">
                    <input
                      type="text"
                      id="newCustomFieldInput"
                      placeholder="e.g. Bus Route"
                      className="flex-1 bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-xs focus:border-green-500 focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = e.currentTarget.value.trim();
                          if (val && !tempConfig.customFields.includes(val)) {
                            setTempConfig({
                              ...tempConfig,
                              customFields: [...tempConfig.customFields, val],
                              enabledFields: [...tempConfig.enabledFields, val]
                            });
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        const input = document.getElementById('newCustomFieldInput') as HTMLInputElement;
                        const val = input.value.trim();
                        if (val && !tempConfig.customFields.includes(val)) {
                          setTempConfig({
                            ...tempConfig,
                            customFields: [...tempConfig.customFields, val],
                            enabledFields: [...tempConfig.enabledFields, val]
                          });
                          input.value = '';
                        }
                      }}
                      className="bg-stone-200 hover:bg-stone-300 text-stone-900 px-3 py-1.5 rounded text-xs font-bold transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-black text-gray-900 mb-4">Add Custom Image Field</h3>
                  <div className="flex gap-2 w-64">
                    <input
                      type="text"
                      id="newCustomImageInput"
                      placeholder="e.g. Parent Signature"
                      className="flex-1 bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-xs focus:border-green-500 focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = e.currentTarget.value.trim();
                          if (val && !tempConfig.customImageFields?.includes(val)) {
                            setTempConfig({
                              ...tempConfig,
                              customImageFields: [...(tempConfig.customImageFields || []), val],
                              enabledImageFields: [...(tempConfig.enabledImageFields || []), val]
                            });
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        const input = document.getElementById('newCustomImageInput') as HTMLInputElement;
                        const val = input.value.trim();
                        if (val && !tempConfig.customImageFields?.includes(val)) {
                          setTempConfig({
                            ...tempConfig,
                            customImageFields: [...(tempConfig.customImageFields || []), val],
                            enabledImageFields: [...(tempConfig.enabledImageFields || []), val]
                          });
                          input.value = '';
                        }
                      }}
                      className="bg-stone-200 hover:bg-stone-300 text-stone-900 px-3 py-1.5 rounded text-xs font-bold transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border-t border-gray-200 px-8 py-4 flex items-center justify-end gap-4 shrink-0">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-6 py-2 rounded font-bold text-xs transition-colors text-gray-900 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setOrganizationType(tempOrganizationType);
                  setFormConfig(tempConfig);
                  setIsSettingsOpen(false);
                  try {
                    const { updateProfile } = await import('../api');
                    await updateProfile({
                      settings: {
                        organizationType: tempOrganizationType,
                        formConfig: tempConfig,
                      }
                    });
                    showModal({ title: 'Settings Saved', message: 'Profile and Form variables synced to your account.', type: 'info' });
                  } catch (e) {
                    console.error('Failed to persist settings:', e);
                    showModal({ title: 'Settings Saved Locally', message: 'Saved but could not sync to server — may reset on refresh.', type: 'info' });
                  }
                }}
                className="bg-gray-900 hover:bg-black text-white px-6 py-2 rounded font-bold text-xs transition-colors"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content: Table */}
      <div className="flex-1 flex flex-col bg-transparent overflow-hidden relative">
        <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full border-collapse min-w-[1000px]">
              <thead className="sticky top-0 bg-[#FAF7F2] z-10">
                <tr className="border-b border-gray-200">
                  <th className="p-5 text-left w-12">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                      checked={selectedMembers.size === folderFilteredMembers.length && folderFilteredMembers.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-900 uppercase tracking-widest">Assets</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-900 uppercase tracking-widest">Name</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-900 uppercase tracking-widest">ID Number</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-900 uppercase tracking-widest">Grade/Class</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-900 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DFD0] bg-[#F4EFE6]">
                {paginatedMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-3 text-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                        checked={selectedMembers.has(member.id)}
                        onChange={(e) => handleSelectMember(member.id, e.target.checked)}
                      />
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        {/* Profile Image Main Thumbnail */}
                        <div 
                          className="w-10 h-10 rounded overflow-hidden bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200 cursor-pointer hover:border-indigo-400  transition-all group/img" 
                          title="Click to view/change image"
                          onClick={() => setImageViewerMemberId(member.id)}
                        >
                          {member.profileImage && (member.profileImage.startsWith('data:image') || member.profileImage.startsWith('http')) ? (
                            <img src={member.profileImage} alt="" className="w-full h-full object-cover group-hover/img:scale-110 transition-transform" />
                          ) : (
                            <ImageIcon size={20} className="text-gray-300" />
                          )}
                        </div>

                        {/* Badges for other uploaded images */}
                        <div className="flex flex-col gap-1 justify-center">
                          {(member.signature && (member.signature.startsWith('data:image') || member.signature.startsWith('http'))) && (
                            <span className="text-[9px] uppercase font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 leading-none inline-block w-max">Signature</span>
                          )}
                          {(member.fingerprint && (member.fingerprint.startsWith('data:image') || member.fingerprint.startsWith('http'))) && (
                            <span className="text-[9px] uppercase font-bold bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded border border-purple-100 leading-none inline-block w-max">Fingerprint</span>
                          )}
                          {(member.divisionLogo && (member.divisionLogo.startsWith('data:image') || member.divisionLogo.startsWith('http'))) && (
                            <span className="text-[9px] uppercase font-bold bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded border border-orange-100 leading-none inline-block w-max">Logo</span>
                          )}
                          {Object.keys(member.customFields || {}).map(k => {
                            const val = member.customFields![k];
                            if (val && typeof val === 'string' && (val.startsWith('data:image') || val.startsWith('http'))) {
                              return <span key={k} className="text-[9px] uppercase font-bold bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-100 leading-none whitespace-nowrap overflow-hidden text-ellipsis max-w-[80px] inline-block">{k}</span>
                            }
                            return null;
                          })}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 font-bold text-gray-900">
                      {member.firstName} {member.lastName}
                    </td>
                    <td className="px-6 py-3">{member.idNumber || '-'}</td>
                    <td className="px-6 py-3">{member.department || '-'}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => setMovingMemberId(member.id)}
                          className="text-green-600 hover:text-green-800 font-bold text-xs flex items-center gap-1"
                        >
                          <Folder size={11} /> Move
                        </button>
                        <button
                          onClick={() => {
                            setEditingMemberId(member.id);
                            // @ts-ignore
                            setFormData(member);
                            const customFields = Object.entries(member.customFields || {}).map(([label, value]) => ({ label: (label as string), value: (value as string) }));
                            setCustomFieldsList(customFields);
                            setIsModalOpen(true);
                          }}
                          className="text-blue-500 hover:text-blue-700 font-bold text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await deleteMember(member.id);
                            } catch (error) {
                              showModal({
                                title: 'Delete Failed',
                                message: `The member was not deleted from the database. ${getErrorMessage(error)}`,
                                type: 'error'
                              });
                            }
                          }}
                          className="text-red-500 hover:text-red-700 font-bold text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {members.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-900 font-bold">
                      No members added yet. Click "Add New Member" to get started.
                    </td>
                  </tr>
                )}
                {members.length > 0 && filteredMembers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-900 font-bold">
                      No members match your search query "{searchQuery}".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer / Pagination */}
          <div className="mt-auto bg-white border-t border-gray-200 px-8 py-2.5 flex items-center justify-between shrink-0  z-20">
            <div className="flex items-center gap-4">
              <span className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Rows per page:</span>
              <div className="flex items-center gap-1.5">
                {[10, 20, 30, 50].map((size) => (
                  <button
                    key={size}
                    onClick={() => setItemsPerPage(size)}
                    className={`min-w-[40px] h-8 rounded-lg text-[11px] font-black transition-all border ${itemsPerPage === size ? 'bg-[#1a5d1a] border-[#1a5d1a] text-white ' : 'bg-white border-gray-200 text-gray-900 hover:border-gray-300 hover:bg-gray-50'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              <div className="h-4 w-px bg-gray-200 mx-2" />
              <span className="text-[11px] font-medium text-gray-900">
                Showing <span className="font-black text-gray-900">{filteredMembers.length > 0 ? startIndex + 1 : 0}</span> to <span className="font-black text-gray-900">{Math.min(startIndex + itemsPerPage, filteredMembers.length)}</span> of <span className="font-black text-gray-900">{filteredMembers.length}</span> members
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-gray-200 text-gray-900 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={18} />
              </button>
              
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Page</span>
                <div className="bg-gray-50 border border-gray-200 px-3 py-1 rounded-lg text-[11px] font-black text-gray-900">
                  {currentPage} / {totalPages || 1}
                </div>
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-2 rounded-xl border border-gray-200 text-gray-900 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/60 p-8">
          <div className="bg-white rounded-xl  w-full max-w-md overflow-hidden animate-in zoom-in-95 fade-in duration-200">
            <div className="bg-red-50 border-b border-red-100 px-6 py-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <X size={16} />
              </div>
              <h2 className="text-lg font-black text-red-900">Confirm Deletion</h2>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-900 font-bold mb-2">
                Are you sure you want to delete {selectedMembers.size} member{selectedMembers.size > 1 ? 's' : ''}?
              </p>
              <p className="text-xs text-gray-900">
                <strong className="text-red-500">WHAT CAN HAPPEN:</strong> The selected members and all their associated data will be permanently deleted from the database. This action cannot be undone.
              </p>
            </div>
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-4 py-2 rounded font-bold text-xs transition-colors text-gray-900 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded font-bold text-xs transition-colors "
              >
                Accept & Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Popup */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-8">
          <div className="bg-stone-50 rounded-[28px]  w-full max-w-[1200px] h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-200">
            {/* Modal Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between shrink-0">
              <h2 className="text-lg font-black text-gray-900">{editingMemberId ? 'Edit Member' : 'Add New Member'}</h2>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleSave}
                  disabled={isSavingMember}
                  className="bg-[#34a853] hover:bg-green-600 text-white px-8 py-2 rounded font-bold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSavingMember ? 'Saving...' : 'Save Member'}
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-gray-900 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Form Content */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="flex gap-8 mx-auto">
                {/* Left Column: Image Upload */}
                <div className="w-[300px] shrink-0">
                  <div className="bg-white rounded-lg p-6 flex flex-col items-center justify-center gap-6 border border-gray-100 ">
                    <div className="w-32 h-32 bg-gray-50 flex items-center justify-center rounded text-gray-200 overflow-hidden relative">
                      {formData.profileImage ? (
                        <img src={formData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon size={64} strokeWidth={1} />
                      )}
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-[#34a853] hover:bg-green-600 text-white px-6 py-1.5 rounded font-bold text-xs w-full transition-colors flex items-center justify-center gap-1"
                    >
                      <Plus size={14} /> {formData.profileImage ? 'Change Image' : 'Add Image'}
                    </button>
                  </div>
                </div>

                {/* Right Column: Dynamic fields from Variable Checklist */}
                 <div className="flex-1 space-y-6">
                   {/* Standard fields — only ticked ones in checklist */}
                   {(() => {
                     const FIELD_MAP: Record<string, { key: keyof typeof initialFormState; ph: string }> = {
                       'First Name':         { key: 'firstName',        ph: 'Enter First Name...' },
                       'Last Name':          { key: 'lastName',         ph: 'Enter Last Name...' },
                       'Nickname':           { key: 'nickname',         ph: 'Enter Nickname...' },
                       'Date of Birth':      { key: 'dob',              ph: 'e.g. 1990-01-01' },
                       'Title':              { key: 'title',            ph: 'Enter Title...' },
                       'ID number':          { key: 'idNumber',         ph: 'Enter ID number...' },
                       'Employee ID':        { key: 'employeeId',       ph: 'Enter Employee ID...' },
                       'Department':         { key: 'department',       ph: 'Enter Department...' },
                       'Hire Date':          { key: 'hireDate',         ph: 'Enter Hire Date...' },
                       'Issue Date':         { key: 'issueDate',        ph: 'Enter Issue Date...' },
                       'Expiration Date':    { key: 'expirationDate',   ph: 'Enter Expiration Date...' },
                       'Phone 1':            { key: 'phone1',           ph: 'Enter Phone 1...' },
                       'Phone 2':            { key: 'phone2',           ph: 'Enter Phone 2...' },
                       'Fax':                { key: 'fax',              ph: 'Enter Fax...' },
                       'Email':              { key: 'email',            ph: 'Enter Email...' },
                       'Website':            { key: 'website',          ph: 'Enter Website...' },
                       'Country':            { key: 'country',          ph: 'Enter Country...' },
                       'Postal Code':        { key: 'postalCode',       ph: 'Enter Postal Code...' },
                       'State':              { key: 'state',            ph: 'Enter State...' },
                       'City':               { key: 'city',             ph: 'Enter City...' },
                       'Street 1':           { key: 'street1',          ph: 'Enter Street 1...' },
                       'Street 2':           { key: 'street2',          ph: 'Enter Street 2...' },
                       'Grade Level':        { key: 'gradeLevel',       ph: 'Enter Grade Level...' },
                       'Security Level':     { key: 'securityLevel',    ph: 'Enter Security Level...' },
                       'Height':             { key: 'height',           ph: 'Enter Height...' },
                       'Weight':             { key: 'weight',           ph: 'Enter Weight...' },
                       'Gender':             { key: 'gender',           ph: 'Enter Gender...' },
                       'Eye color':          { key: 'eyeColor',         ph: 'Enter Eye color...' },
                       'Hair color':         { key: 'hairColor',        ph: 'Enter Hair color...' },
                       'Blood Group':        { key: 'bloodGroup',       ph: 'e.g. O+, AB-' },
                       'Parent Name':        { key: 'parentName',       ph: 'Enter Parent Name...' },
                       'Parent Phone':       { key: 'parentPhone',      ph: 'Enter Parent Phone...' },
                       'Emergency Contact':  { key: 'emergencyContact', ph: 'Emergency Contact Name...' },
                       'Emergency Phone':    { key: 'emergencyPhone',   ph: 'Emergency Phone Number...' },
                       'RFID No':            { key: 'rfidNo',           ph: 'Enter RFID Tag ID...' },
                       'Bus Route':          { key: 'busRoute',         ph: 'Enter Bus Route/No...' },
                       'Hostel Name':        { key: 'hostelName',       ph: 'Enter Hostel Name...' },
                       'Room No':            { key: 'roomNo',           ph: 'Enter Room Number...' },
                       'Role':               { key: 'role',             ph: 'Enter Role...' },
                     };
                     const enabledStandard = ['First Name', ...STANDARD_FIELDS.filter(f =>
                       f !== 'First Name' && (formConfig?.enabledFields || []).includes(f)
                     )].filter(f => FIELD_MAP[f]);
                     return (
                       <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                         {enabledStandard.map(label => {
                           const mapping = FIELD_MAP[label];
                           const displayLabel = getLabel(label);
                           return (
                             <div key={label} className="flex flex-col gap-1.5">
                               <label className="text-[10px] font-black text-gray-900 tracking-wide">
                                 {displayLabel}{label === 'First Name' && <span className="text-red-500 ml-1">*</span>}
                               </label>
                               <input
                                 type="text"
                                 value={formData[mapping.key] as string}
                                 onChange={e => handleChange(mapping.key, e.target.value)}
                                 placeholder={mapping.ph}
                                 className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-900 placeholder-gray-300 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                               />
                             </div>
                           );
                         })}
                       </div>
                     );
                   })()}

                   {/* User-added custom text fields */}
                   {customFieldsList.filter(f => !formConfig?.customImageFields?.includes(f.label)).length > 0 && (
                     <div className="border-t border-gray-100 pt-6">
                       <h3 className="text-[11px] font-black text-gray-900 mb-6 uppercase tracking-wider">Custom Fields</h3>
                       <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                         {customFieldsList
                           .filter(f => !formConfig?.customImageFields?.includes(f.label))
                           .map((field, idx) => (
                             <div key={idx} className="flex flex-col gap-1.5">
                               <label className="text-[10px] font-black text-gray-900 tracking-wide">{field.label}</label>
                               <input
                                 type="text"
                                 placeholder={`Enter ${field.label}...`}
                                 className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-900 placeholder-gray-300 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                                 value={field.value}
                                 onChange={e => {
                                   const newList = [...customFieldsList];
                                   newList[idx].value = e.target.value;
                                   setCustomFieldsList(newList);
                                 }}
                               />
                             </div>
                           ))}
                       </div>
                     </div>
                   )}

                  {/* Bottom Image Fields (Signatures, Fingerprints, Custom Images) */}
                  <div className="grid grid-cols-4 gap-6 pt-4 pb-12">
                    {/* Standard Image Fields */}
                    {STANDARD_IMAGE_FIELDS.map(field => {
                      if (!formConfig?.enabledImageFields?.includes(field)) return null;

                      const key = field === 'Signature' ? 'signature' :
                        field === 'Fingerprint' ? 'fingerprint' :
                          field === 'Division Logo' ? 'divisionLogo' : '';

                      if (!key) return null;

                      return (
                        <div key={field} className="flex flex-col gap-2">
                          <label className="text-[10px] font-black text-gray-900 tracking-wide uppercase">{field}</label>
                          {(() => {
                            const imageVal = formData[key as keyof typeof initialFormState] as string;
                            return (
                              <div
                                onClick={() => document.getElementById(`upload-${key}`)?.click()}
                                className={`rounded-lg h-32 relative overflow-hidden cursor-pointer group transition-all duration-200 ${imageVal ? 'bg-white border border-gray-200 ' : 'bg-gray-50 flex flex-col items-center justify-center border border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50'}`}
                              >
                                {imageVal ? (
                                  <>
                                    <img src={imageVal} alt={field} className="absolute inset-0 w-full h-full object-contain p-2 bg-white" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center z-10">
                                      <span className="bg-white/90 text-white px-4 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 border border-white/30 hover:bg-white/30 transition-colors">
                                        <ImageIcon size={12} /> Change {field}
                                      </span>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="w-8 h-8 rounded-full bg-white  flex items-center justify-center mb-2 text-gray-900 group-hover:text-green-600 group-hover:scale-110 transition-all">
                                      <Plus size={16} />
                                    </div>
                                    <span className="text-[11px] font-bold text-gray-900 group-hover:text-green-700">Add {field}</span>
                                  </>
                                )}
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  id={`upload-${key}`}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onload = (f) => handleChange(key as keyof typeof initialFormState, f.target?.result as string);
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                />
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })}

                    {/* Custom Image Fields */}
                    {formConfig?.customImageFields?.map(field => {
                      if (!formConfig?.enabledImageFields?.includes(field)) return null;

                      const customFieldObj = customFieldsList.find(f => f.label === field);
                      const imageValue = customFieldObj?.value || '';

                      return (
                        <div key={field} className="flex flex-col gap-2">
                          <label className="text-[10px] font-black text-gray-900 tracking-wide uppercase">{field}</label>
                          <div
                            onClick={() => document.getElementById(`upload-custom-${field.replace(/\s+/g, '-')}`)?.click()}
                            className={`rounded-lg h-32 relative overflow-hidden cursor-pointer group transition-all duration-200 ${imageValue ? 'bg-white border border-gray-200 ' : 'bg-gray-50 flex flex-col items-center justify-center border border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50'}`}
                          >
                            {imageValue ? (
                              <>
                                <img src={imageValue} alt={field} className="absolute inset-0 w-full h-full object-contain p-2 bg-white" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center z-10">
                                  <span className="bg-white/90 text-white px-4 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 border border-white/30 hover:bg-white/30 transition-colors">
                                    <ImageIcon size={12} /> Change {field}
                                  </span>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="w-8 h-8 rounded-full bg-white  flex items-center justify-center mb-2 text-gray-900 group-hover:text-green-600 group-hover:scale-110 transition-all">
                                  <Plus size={16} />
                                </div>
                                <span className="text-[11px] font-bold text-gray-900 group-hover:text-green-700">Add {field}</span>
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              id={`upload-custom-${field.replace(/\s+/g, '-')}`}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (f) => {
                                    const newList = [...customFieldsList];
                                    const existingIdx = newList.findIndex(x => x.label === field);
                                    if (existingIdx >= 0) {
                                      newList[existingIdx].value = f.target?.result as string;
                                    } else {
                                      newList.push({ label: field, value: f.target?.result as string });
                                    }
                                    setCustomFieldsList(newList);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Image Viewer / Changer Modal */}
      {imageViewerMemberId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-8" onClick={() => setImageViewerMemberId(null)}>
          <div className="bg-white rounded-2xl  overflow-hidden max-w-sm w-full animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-black text-gray-900 text-sm uppercase tracking-wider">Profile Photo</h3>
              <button onClick={() => setImageViewerMemberId(null)} className="p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors">
                <X size={16} />
              </button>
            </div>
            
            <div className="p-6 flex flex-col items-center">
              <div className="w-48 h-48 rounded-2xl overflow-hidden bg-stone-50 border border-stone-200 flex items-center justify-center mb-6  relative group">
                {members.find(m => m.id === imageViewerMemberId)?.profileImage ? (
                  <img src={members.find(m => m.id === imageViewerMemberId)?.profileImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon size={48} className="text-stone-300" />
                )}
                <div className="absolute inset-0 bg-black/200 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <button 
                    onClick={() => document.getElementById(`quick-upload-${imageViewerMemberId}`)?.click()}
                    className="bg-white text-gray-900 font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-100 transition-colors "
                  >
                    <Upload size={14} /> Change Photo
                  </button>
                </div>
              </div>
              
              <input 
                type="file" 
                id={`quick-upload-${imageViewerMemberId}`}
                accept="image/*" 
                className="hidden" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = async (f) => {
                      try {
                        await updateMember(imageViewerMemberId, { profileImage: f.target?.result as string });
                      } catch (error) {
                        showModal({
                          title: 'Save Failed',
                          message: `The profile photo was not saved to the database. ${getErrorMessage(error)}`,
                          type: 'error'
                        });
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
              
              <div className="w-full flex gap-3">
                <button
                  onClick={() => document.getElementById(`quick-upload-${imageViewerMemberId}`)?.click()}
                  className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black text-[11px] uppercase tracking-wider py-2.5 rounded-xl transition-colors border border-indigo-200"
                >
                  Upload New
                </button>
                <button
                  onClick={() => setImageViewerMemberId(null)}
                  className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-black text-[11px] uppercase tracking-wider py-2.5 rounded-xl transition-colors border border-stone-200"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
};


