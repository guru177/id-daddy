import React, { useState, useEffect } from 'react';
import Toolbar from '../designer/Toolbar';
import Canvas from '../designer/Canvas';
import { Dashboard } from '../designer/Dashboard';
import { useDesignerStore } from '../designer/store';
import { ImageLibraryModal } from '../designer/ImageLibrary';
import LayersPanel from '../designer/LayersPanel';
import { ContextMenu } from '../designer/ContextMenu';
import { getPreviewText, applyVariableStyles } from '../designer/Panels';
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
  Check
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
    
    canvas.getObjects().forEach((obj: any) => {
      if (obj.placeholder || obj.isVariable) {
        if (obj.type === 'i-text' || obj.type === 'textbox') {
          const rawText = obj.placeholder || obj.text;
          const previewText = getPreviewText(rawText, members);
          obj.set('text', previewText);
          applyVariableStyles(obj, members);
        } else if (obj.type === 'image' && obj.placeholder) {
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
    });
    canvas.renderAll();
  };

  return (
    <div className="relative member-dropdown flex items-center gap-2">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider hidden md:block">Preview:</span>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-xs font-bold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg py-1.5 px-3 cursor-pointer hover:bg-gray-100 transition-all shadow-sm w-48 justify-between"
      >
        <div className="flex items-center gap-2 truncate">
          {selectedMember?.profileImage ? (
            <img src={selectedMember.profileImage} className="w-5 h-5 rounded-full object-cover shrink-0 border border-gray-200" />
          ) : (
            <div className="w-5 h-5 rounded-full bg-gray-200 shrink-0 border border-gray-200" />
          )}
          <span className="truncate">{selectedMember ? `${selectedMember.firstName} ${selectedMember.lastName}` : 'Default (First)'}</span>
        </div>
        <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />
      </div>
      
      {isOpen && (
        <div className="absolute top-full left-[55px] mt-1 w-64 bg-white border border-gray-100 shadow-xl rounded-xl z-50 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-gray-100 bg-gray-50/50">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
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
                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-green-50 transition-colors ${(previewMemberId === m.id || (!previewMemberId && m.id === members[0]?.id)) ? 'bg-green-50/50 text-green-700 font-bold' : 'text-gray-700'}`}
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
              <div className="p-4 text-center text-xs text-gray-400 italic">No members found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export function DesignerView() {
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);
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
    savedDesigns,
    loadDesign,
    deleteDesign,
    modal,
    closeModal,
    showModal,
    activeTemplateId,
    setActiveTemplateId,
    members,
    previewMemberId,
    setPreviewMemberId
  } = useDesignerStore();

  const [view, setView] = useState<'dashboard' | 'editor'>('dashboard');
  const [activeTab, setActiveTab] = useState('Get Started');

  const navItems = ['Get Started', 'Card Designer', 'My Designs'];

  const MyDesigns = () => (
    <div className="p-10 max-w-[1600px] mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Design Library</h1>
          <p className="text-gray-500 text-base font-medium">You have {savedDesigns.length} saved templates in your library</p>
        </div>
        <button
          onClick={() => {
            newDesign();
            setActiveTab('Card Designer');
            setView('editor');
          }}
          className="flex items-center gap-3 px-8 py-4 bg-green-500 hover:bg-green-600 text-white text-sm font-black rounded-2xl shadow-2xl shadow-green-200 transition-all hover:-translate-y-1 active:scale-95"
        >
          <Plus size={20} strokeWidth={3} />
          Create New Design
        </button>
      </div>

      {savedDesigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-40 bg-white/50 backdrop-blur-xl rounded-[40px] border-2 border-dashed border-gray-200">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <Plus size={40} className="text-gray-300" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your library is empty</h2>
          <p className="text-gray-400 font-medium text-lg mb-8 text-center max-w-sm">
            Start creating your professional ID cards and they'll appear here for easy management.
          </p>
          <button
            onClick={() => {
              newDesign();
              setActiveTab('Card Designer');
              setView('editor');
            }}
            className="px-10 py-4 bg-gray-900 text-white font-black rounded-2xl hover:bg-gray-800 transition-all shadow-xl shadow-gray-200"
          >
            Start Designing Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
          {savedDesigns.map((design) => (
            <div
              key={design.id}
              className="group relative bg-white rounded-[32px] border border-gray-100 overflow-hidden hover:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.12)] transition-all duration-500 flex flex-col"
            >
              {/* Preview Image Container - Dual Side */}
              <div className="relative aspect-square w-full bg-gray-100 flex items-center justify-center overflow-hidden group-hover:bg-green-50/30 transition-colors duration-500">
                <div className={`w-full h-full flex ${design.config.orientation === 'horizontal' ? 'flex-col' : 'flex-row'}`}>
                  {/* Front Side Preview */}
                  <div className="flex-1 relative overflow-hidden border-b border-gray-100 last:border-0">
                    <img
                      src={design.thumbnailFront}
                      alt="Front"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md text-[10px] font-black text-white rounded-lg uppercase tracking-wider">Front</div>
                  </div>
                  {/* Back Side Preview */}
                  <div className="flex-1 relative overflow-hidden border-l border-gray-100 first:border-0">
                    <img
                      src={design.thumbnailBack}
                      alt="Back"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md text-[10px] font-black text-white rounded-lg uppercase tracking-wider">Back</div>
                  </div>
                </div>

                {activeTemplateId === design.id && (
                  <div className="absolute top-4 right-4 z-30 bg-amber-500 text-white p-2 rounded-xl shadow-lg animate-in zoom-in-50 duration-300">
                    <Star size={16} fill="white" />
                  </div>
                )}

                {/* Floating Action Overlay */}
                <div className="absolute inset-0 bg-gray-900/10 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-500 z-20 flex items-center justify-center gap-4">
                  <button
                    onClick={() => {
                      loadDesign(design);
                      setActiveTab('Card Designer');
                      setView('editor');
                    }}
                    className="p-4 bg-white text-gray-900 rounded-2xl hover:bg-green-500 hover:text-white transition-all transform translate-y-8 group-hover:translate-y-0 duration-500 shadow-xl"
                    title="Edit Design"
                  >
                    <Edit2 size={24} strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={() => {
                      showModal({
                        title: 'Delete Design',
                        message: `Are you sure you want to delete "${design.name}"? This action cannot be undone.`,
                        type: 'confirm',
                        onConfirm: () => deleteDesign(design.id)
                      });
                    }}
                    className="p-4 bg-white text-gray-900 rounded-2xl hover:bg-red-500 hover:text-white transition-all transform translate-y-8 group-hover:translate-y-0 duration-500 delay-100 shadow-xl"
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
                      className={`p-1.5 rounded-lg transition-all ${activeTemplateId === design.id ? 'bg-amber-100 text-amber-600 ring-1 ring-amber-200' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                      title={activeTemplateId === design.id ? 'Current Default Template' : 'Set as Default Template'}
                    >
                      <Star size={14} fill={activeTemplateId === design.id ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={() => {
                        loadDesign(design);
                        setActiveTab('Card Designer');
                        setView('editor');
                      }}
                      className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => {
                        showModal({
                          title: 'Delete Design',
                          message: `Are you sure you want to delete "${design.name}"? This action cannot be undone.`,
                          type: 'confirm',
                          onConfirm: () => deleteDesign(design.id)
                        });
                      }}
                      className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase tracking-widest">
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

  // GlobalModal is now handled in App.tsx

  if (activeTab === 'My Designs') {
    return (
      <div className="flex flex-col h-full bg-stone-50 overflow-hidden text-gray-800">
        <header className="h-[73px] bg-green-50/50 border-b border-stone-200 flex items-center justify-center gap-10 px-4 shrink-0">
          {navItems.map(item => (
            <button
              key={item}
              onClick={() => {
                setActiveTab(item);
                if (item === 'Card Designer') setView('editor');
                if (item === 'Get Started') setView('dashboard');
              }}
              className={`text-[11px] uppercase tracking-wide font-black h-full border-b-[3px] px-2 transition-all pt-[3px] ${activeTab === item ? 'border-[#34a853] text-[#34a853]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
              {item}
            </button>
          ))}
        </header>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <MyDesigns />
        </div>
      </div>
    );
  }

  if (view === 'dashboard') {
    return (
      <div className="flex flex-col h-full bg-white overflow-hidden text-gray-800">
        <header className="h-[73px] bg-green-50/50 border-b border-stone-200 flex items-center justify-center gap-10 px-4 shrink-0">
          {navItems.map(item => (
            <button
              key={item}
              onClick={() => {
                setActiveTab(item);
                if (item === 'Card Designer') setView('editor');
              }}
              className={`text-[11px] uppercase tracking-wide font-black h-full border-b-[3px] px-2 transition-all pt-[3px] ${activeTab === item ? 'border-[#34a853] text-[#34a853]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
              {item}
            </button>
          ))}
        </header>
        <Dashboard onSelect={() => setView('editor')} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-stone-100 overflow-hidden font-sans text-gray-800">
      {/* Top Navigation */}
      <header className="h-[73px] bg-green-50/50 border-b border-stone-200 flex items-center justify-center gap-10 px-4 shrink-0 z-20">
        {navItems.map(item => (
          <button
            key={item}
            onClick={() => {
              setActiveTab(item);
              if (item === 'Get Started') setView('dashboard');
            }}
            className={`text-[11px] uppercase tracking-wide font-black h-full border-b-[3px] px-2 transition-all pt-[3px] ${activeTab === item ? 'border-[#34a853] text-[#34a853]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            {item}
          </button>
        ))}
      </header>

      {/* Utility Toolbar */}
      <div className="h-12 bg-white border-b border-gray-100 flex items-center justify-between px-6 z-50 shrink-0 relative">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <button onClick={undo} disabled={history.length <= 1} className="p-1.5 hover:bg-gray-50 text-gray-400 disabled:opacity-20 transition-all">
              <Undo2 size={16} />
            </button>
            <button onClick={redo} disabled={redoStack.length === 0} className="p-1.5 hover:bg-gray-50 text-gray-400 disabled:opacity-20 transition-all">
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

          <div className="h-6 w-px bg-gray-100" />
          
          <div className="flex items-center gap-4 text-gray-400">
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`transition-all ${showGrid ? 'text-green-600' : 'hover:text-green-600'}`}
            >
              <Grid3X3 size={18} />
            </button>
            <button onClick={downloadCanvas} className="hover:text-green-600 transition-all"><Download size={18} /></button>
            <button onClick={newDesign} className="hover:text-green-600 transition-all"><Plus size={18} /></button>
          </div>
        </div>

        <button
          onClick={saveDesign}
          className="flex items-center gap-2 px-6 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg shadow-sm transition-all active:scale-95"
        >
          <Save size={14} />
          Save
        </button>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <Toolbar />

        {/* Editor Area */}
        <div
          className="flex-1 flex flex-col items-center bg-stone-100 relative overflow-hidden"
          onContextMenu={(e) => {
            e.preventDefault();
            setContextMenu({ x: e.clientX, y: e.clientY });
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              if (canvas) {
                canvas.discardActiveObject();
                canvas.requestRenderAll();
              }
            }
          }}
        >
          <div 
            className="flex-1 w-full flex items-center justify-center px-4 pt-10 pb-32"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                if (canvas) {
                  canvas.discardActiveObject();
                  canvas.requestRenderAll();
                }
              }
            }}
          >
            <Canvas />
          </div>

          {/* Side Toggle */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-md p-2 rounded-2xl border border-white shadow-2xl flex gap-2 z-10">
            <button
              onClick={() => setSide('front')}
              className={`px-10 py-3 text-xs font-black rounded-xl transition-all ${side === 'front' ? 'bg-green-500 text-white shadow-lg scale-105' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              Front Side
            </button>
            <button
              onClick={() => setSide('back')}
              className={`px-10 py-3 text-xs font-black rounded-xl transition-all ${side === 'back' ? 'bg-green-500 text-white shadow-lg scale-105' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              Back Side
            </button>
          </div>
        </div>

        {/* Right Sidebar: Layers */}
        <LayersPanel onContextMenu={(x, y) => setContextMenu({ x, y })} />
      </div>
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
        />
      )}
      <ImageLibraryModal />
    </div>
  );
}
