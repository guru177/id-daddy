import React, { useState, useRef, useEffect } from 'react';
import { Plus, ChevronUp, Image as ImageIcon, X, Settings, Upload, Download, FolderUp, FileSpreadsheet, Search, ChevronLeft, ChevronRight, Sparkles, RotateCcw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useDesignerStore } from './store';
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
  const { members, deleteMember, addMember, updateMember, showModal, organizationType, setOrganizationType, formConfig, setFormConfig, isProcessingBulkBG, setIsProcessingBulkBG, bgProgress, setBgProgress, selectedMembers, setSelectedMembers } = useDesignerStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempConfig, setTempConfig] = useState<{ enabledFields: string[], customFields: string[], enabledImageFields: string[], customImageFields: string[] }>({ enabledFields: STANDARD_FIELDS, customFields: [], enabledImageFields: STANDARD_IMAGE_FIELDS, customImageFields: [] });
  const [tempOrganizationType, setTempOrganizationType] = useState<'corporate' | 'education' | 'healthcare'>('corporate');
  const [formData, setFormData] = useState(initialFormState);
  const [customFieldsList, setCustomFieldsList] = useState<{ label: string, value: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);
  const bulkImageInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSavingMember, setIsSavingMember] = useState(false);

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
    const idNum = (m.idNumber || '').toLowerCase();
    const empId = (m.employeeId || '').toLowerCase();
    const dept = (m.department || '').toLowerCase();
    return fullName.includes(query) || idNum.includes(query) || empId.includes(query) || dept.includes(query);
  });

  // Reset pagination when search or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, itemsPerPage]);

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMembers = filteredMembers.slice(startIndex, startIndex + itemsPerPage);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = new Set(filteredMembers.map(m => m.id));
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
    const config = formConfig || { enabledFields: STANDARD_FIELDS, customFields: [], enabledImageFields: STANDARD_IMAGE_FIELDS, customImageFields: [] };

    const row: any = {};
    row['First Name'] = 'John';

    STANDARD_FIELDS.forEach(f => {
      if (f !== 'First Name' && config.enabledFields.includes(f)) {
        row[getLabel(f, organizationType)] = '';
      }
    });

    config.customFields.forEach(cf => {
      if (config.enabledFields.includes(cf)) {
        row[cf] = '';
      }
    });

    row['Profile Image'] = 'john_doe.jpg';

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

    const exportData = members.map(m => {
      const row: any = {
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
        'Profile Image': m.profileImage?.startsWith('data:image') ? '[Image Attached]' : m.profileImage,
        'Signature': m.signature?.startsWith('data:image') ? '[Image Attached]' : m.signature,
      };

      if (m.customFields) {
        Object.keys(m.customFields).forEach(key => {
          const val = m.customFields![key];
          row[key] = val?.startsWith('data:image') ? '[Image Attached]' : val;
        });
      }
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
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

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

        for (const row of data as any[]) {
          try {
          const getVal = (possibleKeys: string[]) => {
            for (const k of possibleKeys) {
              const exact = row[k];
              if (exact) return exact;
              const keyMatch = Object.keys(row).find(rk => rk.toLowerCase().replace(/\s/g, '') === k.toLowerCase().replace(/\s/g, ''));
              if (keyMatch) return row[keyMatch];
            }
            return '';
          };

          const newMember = {
            firstName: getVal(['First Name', 'FirstName', 'First', 'Name']),
            lastName: getVal(['Last Name', 'LastName', 'Last']),
            nickname: getVal(['Nickname']),
            dob: getVal(['Date of Birth', 'DOB', 'Birthday']),
            title: getVal(['Title', 'Role', 'Position']),
            idNumber: getVal(['ID number', 'ID', 'IDNumber']),
            employeeId: getVal(['Employee ID', 'EmployeeID', 'EmpID']),
            department: getVal(['Department', 'Dept']),
            hireDate: getVal(['Hire Date', 'HireDate']),
            issueDate: getVal(['Issue Date', 'IssueDate']),
            expirationDate: getVal(['Expiration Date', 'ExpDate', 'Expiry']),
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
            gradeLevel: getVal(['Grade Level', 'Grade']),
            securityLevel: getVal(['Security Level', 'Clearance']),
            height: getVal(['Height']),
            weight: getVal(['Weight']),
            gender: getVal(['Gender', 'Sex']),
            eyeColor: getVal(['Eye Color', 'Eyes']),
            hairColor: getVal(['Hair Color', 'Hair']),
            profileImage: getVal(['Profile Image', 'Photo', 'Image', 'Picture']),
            signature: getVal(['Signature', 'Sign']),
            fingerprint: getVal(['Fingerprint', 'Thumbprint']),
            divisionLogo: getVal(['Division Logo', 'Logo', 'Dept Logo']),
            customFields: {} as Record<string, string>
          };

          const knownFields = ['First Name', 'FirstName', 'First', 'Name', 'Last Name', 'LastName', 'Last', 'Nickname', 'Date of Birth', 'DOB', 'Birthday', 'Title', 'Role', 'Position', 'ID number', 'ID', 'IDNumber', 'Employee ID', 'EmployeeID', 'EmpID', 'Department', 'Dept', 'Hire Date', 'HireDate', 'Issue Date', 'IssueDate', 'Expiration Date', 'ExpDate', 'Expiry', 'Phone 1', 'Phone', 'Phone1', 'Mobile', 'Phone 2', 'Phone2', 'Fax', 'Email', 'Email Address', 'Website', 'Web', 'URL', 'Country', 'Postal Code', 'Zip Code', 'Zip', 'State', 'Province', 'City', 'Street 1', 'Street', 'Address', 'Address 1', 'Street 2', 'Address 2', 'Grade Level', 'Grade', 'Security Level', 'Clearance', 'Height', 'Weight', 'Gender', 'Sex', 'Eye Color', 'Eyes', 'Hair Color', 'Hair', 'Profile Image', 'Photo', 'Image', 'Picture', 'Signature', 'Sign', 'Fingerprint', 'Thumbprint', 'Division Logo', 'Logo', 'Dept Logo'];

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
              if (m.employeeId && newMember.employeeId && m.employeeId.toLowerCase() === newMember.employeeId.toLowerCase()) return true;
              if (m.idNumber && newMember.idNumber && m.idNumber.toLowerCase() === newMember.idNumber.toLowerCase()) return true;

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
              await updateMember(existingMember.id, cleanNewMember);
              importedCount++;
            } else {
              const currentLength = useDesignerStore.getState().members.length;
              if (isFreeTrial && currentLength >= limit) {
                skippedCount++;
                continue;
              }
              // Ensure we don't save the placeholder text for new members either
              ['profileImage', 'signature', 'fingerprint', 'divisionLogo'].forEach(imgField => {
                if (cleanNewMember[imgField] === '[Image Attached]') cleanNewMember[imgField] = '';
              });
              await addMember({ ...cleanNewMember, customImage: '' });
              importedCount++;
            }
          }
          } catch (error) {
            failedCount++;
            if (!firstErrorMessage) {
              firstErrorMessage = getErrorMessage(error);
            }
            console.error("Failed to import member row", error);
          }
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
            (m.idNumber && m.idNumber.toLowerCase() === fileLower) ||
            (m.employeeId && m.employeeId.toLowerCase() === fileLower) ||
            (m.rfidNo && m.rfidNo.toLowerCase() === fileLower) ||
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
    if (isModalOpen && !editingMemberId) {
      const activeCustomFields = formConfig?.customFields?.filter(cf => formConfig.enabledFields.includes(cf)) || [];
      const activeCustomImageFields = formConfig?.customImageFields?.filter(cf => formConfig.enabledImageFields?.includes(cf)) || [];

      const combined = [
        ...activeCustomFields.map(cf => ({ label: cf, value: '' })),
        ...activeCustomImageFields.map(cf => ({ label: cf, value: '' }))
      ];
      setCustomFieldsList(combined);
    }
  }, [isModalOpen, formConfig, editingMemberId]);

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
        await addMember({ ...formData, customFields: customFieldsRecord } as any);
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
    <div className="flex flex-col h-full bg-stone-50 overflow-hidden text-gray-900">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between gap-8 shrink-0 z-10  overflow-hidden">
        <div className="flex items-center gap-6 min-w-0">
          <h1 className="text-xl font-black text-gray-900 shrink-0">Members ({members.length})</h1>
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
        
        <div className="flex items-center gap-3 shrink-0">
          <input type="file" ref={excelInputRef} accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportExcel} />
          <input type="file" ref={bulkImageInputRef} accept="image/*" multiple className="hidden" onChange={handleBulkImageUpload} />

          {selectedMembers.size === 0 && (
            <>
              <button
                onClick={() => {
                  setTempConfig(formConfig || { enabledFields: STANDARD_FIELDS, customFields: [], enabledImageFields: STANDARD_IMAGE_FIELDS, customImageFields: [] });
                  setTempOrganizationType(organizationType);
                  setIsSettingsOpen(true);
                }}
                className={`h-11 border text-[10px] uppercase tracking-widest font-black px-5 rounded-xl transition-all flex items-center gap-2.5 ${isSettingsOpen ? 'border-green-500 text-green-700 bg-green-50 ring-2 ring-green-500/10' : 'border-gray-200 text-gray-900 hover:border-gray-300 hover:bg-gray-50 bg-white'}`}
              >
                <Settings size={16} /> Variable Checklist
              </button>

              <div className="h-8 w-px bg-gray-200 mx-1" />

              <button
                onClick={handleDownloadTemplate}
                className="h-11 bg-white border border-gray-200 text-gray-900 text-[10px] uppercase tracking-widest font-black px-4 rounded-xl transition-all flex items-center gap-2 hover:bg-gray-50 hover:text-green-600 hover:border-green-200"
                title="Download Template"
              >
                <FileSpreadsheet size={16} /> Template
              </button>

              <button
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

          {selectedMembers.size > 0 ? (
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-2 h-11 animate-in zoom-in-95 duration-200">
              <input
                type="color"
                value={bulkBgColor}
                onChange={(e) => setBulkBgColor(e.target.value)}
                className="w-6 h-6 rounded border-none cursor-pointer p-0"
                title="Uniform Background Color"
              />
              <button
                onClick={async () => {
                  if (selectedMembers.size === 0) return;
                  
                  const memberIds = Array.from(selectedMembers);
                  const validMembers = memberIds.filter(id => {
                    const member = members.find(m => m.id === id);
                    return member && member.profileImage && member.profileImage.startsWith('data:image');
                  });

                  if (validMembers.length === 0) {
                    showModal({ title: 'No Images Found', message: 'None of the selected members have an attached profile image to process.', type: 'error' });
                    return;
                  }

                  setIsProcessingBulkBG(true);
                  setBgProgress({ current: 0, total: validMembers.length });
                  let successCount = 0;
                  
                  const CHUNK_SIZE = 5; // We can run more in parallel now since the backend handles it smoothly
                  
                  for (let i = 0; i < validMembers.length; i += CHUNK_SIZE) {
                    const chunk = validMembers.slice(i, i + CHUNK_SIZE);
                    await Promise.all(chunk.map(async (memberId) => {
                      const member = members.find(m => m.id === memberId)!;
                      
                      try {
                        const { jobId } = await api<{ jobId: string }>('/bg-removal', {
                          method: 'POST',
                          body: JSON.stringify({ imageBase64: member.profileImage, bgColor: bulkBgColor }),
                        });

                        // Poll BullMQ job status
                        while (true) {
                          await new Promise(r => setTimeout(r, 1000));
                          const status = await api<{ id: string; status: string; result: string | null; failedReason: string | null }>(`/bg-removal/${jobId}`);
                          
                          if (status.status === 'completed' && status.result) {
                            const img = new Image();
                            const src = status.result;
                            
                            await new Promise((resolve, reject) => {
                              img.onload = resolve;
                              img.onerror = reject;
                              img.src = src;
                            });
                            
                            const canvas = document.createElement('canvas');
                            canvas.width = img.width;
                            canvas.height = img.height;
                            const ctx = canvas.getContext('2d');
                            if (ctx) {
                              ctx.fillStyle = bulkBgColor;
                              ctx.fillRect(0, 0, canvas.width, canvas.height);
                              ctx.drawImage(img, 0, 0);
                              const newImage = canvas.toDataURL('image/jpeg', 0.9);
                              await updateMember(memberId, {
                                profileImage: newImage,
                                originalProfileImage: member.originalProfileImage || member.profileImage
                              });
                              successCount++;
                            }
                            break;
                          } else if (status.status === 'failed') {
                            console.error('BG removal failed on server:', status.failedReason);
                            break;
                          } else if (status.status === 'not_found') {
                            console.error('BullMQ Job not found:', jobId);
                            break;
                          }
                        }
                      } catch (err) {
                        console.error('Failed to submit bg removal job for', memberId, err);
                      } finally {
                        setBgProgress(p => ({ ...p, current: p.current + 1 }));
                      }
                    }));
                  }
                  
                  setIsProcessingBulkBG(false);
                  showModal({
                    title: 'Bulk Action Complete',
                    message: `Successfully processed background for ${successCount} profile images.`,
                    type: 'info'
                  });
                }}
                disabled={isProcessingBulkBG}
                className={`text-[10px] uppercase tracking-widest font-black px-4 rounded-lg h-8 transition-all flex items-center gap-2 ${isProcessingBulkBG ? 'bg-gray-100 text-gray-900 cursor-not-allowed' : 'bg-white border border-gray-200 text-gray-900 hover:border-gray-300 hover:bg-gray-100 '}`}
                title="Remove BG and apply color to selected"
              >
                {isProcessingBulkBG ? (
                  <>
                    <div className="w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                    {bgProgress.current} / {bgProgress.total} Processed
                  </>
                ) : (
                  <>
                    <Sparkles size={14} className="text-purple-500" />
                    Process BG
                  </>
                )}
              </button>

              {Array.from(selectedMembers).some(id => members.find(m => m.id === id)?.originalProfileImage) && (
                <button
                  onClick={async () => {
                    let restoredCount = 0;
                    let failedCount = 0;
                    for (const id of selectedMembers) {
                      const member = members.find(m => m.id === id);
                      if (member && member.originalProfileImage) {
                        try {
                          await updateMember(id, {
                            profileImage: member.originalProfileImage,
                            originalProfileImage: undefined // Reset it
                          });
                          restoredCount++;
                        } catch (error) {
                          failedCount++;
                          console.error("Failed to restore member image", error);
                        }
                      }
                    }
                    
                    if (restoredCount > 0 || failedCount > 0) {
                      showModal({
                        title: failedCount ? 'Restoration Complete with Errors' : 'Restoration Complete',
                        message: `Successfully restored original profile images for ${restoredCount} members.`
                          + (failedCount ? ` ${failedCount} update${failedCount === 1 ? '' : 's'} could not be saved to the database.` : ''),
                        type: failedCount ? 'error' : 'info'
                      });
                    }
                  }}
                  disabled={isProcessingBulkBG}
                  className="text-[10px] uppercase tracking-widest font-black px-4 rounded-lg h-8 transition-all flex items-center gap-2 bg-white border border-gray-200 text-gray-900 hover:border-gray-300 hover:bg-red-50 hover:text-red-600  disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Restore original image"
                >
                  <RotateCcw size={14} /> Restore BG
                </button>
              )}
            </div>
          ) : (
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-8">
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
                onClick={() => {
                  setOrganizationType(tempOrganizationType);
                  setFormConfig(tempConfig);
                  setIsSettingsOpen(false);
                  showModal({ title: 'Settings Saved', message: 'Profile and Form variables updated successfully.', type: 'info' });
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
      <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
        <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full border-collapse min-w-[1000px]">
              <thead className="sticky top-0 bg-stone-50 z-10">
                <tr className="border-b border-gray-200">
                  <th className="p-5 text-left w-12">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                      checked={selectedMembers.size === filteredMembers.length && filteredMembers.length > 0}
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
              <tbody className="divide-y divide-gray-100 bg-white">
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-8">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-8">
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

                {/* Right Column: Form Fields */}
                <div className="flex-1 space-y-8">
                  {/* General Info */}
                  <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                    <FormField label="First Name" required placeholder="Enter First Name..." value={formData.firstName} onChange={(v) => handleChange('firstName', v)} />
                    <FormField label="Last Name" placeholder="Enter Last Name..." value={formData.lastName} onChange={(v) => handleChange('lastName', v)} />
                    <FormField label="Nickname" placeholder="Enter Nickname..." value={formData.nickname} onChange={(v) => handleChange('nickname', v)} />
                    <FormField label="Date of Birth" placeholder="Enter Date of Birth..." value={formData.dob} onChange={(v) => handleChange('dob', v)} />
                    <FormField originalLabel="Title" label={getLabel("Title")} placeholder={`Enter ${getLabel("Title")}...`} value={formData.title} onChange={(v) => handleChange('title', v)} />
                    <FormField label="ID number" placeholder="Enter ID number..." value={formData.idNumber} onChange={(v) => handleChange('idNumber', v)} />
                  </div>

                  {/* Employment Details */}
                  <Section title={getLabel("Employment Details")}>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                      <FormField originalLabel="Employee ID" label={getLabel("Employee ID")} placeholder={`Enter ${getLabel("Employee ID")}...`} value={formData.employeeId} onChange={(v) => handleChange('employeeId', v)} />
                      <FormField originalLabel="Department" label={getLabel("Department")} placeholder={`Enter ${getLabel("Department")}...`} value={formData.department} onChange={(v) => handleChange('department', v)} />
                      <FormField originalLabel="Hire Date" label={getLabel("Hire Date")} placeholder={`Enter ${getLabel("Hire Date")}...`} value={formData.hireDate} onChange={(v) => handleChange('hireDate', v)} />
                      <FormField label="Issue Date" placeholder="Enter Issue Date..." value={formData.issueDate} onChange={(v) => handleChange('issueDate', v)} />
                      <FormField label="Expiration Date" placeholder="Enter Expiration Date..." value={formData.expirationDate} onChange={(v) => handleChange('expirationDate', v)} />
                    </div>
                  </Section>

                  {/* Contact Info & Addresses */}
                  <Section title="Contact Info & Addresses">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                      <FormField label="Phone 1" placeholder="Enter Phone 1..." value={formData.phone1} onChange={(v) => handleChange('phone1', v)} />
                      <FormField label="Fax" placeholder="Enter Fax..." value={formData.fax} onChange={(v) => handleChange('fax', v)} />
                      <FormField label="Email" placeholder="Enter Email..." value={formData.email} onChange={(v) => handleChange('email', v)} />
                      <FormField label="Website" placeholder="Enter Website..." value={formData.website} onChange={(v) => handleChange('website', v)} />
                    </div>
                    <div className="grid grid-cols-4 gap-x-8 gap-y-6 mt-6">
                      <FormField label="Country" placeholder="Enter Country..." value={formData.country} onChange={(v) => handleChange('country', v)} />
                      <FormField label="Postal Code" placeholder="Enter Postal Code..." value={formData.postalCode} onChange={(v) => handleChange('postalCode', v)} />
                      <FormField label="State" placeholder="Enter State..." value={formData.state} onChange={(v) => handleChange('state', v)} />
                      <FormField label="City" placeholder="Enter City..." value={formData.city} onChange={(v) => handleChange('city', v)} />
                    </div>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6 mt-6">
                      <FormField label="Street 1" placeholder="Enter Street 1..." value={formData.street1} onChange={(v) => handleChange('street1', v)} />
                      <FormField label="Street 2" placeholder="Enter Street 2..." value={formData.street2} onChange={(v) => handleChange('street2', v)} />
                    </div>
                  </Section>

                  {/* Specialized Identity Fields */}
                  <Section title="Specialized Identity Fields">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                      <FormField label="Blood Group" placeholder="e.g. O+, AB-" value={formData.bloodGroup} onChange={(v) => handleChange('bloodGroup', v)} />
                      <FormField label="RFID No" placeholder="Enter RFID Tag ID..." value={formData.rfidNo} onChange={(v) => handleChange('rfidNo', v)} />
                      <FormField label="Parent Name" placeholder="Enter Parent Name..." value={formData.parentName} onChange={(v) => handleChange('parentName', v)} />
                      <FormField label="Parent Phone" placeholder="Enter Parent Phone..." value={formData.parentPhone} onChange={(v) => handleChange('parentPhone', v)} />
                      <FormField label="Emergency Contact" placeholder="Emergency Contact Name..." value={formData.emergencyContact} onChange={(v) => handleChange('emergencyContact', v)} />
                      <FormField label="Emergency Phone" placeholder="Emergency Phone Number..." value={formData.emergencyPhone} onChange={(v) => handleChange('emergencyPhone', v)} />
                      <FormField label="Bus Route" placeholder="Enter Bus Route/No..." value={formData.busRoute} onChange={(v) => handleChange('busRoute', v)} />
                      <FormField label="Hostel Name" placeholder="Enter Hostel Name..." value={formData.hostelName} onChange={(v) => handleChange('hostelName', v)} />
                      <FormField label="Room No" placeholder="Enter Room Number..." value={formData.roomNo} onChange={(v) => handleChange('roomNo', v)} />
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black text-gray-900 tracking-wide">Identity Role</label>
                        <select
                          value={formData.role}
                          onChange={(e) => handleChange('role', e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                        >
                          <option value="Student">Student</option>
                          <option value="Staff">Staff</option>
                          <option value="Guest">Guest</option>
                          <option value="Contractor">Contractor</option>
                        </select>
                      </div>
                    </div>
                  </Section>

                  {/* Additional Information */}
                  <Section title="Additional Information">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6 mb-6">
                      <FormField label="Grade Level" placeholder="Enter Grade Level..." value={formData.gradeLevel} onChange={(v) => handleChange('gradeLevel', v)} />
                      <FormField label="Security Level" placeholder="Enter Security Level..." value={formData.securityLevel} onChange={(v) => handleChange('securityLevel', v)} />
                    </div>
                    <div className="grid grid-cols-4 gap-x-8 gap-y-6 mb-6">
                      <FormField label="Height" placeholder="Enter Height..." value={formData.height} onChange={(v) => handleChange('height', v)} />
                      <FormField label="Weight" placeholder="Enter Weight..." value={formData.weight} onChange={(v) => handleChange('weight', v)} />
                      <FormField label="Gender" placeholder="Enter Gender..." value={formData.gender} onChange={(v) => handleChange('gender', v)} />
                      <FormField label="Eye color" placeholder="Enter eye color..." value={formData.eyeColor} onChange={(v) => handleChange('eyeColor', v)} />
                    </div>
                    <div className="flex justify-between items-end mb-6">
                      <div className="w-[calc(25%-1.5rem)]">
                        <FormField label="Hair color" placeholder="Enter Hair color..." value={formData.hairColor} onChange={(v) => handleChange('hairColor', v)} />
                      </div>
                    </div>

                    {/* Required Custom Fields */}
                    {customFieldsList.filter(f => !formConfig?.customImageFields?.includes(f.label)).length > 0 && (
                      <div className="mt-8 border-t border-gray-100 pt-6">
                        <h3 className="text-[11px] font-black text-gray-900 mb-6 group-hover:text-green-600 transition-colors uppercase tracking-wider">Required Custom Fields</h3>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                          {customFieldsList.map((field, idx) => {
                            if (formConfig?.customImageFields?.includes(field.label)) return null;
                            return (
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
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </Section>

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
                                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center z-10">
                                      <span className="bg-white/20 text-white px-4 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 backdrop-blur-md border border-white/30 hover:bg-white/30 transition-colors">
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
                                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center z-10">
                                  <span className="bg-white/20 text-white px-4 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 backdrop-blur-md border border-white/30 hover:bg-white/30 transition-colors">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-8" onClick={() => setImageViewerMemberId(null)}>
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
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
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
    </div>
  );
};


