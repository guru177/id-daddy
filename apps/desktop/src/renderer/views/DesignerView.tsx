import React, { useState, useEffect, useRef } from 'react';
import Toolbar from '../designer/Toolbar';
import Canvas from '../designer/Canvas';
import { Dashboard } from '../designer/Dashboard';
import { useDesignerStore } from '../designer/store';
import { ImageLibraryModal } from '../designer/ImageLibrary';
import LayersPanel from '../designer/LayersPanel';
import { ContextMenu } from '../designer/ContextMenu';
import { getPreviewText, applyVariableStyles, generateSecurityImageURL } from '../designer/Panels';
import { Ruler } from '../designer/Rulers';
import {
  Undo2,
  Redo2,
  Download,
  Save,
  Plus,
  Share2,
  Grid3X3,
  FileUp,
  Settings,
  Edit2,
  Trash2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  X,
  Star,
  Search,
  ChevronDown,
  Check,
  ZoomIn,
  ZoomOut,
  Maximize2,
  CheckCircle
} from 'lucide-react';

const MemberDropdown = ({ members, previewMemberId, setPreviewMemberId, canvas }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const filteredMembers = members.filter((m: any) => 
    `${m.firstName} ${m.lastName}`.toLowerCase().includes(search.toLowerCase())
  );
  
  const selectedMember = previewMemberId ? members.find((m: any) => m.id === previewMemberId) : members[0];
  
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.member-dropdown')) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = (id: string) => {
    setPreviewMemberId(id);
    setIsOpen(false);
    setSearch('');
    
    if (!canvas) return;
    const targetMember = id ? members.find((m: any) => m.id === id) || members[0] : members[0];
    
    canvas.getObjects().forEach(async (obj: any) => {
      if (obj.placeholder || obj.isVariable) {
        if (obj.type === 'i-text' || obj.type === 'textbox') {
          const rawText = obj.placeholder || obj.text;
          const previewText = getPreviewText(rawText, members);
          obj.set('text', previewText);
          applyVariableStyles(obj, members);
        } else if (obj.type === 'image' && obj.placeholder) {
          const ph = obj.placeholder;
          if (ph === '{{barcode}}' || ph === '{{qr_code}}' || ph === '{{pdf417}}' || ph === '{{datamatrix}}') {
            const dataUrl = await generateSecurityImageURL(obj, targetMember);
            if (dataUrl) {
              obj.setSrc(dataUrl, () => {
                canvas.renderAll();
              }, { crossOrigin: 'anonymous' });
            }
          } else {
            const key = obj.placeholder.replace(/[{}]/g, '').trim();
            let url = '';
            if (key === 'photo') url = targetMember.profileImage;
            else if (key === 'signature') url = targetMember.signature;
            else if (key === 'fingerprint') url = targetMember.fingerprint;
            else if (key === 'logo') url = targetMember.divisionLogo;
            else if (targetMember.customFields && targetMember.customFields[key]) {
              url = targetMember.customFields[key];
            }
            
            if (url) {
              obj.setSrc(url, () => {
                 canvas.renderAll();
              }, { crossOrigin: 'anonymous' });
            }
          }
        }
      }
    });
    canvas.renderAll();
  };

  return (
    <div className="relative member-dropdown flex items-center gap-2">
      <span className="text-[10px] font-bold text-gray-900 uppercase tracking-wider hidden md:block">Preview:</span>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-xs font-bold text-gray-900 bg-gray-50 border border-gray-200 rounded-lg py-1.5 px-3 cursor-pointer hover:bg-gray-100 transition-all  w-48 justify-between"
      >
        <div className="flex items-center gap-2 truncate">
          {selectedMember?.profileImage ? (
            <img src={selectedMember.profileImage} className="w-5 h-5 rounded-full object-cover shrink-0 border border-gray-200" />
          ) : (
            <div className="w-5 h-5 rounded-full bg-gray-200 shrink-0 border border-gray-200" />
          )}
          <span className="truncate">{selectedMember ? `${selectedMember.firstName} ${selectedMember.lastName}` : 'Default (First)'}</span>
        </div>
        <ChevronDown size={14} className="text-gray-900 flex-shrink-0" />
      </div>
      
      {isOpen && (
        <div className="absolute top-full left-[55px] mt-1 w-64 bg-white border border-gray-100  rounded-xl z-50 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-gray-100 bg-gray-50/50">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-900" />
              <input 
                type="text" 
                placeholder="Search members..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 transition-all"
              />
            </div>
          </div>
          <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
            {filteredMembers.length > 0 ? filteredMembers.map((m: any) => (
              <button
                key={m.id}
                onClick={() => handleSelect(m.id)}
                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-green-50 transition-colors ${(previewMemberId === m.id || (!previewMemberId && m.id === members[0]?.id)) ? 'bg-green-50/50 text-green-700 font-bold' : 'text-gray-900'}`}
              >
                <div className="flex items-center gap-2 truncate">
                  {m.profileImage ? (
                     <img src={m.profileImage} className="w-6 h-6 rounded-full object-cover shrink-0 border border-gray-200" />
                  ) : (
                     <div className="w-6 h-6 rounded-full bg-gray-200 shrink-0 border border-gray-200" />
                  )}
                  <span className="truncate">{m.firstName} {m.lastName}</span>
                </div>
                {(previewMemberId === m.id || (!previewMemberId && m.id === members[0]?.id)) && <Check size={14} className="text-green-600 flex-shrink-0" />}
              </button>
            )) : (
              <div className="p-4 text-center text-xs text-gray-900 italic">No members found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export function DesignerView() {
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);
  // Pending action while unsaved-changes dialog is shown
  const [pendingAction, setPendingAction] = useState<null | (() => void)>(null);

  const {
    canvas,
    undo,
    redo,
    history,
    redoStack,
    side,
    setSide,
    config,
    showGrid,
    setShowGrid,
    downloadCanvas,
    saveDesign,
    newDesign,
    resetDesign,
    savedDesigns,
    loadDesign,
    loadGlobalTemplateAsCopy,
    deleteDesign,
    loadTemplatesFromDb,
    modal,
    closeModal,
    showModal,
    activeTemplateId,
    setActiveTemplateId,
    members,
    previewMemberId,
    setPreviewMemberId,
    guidelines,
    addGuideline,
    updateGuideline,
    removeGuideline,
    zoom,
    setZoom,
    resetZoom
  } = useDesignerStore();

  // Sync templates from DB whenever the designer view opens
  useEffect(() => {
    void loadTemplatesFromDb();
  }, []);

  // Save indicator state
  const [savedIndicator, setSavedIndicator] = useState<'idle' | 'saving' | 'saved'>('idle');

  const handleSave = async () => {
    setSavedIndicator('saving');
    await saveDesign();
    setSavedIndicator('saved');
    setTimeout(() => setSavedIndicator('idle'), 2000);
  };

  // True when the user has made changes that haven't been saved yet.
  // history[0] is the initial blank state; anything beyond that is a real edit.
  const hasUnsavedChanges = history.length > 1;

  /**
   * Intercepts a navigation action (load template / blank canvas).
   * If there are unsaved changes, shows a 3-button warning dialog.
   * Otherwise runs the action immediately.
   */
  const interceptAction = (action: () => void) => {
    if (hasUnsavedChanges) {
      setPendingAction(() => action);
    } else {
      action();
    }
  };

  const [draggingGuideline, setDraggingGuideline] = useState<{ type: 'horizontal' | 'vertical', pos: number, index?: number } | null>(null);
  const [workspaceOffset, setWorkspaceOffset] = useState({ x: 0, y: 0 });
  const workspaceRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const updateOffset = () => {
      if (workspaceRef.current && cardRef.current) {
        const wRect = workspaceRef.current.getBoundingClientRect();
        const cRect = cardRef.current.getBoundingClientRect();
        setWorkspaceOffset({
          x: cRect.left - wRect.left,
          y: cRect.top - wRect.top
        });
      }
    };

    updateOffset();
    window.addEventListener('resize', updateOffset);
    // Also update when side/config changes as card size might change
    return () => window.removeEventListener('resize', updateOffset);
  }, [side, config.orientation]);

  useEffect(() => {
    if (!draggingGuideline) return;

    const handleMove = (e: MouseEvent) => {
      if (!workspaceRef.current) return;
      const rect = workspaceRef.current.getBoundingClientRect();
      
      const scale = config.orientation === 'horizontal' ? 700/1013 : 400/638;
      
      if (draggingGuideline.type === 'horizontal') {
        const y = (e.clientY - rect.top - workspaceOffset.y) / scale;
        setDraggingGuideline({ ...draggingGuideline, pos: y });
      } else {
        const x = (e.clientX - rect.left - workspaceOffset.x) / scale;
        setDraggingGuideline({ ...draggingGuideline, pos: x });
      }
    };

    const handleUp = () => {
      if (draggingGuideline) {
        if (draggingGuideline.index !== undefined) {
          updateGuideline(draggingGuideline.type, draggingGuideline.index, draggingGuideline.pos);
        } else {
          addGuideline(draggingGuideline.type, draggingGuideline.pos);
        }
        setDraggingGuideline(null);
      }
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [draggingGuideline]);

  const startGuidelineDrag = (type: 'horizontal' | 'vertical') => {
    setDraggingGuideline({ type, pos: -100 }); // Start off-screen
  };

  const [activeTab, setActiveTab] = useState('Get Started');
  const navItems = ['Get Started', 'Card Designer', 'My Designs'];

  const MyDesigns = () => {
    // Only show user-owned designs; global templates live in Get Started only
    const userDesigns = savedDesigns.filter((d: any) => !d.isGlobal);
    return (
      <div className="p-10 max-w-[1600px] mx-auto min-h-screen">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Design Library</h1>
            <p className="text-gray-900 text-base font-medium">You have {userDesigns.length} saved templates in your library</p>
          </div>
          <button
            onClick={() => { interceptAction(() => { resetDesign(); setActiveTab('Card Designer'); }); }}
            className="flex items-center gap-3 px-8 py-4 bg-green-500 hover:bg-green-600 text-white text-sm font-black rounded-2xl   transition-all hover:-translate-y-1 active:scale-95"
          >
            <Plus size={20} strokeWidth={3} />
            Create New Design
          </button>
        </div>

        {userDesigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 bg-white/50 backdrop-blur-xl rounded-[40px] border-2 border-dashed border-gray-200">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Plus size={40} className="text-gray-300" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your library is empty</h2>
            <p className="text-gray-900 font-medium text-lg mb-8 text-center max-w-sm">
              Start creating your professional ID cards and they will appear here for easy management.
            </p>
            <button
              onClick={() => { interceptAction(() => { resetDesign(); setActiveTab('Card Designer'); }); }}
              className="px-10 py-4 bg-gray-900 text-white font-black rounded-2xl hover:bg-gray-800 transition-all  "
            >
              Start Designing Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
            {userDesigns.map((design) => (
              <div
                key={design.id}
                className="group relative bg-white rounded-[32px] border border-gray-100 overflow-hidden  transition-all duration-500 flex flex-col"
              >
                {/* Preview: Dual Side */}
                <div className="relative aspect-square w-full bg-gray-100 flex items-center justify-center overflow-hidden group-hover:bg-green-50/30 transition-colors duration-500">
                  <div className={`w-full h-full flex ${design.config.orientation === 'horizontal' ? 'flex-col' : 'flex-row'}`}>
                    <div className="flex-1 relative overflow-hidden border-b border-gray-100 last:border-0">
                      <img src={design.thumbnailFront} alt="Front" className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md text-[10px] font-black text-white rounded-lg uppercase tracking-wider">Front</div>
                    </div>
                    <div className="flex-1 relative overflow-hidden border-l border-gray-100 first:border-0">
                      <img src={design.thumbnailBack} alt="Back" className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md text-[10px] font-black text-white rounded-lg uppercase tracking-wider">Back</div>
                    </div>
                  </div>
                  {activeTemplateId === design.id && (
                    <div className="absolute top-4 right-4 z-30 bg-amber-500 text-white p-2 rounded-xl  animate-in zoom-in-50 duration-300">
                      <Star size={16} fill="white" />
                    </div>
                  )}
                  {/* Floating Action Overlay */}
                  <div className="absolute inset-0 bg-gray-900/10 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-500 z-20 flex items-center justify-center gap-4">
                    <button
                      onClick={() => { loadDesign(design); setActiveTab('Card Designer'); }}
                      className="p-4 bg-white text-gray-900 rounded-2xl hover:bg-green-500 hover:text-white transition-all transform translate-y-8 group-hover:translate-y-0 duration-500 "
                      title="Edit Design"
                    >
                      <Edit2 size={24} strokeWidth={2.5} />
                    </button>
                    <button
                      onClick={() => { showModal({ title: 'Delete Design', message: `Are you sure you want to delete "${design.name}"? This action cannot be undone.`, type: 'confirm', onConfirm: () => deleteDesign(design.id) }); }}
                      className="p-4 bg-white text-gray-900 rounded-2xl hover:bg-red-500 hover:text-white transition-all transform translate-y-8 group-hover:translate-y-0 duration-500 delay-100 "
                      title="Delete"
                    >
                      <Trash2 size={24} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="p-6 pt-5 bg-white mt-auto border-t border-gray-50">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-black text-gray-900 text-lg truncate flex-1 leading-tight">{design.name}</h3>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setActiveTemplateId(design.id)}
                        className={`p-1.5 rounded-lg transition-all ${activeTemplateId === design.id ? 'bg-amber-100 text-amber-600 ring-1 ring-amber-200' : 'bg-gray-50 text-gray-900 hover:bg-gray-100'}`}
                        title={activeTemplateId === design.id ? 'Current Default Template' : 'Set as Default Template'}
                      >
                        <Star size={14} fill={activeTemplateId === design.id ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        onClick={() => { loadDesign(design); setActiveTab('Card Designer'); }}
                        className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => { showModal({ title: 'Delete Design', message: `Are you sure you want to delete "${design.name}"? This action cannot be undone.`, type: 'confirm', onConfirm: () => deleteDesign(design.id) }); }}
                        className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-900 font-bold uppercase tracking-widest">
                      <Calendar size={14} className="text-gray-300" />
                      {new Date(design.timestamp).toLocaleDateString()}
                    </div>
                    <button
                      onClick={() => useDesignerStore.getState().exportDesign(design)}
                      className="text-xs font-black text-green-600 hover:text-green-700 transition-colors flex items-center gap-1.5"
                    >
                      <Download size={14} />
                      EXPORT PNG
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };


  // ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Single unified return ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â tab bar always visible ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
  return (
    <div className="flex flex-col h-full bg-[#fdfaf5] overflow-hidden font-sans text-[#2c3e50]">

      {/* ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Shared Tab Navigation ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ */}
      <header className="h-[73px] bg-gradient-to-r from-[#f5ece2] via-[#f5ece2]/80 to-[#d4e7d4]/40 border-b border-[#e8d5c4]/60 flex items-center justify-center gap-10 px-4 shrink-0 z-20">
        {navItems.map(item => (
          <button
            key={item}
            onClick={() => setActiveTab(item)}
            className={`text-[11px] uppercase tracking-widest font-black h-full border-b-[3px] px-3 transition-all pt-[3px] ${
              activeTab === item 
                ? 'border-[#1a5d1a] text-[#1a5d1a]' 
                : 'border-transparent text-[#2c3e50]/60 hover:text-[#1a5d1a]'
            }`}
          >
            {item}
          </button>
        ))}
      </header>

      {/* ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Get Started Tab ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ */}
      {activeTab === 'Get Started' && (
        <Dashboard onSelect={(design) => {
          const action = () => {
            if (design) {
              if ((design as any).isGlobal) {
                loadGlobalTemplateAsCopy(design);
              } else {
                loadDesign(design);
              }
            } else {
              resetDesign();
            }
            setActiveTab('Card Designer');
          };
          interceptAction(action);
        }} />
      )}

      {/* ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ My Designs Tab ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ */}
      {activeTab === 'My Designs' && (
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#fdfaf5]">
          <MyDesigns />
        </div>
      )}

      {/* ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Card Designer Tab ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ always mounted, hidden when on other tabs to preserve canvas state */}
      <div style={{ display: activeTab === 'Card Designer' ? 'flex' : 'none' }} className="flex-col flex-1 min-h-0">

        {/* Utility Toolbar ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â only visible on Card Designer tab */}
        <div className="h-12 bg-[#f5ece2]/60 border-b border-[#e8d5c4]/60 flex items-center justify-between px-6 z-50 shrink-0 relative backdrop-blur-sm">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <button onClick={undo} disabled={history.length <= 1} className="p-1.5 rounded-lg hover:bg-[#e8d5c4]/50 text-[#2c3e50] disabled:opacity-20 transition-all">
                <Undo2 size={16} />
              </button>
              <button onClick={redo} disabled={redoStack.length === 0} className="p-1.5 rounded-lg hover:bg-[#e8d5c4]/50 text-[#2c3e50] disabled:opacity-20 transition-all">
                <Redo2 size={16} />
              </button>
            </div>
            <div className="h-6 w-px bg-gray-100" />
            <MemberDropdown
              members={members}
              previewMemberId={previewMemberId}
              setPreviewMemberId={setPreviewMemberId}
              canvas={canvas}
            />
            <div className="h-6 w-px bg-[#e8d5c4]" />
            <div className="flex items-center gap-4 text-[#2c3e50]/70">
              <button onClick={() => setShowGrid(!showGrid)} className={`transition-all ${showGrid ? 'text-[#1a5d1a]' : 'hover:text-[#1a5d1a]'}`}>
                <Grid3X3 size={18} />
              </button>
              <button onClick={downloadCanvas} className="hover:text-[#1a5d1a] transition-all"><Download size={18} /></button>
              <button onClick={newDesign} className="hover:text-[#1a5d1a] transition-all"><Plus size={18} /></button>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={savedIndicator === 'saving'}
            className={`flex items-center gap-2 px-6 py-2 text-xs font-bold rounded-lg transition-all active:scale-95 ${
              savedIndicator === 'saved'
                ? 'bg-green-50 text-green-600 border border-green-200'
                : 'bg-green-500 hover:bg-green-600 text-white shadow-md shadow-green-200'
            }`}
          >
            {savedIndicator === 'saved' ? (
              <><CheckCircle size={14} /> Saved!</>
            ) : savedIndicator === 'saving' ? (
              <><Save size={14} className="animate-bounce" /> Saving...</>
            ) : (
              <><Save size={14} /> Save</>
            )}
          </button>
        </div>

        {/* Main Editor Row */}
        <div className="flex flex-1 min-h-0">
          {/* Left Toolbar */}
          <Toolbar />

          {/* Canvas Workspace Wrapper */}
          <div className="flex-1 relative flex bg-[#f0ebe4] min-h-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #d4c4b0 1px, transparent 0)', backgroundSize: '24px 24px' }}>
            {/* Canvas Workspace */}
            <div
              ref={workspaceRef}
              className="flex-1 flex flex-col items-center relative overflow-auto"
              onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY }); }}
            onClick={(e) => { if (e.target === e.currentTarget && canvas) { canvas.discardActiveObject(); canvas.requestRenderAll(); } }}
          >
            {/* Rulers */}
            <div className="absolute top-0 left-5 right-0 h-5 z-30">
              <Ruler type="horizontal" size={workspaceRef.current?.clientWidth || 2000} scale={(config.orientation === 'horizontal' ? 700/1013 : 400/638) * zoom} offset={workspaceOffset.x - 20} onStartDrag={startGuidelineDrag} />
            </div>
            <div className="absolute top-5 left-0 bottom-0 w-5 z-30">
              <Ruler type="vertical" size={workspaceRef.current?.clientHeight || 2000} scale={(config.orientation === 'horizontal' ? 700/1013 : 400/638) * zoom} offset={workspaceOffset.y - 25} onStartDrag={startGuidelineDrag} />
            </div>
            <div className="absolute top-0 left-0 w-5 h-5 bg-[#e8ddd4] border-r border-b border-[#d4c4b0] z-40" />

            {/* Card */}
            <div
              className="flex-1 w-full flex items-start justify-center pt-20 px-20 pb-40 min-h-0 shrink-0"
              onClick={(e) => { if (e.target === e.currentTarget && canvas) { canvas.discardActiveObject(); canvas.requestRenderAll(); } }}
            >
              <div ref={cardRef} className="relative " style={{ width: (config.orientation === 'horizontal' ? 700 : 400) * zoom, height: (config.orientation === 'horizontal' ? 441 : 633) * zoom }}>
                <Canvas />
              </div>
            </div>

            {/* Guidelines Overlay */}
            <div className="absolute inset-0 pointer-events-none z-40">
              {(() => {
                const scale = config.orientation === 'horizontal' ? 700/1013 : 400/638;
                return (
                  <>
                    {guidelines.horizontal.map((canvasY, i) => {
                      const y = canvasY * scale + workspaceOffset.y;
                      return (
                        <div key={`h-${i}`} onMouseDown={(e) => { e.stopPropagation(); setDraggingGuideline({ type: 'horizontal', pos: canvasY, index: i }); }} onDoubleClick={() => removeGuideline('horizontal', i)} className="absolute left-5 right-0 h-2 -mt-1 bg-transparent pointer-events-auto cursor-ns-resize group z-50" style={{ top: y }}>
                          <div className="h-px w-full bg-red-500/60 group-hover:bg-red-600 mt-1" />
                          <div className="absolute -top-6 right-4 hidden group-hover:block bg-red-500 text-white text-[8px] px-2 py-1 rounded  whitespace-nowrap">Drag to move ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ Dbl-click to delete</div>
                        </div>
                      );
                    })}
                    {guidelines.vertical.map((canvasX, i) => {
                      const x = canvasX * scale + workspaceOffset.x;
                      return (
                        <div key={`v-${i}`} onMouseDown={(e) => { e.stopPropagation(); setDraggingGuideline({ type: 'vertical', pos: canvasX, index: i }); }} onDoubleClick={() => removeGuideline('vertical', i)} className="absolute top-5 bottom-0 w-2 -ml-1 bg-transparent pointer-events-auto cursor-ew-resize group z-50" style={{ left: x }}>
                          <div className="w-px h-full bg-red-500/60 group-hover:bg-red-600 ml-1" />
                          <div className="absolute left-3 top-6 hidden group-hover:block bg-red-500 text-white text-[8px] px-2 py-1 rounded  whitespace-nowrap">Drag to move ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ Dbl-click to delete</div>
                        </div>
                      );
                    })}
                    {draggingGuideline && (
                      <div className={`absolute bg-red-400/80 ${draggingGuideline.type === 'horizontal' ? 'left-5 right-0 h-px' : 'top-5 bottom-0 w-px'}`} style={{ [draggingGuideline.type === 'horizontal' ? 'top' : 'left']: draggingGuideline.pos * scale + (draggingGuideline.type === 'horizontal' ? workspaceOffset.y : workspaceOffset.x) }} />
                    )}
                  </>
                );
              })()}
            </div>

            </div>

            {/* Front / Back Toggle on Center Right Edge */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-[#f5ece2]/95 backdrop-blur-md p-2 rounded-l-2xl border-l border-y border-[#e8d5c4] flex flex-col gap-2 z-50 pointer-events-auto">
              <button onClick={() => setSide('front')} className={`px-4 py-6 text-xs font-black rounded-xl transition-all flex flex-col items-center gap-1 ${
                side === 'front' 
                  ? 'bg-gradient-to-b from-[#1a5d1a] to-[#2d7a2d] text-white scale-105 shadow-lg shadow-green-900/20' 
                  : 'text-[#2c3e50] hover:bg-[#e8d5c4]/50'
              }`}>
                <span className="[writing-mode:vertical-rl] rotate-180 tracking-widest uppercase">Front</span>
              </button>
              <button onClick={() => setSide('back')} className={`px-4 py-6 text-xs font-black rounded-xl transition-all flex flex-col items-center gap-1 ${
                side === 'back' 
                  ? 'bg-gradient-to-b from-[#1a5d1a] to-[#2d7a2d] text-white scale-105 shadow-lg shadow-green-900/20' 
                  : 'text-[#2c3e50] hover:bg-[#e8d5c4]/50'
              }`}>
                <span className="[writing-mode:vertical-rl] rotate-180 tracking-widest uppercase">Back</span>
              </button>
            </div>
          </div>

          {/* Right Sidebar: Layers */}
          <LayersPanel onContextMenu={(x, y) => setContextMenu({ x, y })} />
        </div>
      </div>

      {/* Shared overlays */}
      {contextMenu && <ContextMenu x={contextMenu.x} y={contextMenu.y} onClose={() => setContextMenu(null)} />}
      <ImageLibraryModal />

      {/* ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Unsaved Changes Warning Modal ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ */}
      {pendingAction && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-[3px] animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-[28px]  border border-gray-100 p-8 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-center mb-5">
              <div className="h-16 w-16 rounded-full bg-amber-50 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-amber-500" strokeWidth={2} />
              </div>
            </div>
            <h3 className="text-xl font-black text-gray-900 text-center mb-2">Unsaved Changes</h3>
            <p className="text-gray-900 font-medium text-sm text-center mb-8 leading-relaxed">
              You have unsaved changes on the current design.<br />
              Would you like to save before continuing?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={async () => { await saveDesign(); const a = pendingAction; setPendingAction(null); a?.(); }}
                className="w-full h-12 bg-green-500 hover:bg-green-600 text-white font-black rounded-2xl transition-all   active:scale-95 flex items-center justify-center gap-2"
              >
                <Save className="h-4 w-4" /> Save & Continue
              </button>
              <button
                onClick={() => { const a = pendingAction; setPendingAction(null); a?.(); }}
                className="w-full h-12 bg-gray-100 hover:bg-red-50 text-gray-900 hover:text-red-600 font-black rounded-2xl transition-all active:scale-95"
              >
                Discard & Continue
              </button>
              <button onClick={() => setPendingAction(null)} className="w-full h-10 text-gray-900 hover:text-gray-900 font-bold text-sm transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


