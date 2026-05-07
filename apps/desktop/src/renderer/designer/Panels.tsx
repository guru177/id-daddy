import React from 'react';
import { useDesignerStore } from './store';
import { fabric } from 'fabric';
import {
  CreditCard,
  Type,
  Image as ImageIcon,
  ShieldCheck,
  Shapes,
  Watch,
  SlidersHorizontal,
  X,
  Plus,
  Minus,
  Square,
  Circle as CircleIcon,
  Triangle as TriangleIcon,
  Minus as LineIcon,
  Star,
  Hexagon,
  Heart,
  ArrowRight,
  Shield,
  MousePointer2,
  Sparkles,
  ScanBarcode,
  QrCode,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Info,
} from 'lucide-react';
import { AddImageDialog } from './ImageLibrary';
import QRCode from 'qrcode';
import bwipjs from 'bwip-js';
import { removeBackground } from '@imgly/background-removal';

const GOOGLE_FONTS = Array.from(new Set([
  // Popular Global
  "Inter", "Roboto", "Open Sans", "Lato", "Montserrat", "Oswald", "Source Sans Pro", "Slabo 27px", 
  "Raleway", "PT Sans", "Merriweather", "Noto Sans", "Nunito", "Concert One", "Prompt", "Work Sans",
  "Ubuntu", "Playfair Display", "Lora", "Rubik", "Mukta", "Nanum Gothic", "Inconsolata", "Quicksand",
  "Titillium Web", "PT Serif", "Fira Sans", "Barlow", "Josefin Sans", "Libre Franklin", "Poppins",
  "Cabin", "Anton", "Bitter", "Dosis", "Hind", "Arimo", "Varela Round", "Oxygen", "Bebas Neue",
  "Abel", "Teko", "Yanone Kaffeesatz", "Fjalla One", "Exo 2", "Asap", "Dancing Script", "Pacifico",
  "Arvo", "Righteous", "Crete Round", "Rokkitt", "Zilla Slab", "Caveat", "Indie Flower", "Shadows Into Light",
  "Amatic SC", "Acme", "Bree Serif", "Questrial", "Signika", "Cinzel", "Crimson Text", "Play",
  "Permanent Marker", "Courgette", "Domine", "Cardo", "Cookie", "Vollkorn",
  "Philosopher", "Great Vibes", "Sacramento", "Satisfy", "Kaushan Script", "Kalam", "Patua One",
  "Changa One", "Fredoka One", "Russo One", "Glegoo", "Gudea", "Squada One", "Cantarell",
  "Orbitron", "Audiowide", "Marmelad", "Special Elite", "Syncopate", "Allerta Stencil", "Oleo Script",
  "Jura", "Saira", "Fira Code", "Overpass", "Karla", "Cormorant", "Taviraj", "Prata", "Heebo",
  "Mulish", "Manrope", "Outfit", "Plus Jakarta Sans", "Space Grotesk", "Space Mono", "Syne", "DM Sans",
  "Nunito Sans", "Ubuntu Condensed", "Kanit", "Muli", "Fira Sans Condensed", "Zilla Slab Highlight", "Asap Condensed", "Catamaran", "Exo", "Libre Baskerville", "Merriweather Sans", "Noto Serif", "Source Serif Pro", "Yantramanav", "Alegreya", "Alegreya Sans", "Archivo", "Archivo Narrow", "Assistant", "Barlow Condensed", "Barlow Semi Condensed", "Cairo", "Changa", "Comfortaa", "Cormorant Garamond", "Crimson Pro", "DM Serif Display", "DM Serif Text", "Fira Sans Extra Condensed", "Francois One", "Frank Ruhl Libre", "Josefin Slab", "Montserrat Alternates", "PT Sans Caption", "PT Sans Narrow", "Public Sans", "Rajdhani", "Roboto Condensed", "Roboto Mono", "Roboto Slab", "Signika Negative", "Source Code Pro", "Spectral", 
  
  // System Standard
  "Arial", "Times New Roman", "Courier New", "Verdana", "Georgia", "Comic Sans MS", "Trebuchet MS", "Impact",
  
  // Indian Language Fonts (Hindi, Tamil, Telugu, Malayalam, Bengali, Gujarati, Kannada, Odia, Gurmukhi)
  "Mukta", "Poppins", "Hind", "Rajdhani", "Yantramanav", "Kalam", "Tiro Devanagari Hindi", "Amita", "Arya", "Asar", "Biryani", "Cambay", "Chandas", "Chilanka", "Eczar", "Gargi", "Glegoo", "Gotu", "Halant", "Inknut Antiqua", "Jaldi", "Kadwa", "Khand", "Khula", "Kurale", "Laila", "Lateef", "Martel", "Martel Sans", "Modak", "NTR", "Palanquin", "Palanquin Dark", "Pramukh", "Pridi", "Proza Libre", "Ranga", "Rhodium Libre", "Rozha One", "Sahitya", "Saman", "Samarkan", "Sarala", "Sarpanch", "Shrikhand", "Sura", "Suranna", "Suryakant", "Teko", "Tillana", "Utsaah", "Vesper Libre", "Yatra One", "Noto Sans Devanagari", "Noto Serif Devanagari", "Tiro Devanagari Marathi", "Tiro Devanagari Sanskrit",
  
  "Hind Madurai", "Arima Madurai", "Coiny", "Catamaran", "Meera Inimai", "Baloo Thambi 2", "Kavivanar", "Pavanam", "Noto Sans Tamil", "Noto Serif Tamil", "Tiro Tamil", "Mukta Malar",
  
  "Hind Telugu", "Ramabhadra", "Mallanna", "Mandali", "Suravaram", "Tenali Ramakrishna", "NTR", "Peddana", "Ponnala", "Ravi Prakash", "Sree Krushnadevaraya", "Timmana", "Dhurjati", "Gidugu", "Gurajada", "Lakki Reddy", "Noto Sans Telugu", "Noto Serif Telugu", "Tiro Telugu",
  
  "Hind Siliguri", "Mina", "Galada", "Atma", "Noto Sans Bengali", "Noto Serif Bengali", "Tiro Bangla", "Baloo Da 2",
  
  "Hind Colombo", "Manjari", "Dyuthi", "Suruma", "AnjaliOldLipi", "Noto Sans Malayalam", "Noto Serif Malayalam", "Baloo Chettan 2",
  
  "Hind Vadodara", "Mukt Vaani", "Farsan", "Mogra", "Rasa", "Noto Sans Gujarati", "Noto Serif Gujarati", "Baloo Bhai 2",
  
  "Hind Jalandhar", "Mukta Mahee", "Baloo Paaji 2", "Noto Sans Gurmukhi", "Noto Serif Gurmukhi", "Tiro Gurmukhi",
  
  "Noto Sans Kannada", "Noto Serif Kannada", "Tiro Kannada", "Noto Sans Odia", "Baloo Bhaina 2", "Baloo Tamma 2",
  
  "Anek Devanagari", "Anek Tamil", "Anek Telugu", "Anek Malayalam", "Anek Bengali", "Anek Gujarati", "Anek Kannada", "Anek Odia", "Anek Gurmukhi"
])).sort();

export const loadGoogleFont = async (fontName: string) => {
  if (!fontName || ['Arial', 'Times New Roman', 'Courier New', 'Verdana', 'Georgia', 'Comic Sans MS', 'Trebuchet MS', 'Impact'].includes(fontName)) return Promise.resolve();
  const linkId = `font-${fontName.replace(/\s+/g, '-')}`;
  if (!document.getElementById(linkId)) {
    const link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:wght@300;400;500;600;700;800&display=swap`;
    document.head.appendChild(link);
  }
  
  try {
    await document.fonts.load(`16px "${fontName}"`);
    await document.fonts.ready;
    // Add a small delay to ensure the browser's font parsing and Canvas 2D context catch up
    await new Promise(resolve => setTimeout(resolve, 150));
  } catch (err) {
    console.warn('Font loading API failed or timed out:', err);
  }
};

const FontSelect = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const filteredFonts = React.useMemo(() => {
    return GOOGLE_FONTS.filter(f => f.toLowerCase().includes(search.toLowerCase()));
  }, [search]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative flex-1" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs outline-none bg-white text-left flex justify-between items-center h-[34px] hover:bg-gray-50 transition-colors"
      >
        <span className="truncate" style={{ fontFamily: value }}>{value || 'Select Font'}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50 shrink-0 ml-1"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </button>
      
      {isOpen && (
        <div className="absolute z-50 w-[200px] mt-1 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden flex flex-col" style={{ maxHeight: '300px' }}>
          <div className="p-2 border-b border-gray-100 bg-gray-50 shrink-0">
            <input
              autoFocus
              type="text"
              placeholder="Search fonts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full p-1.5 text-xs border border-gray-200 rounded bg-white outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
            />
          </div>
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            {filteredFonts.map(font => (
              <button
                key={font}
                onClick={async () => {
                  setIsOpen(false);
                  setSearch('');
                  
                  // Wait for font to fully load before telling the canvas to update!
                  await loadGoogleFont(font);
                  onChange(font);
                  
                  // Re-apply variable styles after font change (different fonts have different char widths)
                  const { selectedObject, members } = useDesignerStore.getState();
                  if (selectedObject && members) {
                    applyVariableStyles(selectedObject, members);
                    if ((selectedObject as any).canvas) (selectedObject as any).canvas.renderAll();
                  }
                }}
                className={`w-full text-left px-3 py-2 text-[13px] hover:bg-green-50 transition-colors ${value === font ? 'bg-green-50 text-green-700 font-bold' : 'text-gray-700'}`}
                style={{ fontFamily: font }}
              >
                {font}
              </button>
            ))}
            {filteredFonts.length === 0 && (
              <div className="p-3 text-xs text-gray-400 text-center">No fonts found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const CardOptionsPanel = () => {
  const { config, setConfig, canvas } = useDesignerStore();

  const updateOrientation = (o: 'horizontal' | 'vertical') => {
    if (!canvas) return;
    const [w, h] = o === 'horizontal' ? [1013, 638] : [638, 1013];
    canvas.setDimensions({ width: w, height: h });
    setConfig({ orientation: o });
  };

  return (
    <div className="space-y-6">
      <section>
        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-3">Orientation</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => updateOrientation('horizontal')}
            className={`flex flex-col items-center p-4 border rounded-2xl transition-all ${config.orientation === 'horizontal' ? 'border-green-500 bg-green-50 shadow-sm ring-1 ring-green-500' : 'border-gray-100 hover:border-gray-200 bg-gray-50/30'}`}
          >
            <div className={`w-12 h-8 border-2 rounded-md mb-2 transition-colors ${config.orientation === 'horizontal' ? 'border-green-600' : 'border-gray-300'}`} />
            <span className={`text-[11px] font-bold ${config.orientation === 'horizontal' ? 'text-green-700' : 'text-gray-500'}`}>Horizontal</span>
          </button>
          <button
            onClick={() => updateOrientation('vertical')}
            className={`flex flex-col items-center p-4 border rounded-2xl transition-all ${config.orientation === 'vertical' ? 'border-green-500 bg-green-50 shadow-sm ring-1 ring-green-500' : 'border-gray-100 hover:border-gray-200 bg-gray-50/30'}`}
          >
            <div className={`w-8 h-12 border-2 rounded-md mb-2 transition-colors ${config.orientation === 'vertical' ? 'border-green-600' : 'border-gray-300'}`} />
            <span className={`text-[11px] font-bold ${config.orientation === 'vertical' ? 'text-green-700' : 'text-gray-500'}`}>Vertical</span>
          </button>
        </div>
      </section>

      <section>
        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-3 flex items-center justify-between">
          Card Type <span className="w-4 h-4 rounded-full bg-gray-100 text-[10px] flex items-center justify-center text-gray-400 cursor-help">?</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {['30 Mil PVC', 'Adhesive PVC'].map(type => (
            <button
              key={type}
              onClick={() => setConfig({ type })}
              className={`p-4 border rounded-2xl text-center transition-all ${config.type === type ? 'border-green-500 bg-green-50 shadow-sm ring-1 ring-green-500' : 'border-gray-100 hover:border-gray-200 bg-gray-50/30'}`}
            >
              <CreditCard className={`w-6 h-6 mx-auto mb-2 transition-opacity ${config.type === type ? 'text-green-600 opacity-100' : 'text-gray-400 opacity-50'}`} />
              <span className={`text-[10px] font-extrabold block leading-tight ${config.type === type ? 'text-green-700' : 'text-gray-500'}`}>{type}</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-3 flex items-center justify-between">
          Backside Printing <span className="w-4 h-4 rounded-full bg-gray-100 text-[10px] flex items-center justify-center text-gray-400 cursor-help">?</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'none', label: 'No Back', icon: <div className="w-10 h-6 border border-gray-400 rounded-sm flex items-center justify-center text-[7px] font-black">ID</div> },
            { id: 'bw', label: 'B & W', icon: <div className="w-7 h-7 rounded-full bg-gradient-to-r from-black to-white border-2 border-white shadow-sm relative"></div> },
            { id: 'color', label: 'Full Color', icon: <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-400 via-green-400 to-blue-400 border-2 border-white shadow-sm relative"></div> }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setConfig({ backsidePrinting: opt.id as any })}
              className={`flex flex-col items-center justify-center py-3 border rounded-2xl transition-all relative ${config.backsidePrinting === opt.id ? 'border-green-500 bg-green-50 shadow-sm ring-1 ring-green-500' : 'border-gray-100 hover:border-gray-200 bg-gray-50/30'}`}
            >
              <div className="mb-2">{opt.icon}</div>
              <span className={`text-[9px] font-extrabold text-center leading-none ${config.backsidePrinting === opt.id ? 'text-green-700' : 'text-gray-400'}`}>{opt.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-3 flex items-center justify-between">
          Slot Punch <span className="w-4 h-4 rounded-full bg-gray-100 text-[10px] flex items-center justify-center text-gray-400 cursor-help">?</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'none', label: 'None', icon: <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center"><div className="w-full h-0.5 bg-gray-300 rotate-45" /></div> },
            { id: 'short', label: 'Short', icon: <div className="w-10 h-6 border border-gray-400 rounded-sm flex flex-col items-center justify-center relative"><div className="w-1.5 h-2.5 border border-gray-400 rounded-full mb-0.5" /></div> },
            { id: 'long', label: 'Long', icon: <div className="w-10 h-6 border border-gray-400 rounded-sm flex items-center justify-center relative"><div className="w-2.5 h-1.5 border border-gray-400 rounded-full mr-0.5" /></div> }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setConfig({ slotPunch: opt.id as any })}
              className={`flex flex-col items-center justify-center py-3 border rounded-2xl transition-all relative ${config.slotPunch === opt.id ? 'border-green-500 bg-green-50 shadow-sm ring-1 ring-green-500' : 'border-gray-100 hover:border-gray-200 bg-gray-50/30'}`}
            >
              <div className="mb-2">{opt.icon}</div>
              <span className={`text-[9px] font-extrabold text-center leading-none ${config.slotPunch === opt.id ? 'text-green-700' : 'text-gray-400'}`}>{opt.label}</span>
            </button>
          ))}
        </div>
      </section>


      <section>
        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-4">Background Color</label>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight ml-1">Front</span>
            <div className="flex items-center gap-3 p-2 border border-gray-100 rounded-2xl bg-white shadow-sm hover:ring-1 hover:ring-green-500 transition-all">
              <input
                type="color"
                value={config.backgroundColorFront}
                onChange={(e) => {
                  setConfig({ backgroundColorFront: e.target.value });
                  if (canvas) canvas.setBackgroundColor(e.target.value, canvas.renderAll.bind(canvas));
                }}
                className="w-10 h-10 rounded-xl border-none cursor-pointer bg-transparent shadow-inner"
              />
              <span className="text-[11px] font-mono font-bold text-gray-400">{config.backgroundColorFront.toUpperCase()}</span>
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight ml-1">Back</span>
            <div className="flex items-center gap-3 p-2 border border-gray-100 rounded-2xl bg-white shadow-sm hover:ring-1 hover:ring-green-500 transition-all">
              <input
                type="color"
                value={config.backgroundColorBack}
                onChange={(e) => {
                  setConfig({ backgroundColorBack: e.target.value });
                  const { side, canvas } = useDesignerStore.getState();
                  if (canvas && side === 'back') canvas.setBackgroundColor(e.target.value, canvas.renderAll.bind(canvas));
                }}
                className="w-10 h-10 rounded-xl border-none cursor-pointer bg-transparent shadow-inner"
              />
              <span className="text-[11px] font-mono font-bold text-gray-400">{config.backgroundColorBack.toUpperCase()}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export const getPreviewText = (rawText: string, members: any[]) => {
  if (!members || members.length === 0) return rawText;
  const { previewMemberId } = useDesignerStore.getState();
  const targetMember = previewMemberId ? members.find(m => m.id === previewMemberId) || members[0] : members[0];
  let text = rawText;
  const matches = text.match(/{{([^}]+)}}/g);
  if (matches) {
    matches.forEach((match: string) => {
      const key = match.replace(/[{}]/g, '').trim();
      if (targetMember[key as keyof typeof targetMember] !== undefined) {
        text = text.replace(match, targetMember[key as keyof typeof targetMember]);
      } else if (targetMember.customFields && targetMember.customFields[key] !== undefined) {
        text = text.replace(match, targetMember.customFields[key]);
      }
    });
  }
  return text;
};

export const applyVariableStyles = (obj: any, members: any[]) => {
  if (!obj) return;
  
  // If no variable colors set, wipe any existing styles and exit cleanly
  if (!obj.variableColors || Object.keys(obj.variableColors).length === 0) {
    obj.set('styles', {});
    obj.dirty = true;
    return;
  }
  
  let rawTemplate = obj.placeholder || '';
  if (!rawTemplate.includes('{{')) {
    obj.set('styles', {});
    obj.dirty = true;
    return;
  }

  // CRITICAL KERNING FIX: Convert logical spaces to non-breaking spaces (\u00A0).
  // Heavy fonts often collapse logical spaces to 0-width during Fabric's chunk measurement,
  // causing swallowed spaces (e.g. "WilliamAnderson"). \u00A0 forces a tangible physical width.
  if (obj.text && obj.text.includes(' ')) {
    obj.set('text', obj.text.replace(/ /g, '\u00A0'));
  }
  if (rawTemplate.includes(' ')) {
    rawTemplate = rawTemplate.replace(/ /g, '\u00A0');
    obj.placeholder = rawTemplate;
  }

  const { previewMemberId } = useDesignerStore.getState();
  const targetMember = previewMemberId ? members.find(m => m.id === previewMemberId) || members[0] : members[0];
  if (!targetMember) return;

  // Build a character-position map by walking through the template
  // and tracking where each variable's value lands in the FINAL rendered string
  const charStyles: Record<number, { fill: string }> = {};
  let charPos = 0;

  // Split template into segments: either a variable {{key}} or literal text
  const segments = rawTemplate.split(/({{[^}]+}})/g);
  
  let lastColor: string | null = null;
  for (const segment of segments) {
    if (!segment) continue;
    
    const varMatch = segment.match(/^{{([^}]+)}}$/);
    if (varMatch) {
      const varKey = varMatch[1].trim();
      const varValue = String(
        targetMember[varKey] ??
        (targetMember.customFields && targetMember.customFields[varKey]) ??
        ''
      );
      const varColor = obj.variableColors[varKey];
      if (varColor) lastColor = varColor;
      
      if (varColor && varValue.length > 0) {
        for (let i = 0; i < varValue.length; i++) {
          charStyles[charPos + i] = { fill: varColor };
        }
      }
      charPos += varValue.length;
    } else {
      // literal text segment (e.g. the space between first and last name)
      // We apply the previous variable's color to the space to merge them into a single Canvas chunk.
      // This physically prevents HTML5 Canvas from mis-measuring isolated space characters!
      if (lastColor) {
        for (let i = 0; i < segment.length; i++) {
          charStyles[charPos + i] = { fill: lastColor };
        }
      }
      charPos += segment.length;
    }
  }

  // Build newStyles in the format Fabric expects: { lineIndex: { charIndex: styleObj } }
  const newStyles: any = { 0: charStyles };
  
  // Apply using Fabric's proper setter - this invalidates internal caches correctly
  obj.set('styles', newStyles);
  
  // Explicitly force layout recalculation
  if (obj.initDimensions) {
    obj.initDimensions();
  }
  
  obj.dirty = true;
  
  // CRITICAL FIX FOR "Alfa Slab One" AND HEAVY FONTS:
  // Sometimes the browser's Canvas 2D engine hasn't physically swapped the custom font in yet,
  // causing Fabric to permanently cache thin "fallback font" widths, which causes thick letters to overlap!
  // We force a complete cache wipe and re-measure 150ms later when the browser is guaranteed to be ready.
  setTimeout(() => {
    if (obj._charWidthsCache) {
      obj._charWidthsCache = {};
    }
    if (obj._clearCache) {
      obj._clearCache();
    }
    if (obj.initDimensions) {
      obj.initDimensions();
    }
    obj.dirty = true;
    if (obj.canvas) {
      obj.canvas.renderAll();
    }
  }, 150);
};


export const TextPanel = ({ setPanel }: { setPanel: (p: string | null) => void }) => {
  const { canvas, formConfig, organizationType } = useDesignerStore();

  const addText = (text: string, isVariable = false) => {
    if (!canvas) return;
    
    let displayValue = text;
    let placeholderValue = text;

    if (isVariable) {
      const { members } = useDesignerStore.getState();
      displayValue = getPreviewText(text, members);
    }

    const textObj = new fabric.IText(displayValue, {
      left: 50,
      top: 50,
      fontSize: 16,
      fontFamily: 'Inter',
      fill: '#000000',
    });
    // @ts-ignore
    textObj.isVariable = isVariable;
    if (isVariable) {
      // @ts-ignore
      textObj.placeholder = placeholderValue;
    }
    
    canvas.add(textObj);
    canvas.setActiveObject(textObj);
    setPanel('customize');
  };

  const getDynamicLabel = (field: string) => {
    if (organizationType === 'education') {
      if (field === 'Employee ID') return 'Student/Staff ID';
      if (field === 'Department') return 'Grade/Class';
      if (field === 'Title') return 'Role (Student/Faculty)';
      if (field === 'Hire Date') return 'Enrollment Date';
      if (field === 'Employment Details') return 'School Details';
    } else if (organizationType === 'healthcare') {
      if (field === 'Employee ID') return 'Staff ID';
      if (field === 'Title') return 'Medical Role';
      if (field === 'Department') return 'Ward/Unit';
      if (field === 'Hire Date') return 'Join Date';
      if (field === 'Employment Details') return 'Facility Details';
    }
    return field;
  };

  const fieldToKeyMap: Record<string, string> = {
    'First Name': 'firstName',
    'Last Name': 'lastName',
    'Nickname': 'nickname',
    'DOB': 'dob',
    'Title': 'title',
    'Employee ID': 'employeeId',
    'Department': 'department',
    'Hire Date': 'hireDate',
    'ID Number': 'idNumber',
    'Grade Level': 'gradeLevel',
    'Security Level': 'securityLevel',
    'Issue Date': 'issueDate',
    'Expiration Date': 'expirationDate',
    'Phone 1': 'phone1',
    'Phone 2': 'phone2',
    'Fax': 'fax',
    'Email': 'email',
    'Website': 'website',
    'Street 1': 'street1',
    'Street 2': 'street2',
    'City': 'city',
    'State': 'state',
    'Postal Code': 'postalCode',
    'Country': 'country',
    'Gender': 'gender',
    'Eye Color': 'eyeColor',
    'Hair Color': 'hairColor',
    'Height': 'height',
    'Weight': 'weight',
  };

  const activeStandardFields = formConfig?.enabledFields || Object.keys(fieldToKeyMap);
  const activeCustomFields = formConfig?.customFields?.filter(cf => formConfig.enabledFields.includes(cf)) || [];

  return (
    <div className="space-y-6">
      <section>
        <label className="text-xs font-bold text-gray-400 block mb-3 uppercase tracking-wider">Static Text</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => addText('Add headline')}
            className="flex items-center justify-center gap-3 p-4 bg-green-500 text-white rounded-2xl hover:bg-green-600 transition-all shadow-md active:scale-95 group"
          >
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Type size={18} />
            </div>
            <span className="text-xs font-black">Single Line</span>
          </button>
          <button
            onClick={() => addText('Add paragraph')}
            className="flex items-center justify-center gap-3 p-4 border border-gray-100 bg-white rounded-2xl hover:border-green-200 transition-all shadow-sm active:scale-95"
          >
            <div className="flex flex-col gap-0.5 w-6">
              <div className="h-1 bg-gray-300 w-full rounded-full" />
              <div className="h-1 bg-gray-300 w-2/3 rounded-full" />
              <div className="h-1 bg-gray-300 w-5/6 rounded-full" />
            </div>
            <span className="text-xs font-black text-gray-700">Multi Line</span>
          </button>
        </div>
      </section>

      {/* Dynamic Fields from Checklist */}
      <div className="space-y-8 pb-10">
        
        {activeStandardFields.filter(f => fieldToKeyMap[f]).length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                <Type size={14} />
              </div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Standard Variables</label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => addText('{{firstName}} {{lastName}}', true)}
                className="flex flex-col items-center justify-center p-5 border border-purple-100 bg-purple-50/30 rounded-3xl hover:border-purple-400 hover:shadow-xl hover:scale-[1.02] transition-all group shadow-sm active:scale-95 col-span-2"
              >
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center mb-2 group-hover:bg-purple-100 transition-colors shadow-sm">
                  <Type size={18} className="text-purple-400 group-hover:text-purple-600" />
                </div>
                <span className="text-[11px] font-black text-purple-700 text-center leading-tight">
                  Full Name (First + Last)
                </span>
                <span className="text-[9px] text-purple-400 font-bold mt-1 uppercase tracking-tighter">Prevents Overlapping</span>
              </button>

              {activeStandardFields.filter(f => fieldToKeyMap[f]).map(field => (
                <button
                  key={field}
                  onClick={() => addText(`{{${fieldToKeyMap[field]}}}`, true)}
                  className="flex flex-col items-center justify-center p-5 border border-gray-100 bg-white rounded-3xl hover:border-green-400 hover:shadow-xl hover:scale-[1.02] transition-all group shadow-sm active:scale-95"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-2 group-hover:bg-green-50 transition-colors">
                    <Type size={18} className="text-gray-400 group-hover:text-green-600" />
                  </div>
                  <span className="text-[11px] font-black text-gray-700 text-center leading-tight">
                    {getDynamicLabel(field)}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {activeCustomFields.filter(f => !formConfig?.customImageFields?.includes(f)).length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                <Plus size={14} />
              </div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Custom Variables</label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {activeCustomFields.filter(f => !formConfig?.customImageFields?.includes(f)).map(field => (
                <button
                  key={field}
                  onClick={() => addText(`{{${field}}}`, true)}
                  className="flex flex-col items-center justify-center p-5 border border-gray-100 bg-white rounded-3xl hover:border-green-400 hover:shadow-xl hover:scale-[1.02] transition-all group shadow-sm active:scale-95"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-2 group-hover:bg-green-50 transition-colors">
                    <Type size={18} className="text-gray-400 group-hover:text-green-600" />
                  </div>
                  <span className="text-[11px] font-black text-gray-700 text-center leading-tight">
                    {field}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export const CustomizePanel = () => {
  const {
    selectedObject,
    canvas,
    saveState,
    setIsImageLibraryOpen,
    setLibraryMode
  } = useDesignerStore();
  const [props, setProps] = React.useState<any>({});
  const [isProcessingBG, setIsProcessingBG] = React.useState(false);

  React.useEffect(() => {
    if (selectedObject) {
      const update = () => {
          setProps({
            text: (selectedObject as any).placeholder || (selectedObject as any).text || '',
            fontSize: (selectedObject as any).fontSize || 20,
            fontFamily: (selectedObject as any).fontFamily || 'Inter',
            fill: selectedObject.fill || '#000000',
            opacity: selectedObject.opacity || 1,
            angle: selectedObject.angle || 0,
            width: Math.round((selectedObject.width || 0) * (selectedObject.scaleX || 1)),
            height: Math.round((selectedObject.height || 0) * (selectedObject.scaleY || 1)),
            left: Math.round(selectedObject.left || 0),
            top: Math.round(selectedObject.top || 0),
            strokeWidth: selectedObject.strokeWidth || 0,
            stroke: selectedObject.stroke || '#000000',
            rx: (selectedObject as any).rx || 0,
            ry: (selectedObject as any).ry || 0,
            securityData: (selectedObject as any).securityData || ((selectedObject as any).placeholder === '{{qr_code}}' ? 'https://idcreator.com' : '1234567890'),
            securityFormat: (selectedObject as any).securityFormat || 'code128',
            securityType: (selectedObject as any).securityType || 'URL',
            textAlign: (selectedObject as any).textAlign || 'left',
            fontWeight: (selectedObject as any).fontWeight || 'normal',
            fontStyle: (selectedObject as any).fontStyle || 'normal',
            underline: (selectedObject as any).underline || false,
            qrFields: (selectedObject as any).qrFields || {},
            variableColors: (selectedObject as any).variableColors || {},
          });
        };
        update();
        selectedObject.on('modified', update);
        selectedObject.on('moving', update);
        selectedObject.on('scaling', update);
        selectedObject.on('changed', update);
        return () => { 
          selectedObject.off('modified', update); 
          selectedObject.off('moving', update);
          selectedObject.off('scaling', update);
          selectedObject.off('changed', update);
        };
      }
    }, [selectedObject]);

  if (!selectedObject) return <div className="text-center text-gray-400 mt-10">Select an element to customize</div>;

  const updateSelected = (key: string, val: any) => {
    if (!selectedObject || !canvas) return;
    
    if (key === 'text') {
      const { members } = useDesignerStore.getState();
      if (typeof val === 'string' && val.includes('{{')) {
        (selectedObject as any).placeholder = val;
        (selectedObject as any).isVariable = true;
        (selectedObject as any).set('text', getPreviewText(val, members));
      } else {
        (selectedObject as any).placeholder = undefined;
        (selectedObject as any).isVariable = false;
        (selectedObject as any).set('text', val);
      }
    } else if (key === 'textAlign') {
      (selectedObject as any).set('textAlign', val);
      if (val === 'center') {
        const center = selectedObject.getCenterPoint();
        selectedObject.set({
          originX: 'center',
          left: center.x
        });
      } else if (val === 'right') {
        const boundingRect = selectedObject.getBoundingRect();
        selectedObject.set({
          originX: 'right',
          left: boundingRect.left + boundingRect.width
        });
      } else {
        const boundingRect = selectedObject.getBoundingRect();
        selectedObject.set({
          originX: 'left',
          left: boundingRect.left
        });
      }
    } else if (key === 'variableColors') {
      (selectedObject as any).variableColors = val;
      const { members } = useDesignerStore.getState();
      applyVariableStyles(selectedObject, members);
    } else {
      selectedObject.set(key as any, val);
      if (key === 'text') {
        const { members } = useDesignerStore.getState();
        applyVariableStyles(selectedObject, members);
      }
    }
    
    selectedObject.setCoords();
    canvas.renderAll();
    setProps({ 
      ...props, 
      [key]: val,
      left: Math.round(selectedObject.left || 0),
      top: Math.round(selectedObject.top || 0)
    });
    saveState();
  };

  const isSecurity = (selectedObject as any).placeholder === '{{barcode}}' ||
    (selectedObject as any).placeholder === '{{qr_code}}' ||
    (selectedObject as any).placeholder === '{{pdf417}}' ||
    (selectedObject as any).placeholder === '{{datamatrix}}';

    const isShape = ['rect', 'circle', 'triangle', 'line', 'polygon', 'path', 'ellipse'].includes(selectedObject.type || '');
    const isImage = (selectedObject.type === 'image' || (selectedObject as any).variableType === 'image') && !isSecurity;
    const isBarcode = (selectedObject as any).placeholder === '{{barcode}}';
    const isQRCode = (selectedObject as any).placeholder === '{{qr_code}}';
    const isPDF417 = (selectedObject as any).placeholder === '{{pdf417}}';
    const isDataMatrix = (selectedObject as any).placeholder === '{{datamatrix}}';

    const formatQRData = (type: string, fields: any, data: string) => {
      if (!data && type === 'URL') return 'https://idcreator.com';
      switch (type) {
        case 'URL':
          if (!data) return 'https://idcreator.com';
          return data.startsWith('http') ? data : `https://${data}`;
        case 'Email':
          return `mailto:${fields.email || ''}?subject=${encodeURIComponent(fields.subject || '')}&body=${encodeURIComponent(fields.body || '')}`;
        case 'Phone':
          return `tel:${fields.country || ''}${fields.area || ''}${fields.number || ''}`;
        case 'VCard':
          return `BEGIN:VCARD\nVERSION:3.0\nN:${fields.lastName || ''};${fields.firstName || ''}\nFN:${fields.firstName || ''} ${fields.lastName || ''}\nORG:${fields.org || ''}\nTITLE:${fields.position || ''}\nADR:;;${fields.address || ''}\nTEL;TYPE=WORK,VOICE:${fields.phone || ''}\nEMAIL;TYPE=PREF,INTERNET:${fields.email || ''}\nURL:${fields.website || ''}\nNOTE:${fields.notes || ''}\nEND:VCARD`;
        default: return data || 'Empty';
      }
    };

    const handleSecurityPropChange = (key: string, value: any) => {
      const newProps = { ...props, [key]: value };
      setProps(newProps);

      // Auto-apply security changes for format, data, and qrFields
      if (key === 'securityFormat' || key === 'securityData' || key === 'securityType' || key === 'qrFields') {
        setTimeout(() => applySecurityChanges(newProps), 0);
      }
    };

    const applySecurityChanges = async (currentProps = props) => {
      if (!selectedObject || !canvas) return;

      try {
        let dataUrl = '';
        const format = currentProps.securityFormat || 'code128';
        const ph = (selectedObject as any).placeholder;

        if (ph === '{{qr_code}}' || format === 'qrcode') {
          const qrData = formatQRData(currentProps.securityType, currentProps.qrFields, currentProps.securityData);
          dataUrl = await QRCode.toDataURL(qrData || 'http://idcreator.com');
        } else {
          let data = currentProps.securityData || '1234567890';

          // Format-specific data handling
          if (format === 'upca') {
            data = data.replace(/\D/g, '').slice(0, 11).padStart(11, '0');
          } else if (format === 'ean13') {
            data = data.replace(/\D/g, '').slice(0, 12).padStart(12, '0');
          } else if (format === 'ean8') {
            data = data.replace(/\D/g, '').slice(0, 7).padStart(7, '0');
          }

          const opts: any = {
            bcid: format,
            text: data,
            scale: 3,
            backgroundcolor: 'ffffff',
          };

          if (format === 'pdf417') {
            opts.columns = 4;
          }

          if (format !== 'pdf417' && format !== 'datamatrix') {
            opts.height = 10;
            opts.includetext = true;
            opts.textxalign = 'center';
          }

          const canvas_ = document.createElement('canvas');
          try {
            // @ts-ignore
            bwipjs.toCanvas(canvas_, opts);
            dataUrl = canvas_.toDataURL();
          } catch (e) {
            console.error('BWIP Sync Error:', e);
            // Fallback visual for errors
            const ctx = canvas_.getContext('2d');
            if (ctx) {
              canvas_.width = 200;
              canvas_.height = 100;
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, 200, 100);
              ctx.strokeStyle = '#ef4444';
              ctx.lineWidth = 2;
              ctx.strokeRect(5, 5, 190, 90);
              ctx.fillStyle = '#ef4444';
              ctx.font = 'bold 12px Inter';
              ctx.textAlign = 'center';
              ctx.fillText('INVALID DATA FOR ' + format.toUpperCase(), 100, 55);
            }
            dataUrl = canvas_.toDataURL();
          }
        }

        if (dataUrl) {
          // If it's already an image, just update the source to prevent re-selection and state reset
          if (selectedObject.type === 'image') {
            const img = selectedObject as fabric.Image;
            img.setSrc(dataUrl, () => {
              // @ts-ignore
              img.securityData = currentProps.securityData;
              // @ts-ignore
              img.securityFormat = currentProps.securityFormat;
              // @ts-ignore
              img.securityType = currentProps.securityType;
              // @ts-ignore
              img.qrFields = currentProps.qrFields;

              canvas.renderAll();
              saveState();
            });
          } else {
            // If it's the initial placeholder group, replace it with a real image object
            fabric.Image.fromURL(dataUrl, (newImg) => {
              const left = selectedObject.left;
              const top = selectedObject.top;
              const width = selectedObject.width! * selectedObject.scaleX!;
              const height = selectedObject.height! * selectedObject.scaleY!;

              newImg.set({
                left,
                top,
                scaleX: width / newImg.width!,
                scaleY: height / newImg.height!,
              });

              // @ts-ignore
              newImg.placeholder = (selectedObject as any).placeholder;
              // @ts-ignore
              newImg.securityData = currentProps.securityData;
              // @ts-ignore
              newImg.securityFormat = currentProps.securityFormat;
              // @ts-ignore
              newImg.securityType = currentProps.securityType;
              // @ts-ignore
              newImg.qrFields = currentProps.qrFields;
              // @ts-ignore
              newImg.variableType = 'image';

              canvas.remove(selectedObject);
              canvas.add(newImg);
              canvas.setActiveObject(newImg);
              canvas.renderAll();
              saveState();
            });
          }
        }
      } catch (err) {
        console.error('Error generating security element:', err);
      }
    };


    const handleRemoveBackground = async () => {
      if (!selectedObject || selectedObject.type !== 'image') return;

      setIsProcessingBG(true);
      try {
        const imgObj = selectedObject as fabric.Image;
        const element = imgObj.getElement() as HTMLImageElement;

        // Convert current image to blob
        const response = await fetch(element.src);
        const blob = await response.blob();

        // Remove background using AI
        const resultBlob = await removeBackground(blob, {
          progress: (status, progress) => {
            console.log(`BG Removal: ${status} (${Math.round(progress * 100)}%)`);
          }
        });

        // Convert result back to data URL
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          imgObj.setSrc(dataUrl, () => {
            canvas?.renderAll();
            saveState();
            setIsProcessingBG(false);
          });
        };
        reader.readAsDataURL(resultBlob);
      } catch (err) {
        console.error('Perfect BG Removal Error:', err);
        setIsProcessingBG(false);
        alert('Background removal failed. Please try a different image.');
      }
    };

    const NumberInput = ({ label, value, onChange, min = 0, max = 1000 }: any) => (
      <div className="flex items-center justify-between">
        {label && <label className="text-[11px] font-bold text-gray-700">{label}</label>}
        <div className="relative w-28 h-10 border border-gray-100 rounded-xl flex items-center bg-gray-50/30 overflow-hidden group hover:border-green-200 transition-all">
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value) || 0)}
            className="w-full h-full bg-transparent px-3 text-xs font-bold outline-none"
          />
          <div className="flex flex-col border-l border-gray-100 bg-white">
            <button onClick={() => onChange(Math.min(max, (value || 0) + 1))} className="flex-1 px-2 hover:bg-green-50 text-green-500"><Plus size={10} /></button>
            <button onClick={() => onChange(Math.max(min, (value || 0) - 1))} className="flex-1 px-2 hover:bg-green-50 text-green-500 border-t border-gray-100"><Minus size={10} /></button>
          </div>
        </div>
      </div>
    );

    if (isShape) {
      return (
        <div className="space-y-6">
          <h2 className="text-sm font-bold text-gray-800">Customize Shape</h2>

          <section className="space-y-4">
            <NumberInput
              label="Border Size"
              value={props.strokeWidth || 0}
              onChange={(v: number) => updateSelected('strokeWidth', v)}
            />

            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-gray-700">Border Color</label>
              <div className="w-32 h-10 border border-gray-100 rounded-xl flex items-center px-2 bg-gray-50/30">
                <input
                  type="color"
                  value={props.stroke || '#000000'}
                  onChange={(e) => updateSelected('stroke', e.target.value)}
                  className="w-6 h-6 rounded-md border-none bg-transparent cursor-pointer"
                />
                <span className="ml-2 text-[10px] font-mono text-gray-400 uppercase">{props.stroke || '#000000'}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-gray-700">Fill Color</label>
              <div className="w-32 h-10 border border-gray-100 rounded-xl flex items-center px-2 bg-gray-50/30">
                <input
                  type="color"
                  value={props.fill || '#000000'}
                  onChange={(e) => updateSelected('fill', e.target.value)}
                  className="w-6 h-6 rounded-md border-none bg-transparent cursor-pointer"
                />
                <span className="ml-2 text-[10px] font-mono text-gray-400 uppercase">{props.fill || '#000000'}</span>
              </div>
            </div>

            {selectedObject.type === 'rect' && (
              <NumberInput
                label="Corner Radius"
                value={props.rx || 0}
                onChange={(v: number) => { 
                  if (!selectedObject || !canvas) return;
                  (selectedObject as any).set({ rx: v, ry: v });
                  selectedObject.setCoords();
                  canvas.renderAll();
                  setProps((prev: Record<string, any>) => ({ ...prev, rx: v, ry: v }));
                  saveState();
                }}
                max={999}
              />
            )}
          </section>

          <section className="space-y-2">
            <NumberInput
              label="Transparency"
              value={Math.round((1 - (props.opacity || 0)) * 100)}
              onChange={(v: number) => updateSelected('opacity', 1 - (v / 100))}
              max={100}
            />
            <input
              type="range" min="0" max="100"
              value={Math.round((1 - (props.opacity || 0)) * 100)}
              onChange={(e) => updateSelected('opacity', 1 - (parseInt(e.target.value) / 100))}
              className="w-full h-1 bg-green-500 rounded-lg appearance-none cursor-pointer"
            />
          </section>

          <section className="space-y-2">
            <NumberInput
              label="Rotation"
              value={props.angle || 0}
              onChange={(v: number) => updateSelected('angle', v)}
              max={360}
            />
            <input
              type="range" min="0" max="360"
              value={props.angle || 0}
              onChange={(e) => updateSelected('angle', parseInt(e.target.value))}
              className="w-full h-1 bg-green-500 rounded-lg appearance-none cursor-pointer"
            />
          </section>

          <section className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-bold text-gray-400">W</span>
              <NumberInput value={Math.round(props.width || 0)} onChange={(v: number) => updateSelected('width', v)} />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-bold text-gray-400">H</span>
              <NumberInput value={Math.round(props.height || 0)} onChange={(v: number) => updateSelected('height', v)} />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-bold text-gray-400">X</span>
              <NumberInput value={Math.round(props.left || 0)} onChange={(v: number) => updateSelected('left', v)} />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-bold text-gray-400">Y</span>
              <NumberInput value={Math.round(props.top || 0)} onChange={(v: number) => updateSelected('top', v)} />
            </div>
          </section>
        </div>
      );
    }

    if (isImage) {
      return (
        <div className="space-y-6">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setLibraryMode('replace');
                setIsImageLibraryOpen(true);
              }}
              className="flex-1 flex items-center justify-center gap-2 h-12 border-2 border-green-500 text-green-600 rounded-xl font-bold hover:bg-green-50 transition-all active:scale-95"
            >
              <ImageIcon size={18} />
              Browse New
            </button>
            <button
              onClick={handleRemoveBackground}
              disabled={isProcessingBG}
              className={`flex-1 flex items-center justify-center gap-2 h-12 rounded-xl font-bold transition-all active:scale-95 shadow-lg ${isProcessingBG
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-green-500 text-white hover:bg-green-600 shadow-green-200'
                }`}
            >
              {isProcessingBG ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                  Processing...
                </div>
              ) : (
                <>
                  <Sparkles size={18} />
                  Remove BG
                </>
              )}
            </button>
          </div>

          <section className="space-y-4">
            <div className="space-y-2">
              <NumberInput
                label="Transparency"
                value={Math.round((1 - (props.opacity || 0)) * 100)}
                onChange={(v: number) => updateSelected('opacity', 1 - (v / 100))}
                max={100}
              />
              <input
                type="range" min="0" max="100"
                value={Math.round((1 - (props.opacity || 0)) * 100)}
                onChange={(e) => updateSelected('opacity', 1 - (parseInt(e.target.value) / 100))}
                className="w-full h-1 bg-green-500 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <NumberInput
                label="Rotation"
                value={props.angle || 0}
                onChange={(v: number) => updateSelected('angle', v)}
                max={360}
              />
              <input
                type="range" min="0" max="360"
                value={props.angle || 0}
                onChange={(e) => updateSelected('angle', parseInt(e.target.value))}
                className="w-full h-1 bg-green-500 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </section>

          <section className="space-y-4 pt-4 border-t border-gray-50">
            <NumberInput
              label="Border Size"
              value={props.strokeWidth || 0}
              onChange={(v: number) => updateSelected('strokeWidth', v)}
            />
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-gray-700">Border Color</label>
              <div className="w-32 h-10 border border-gray-100 rounded-xl flex items-center px-2 bg-gray-50/30">
                <input
                  type="color"
                  value={props.stroke || '#000000'}
                  onChange={(e) => updateSelected('stroke', e.target.value)}
                  className="w-6 h-6 rounded-md border-none bg-transparent cursor-pointer"
                />
                <div className="flex-1" />
              </div>
            </div>
          </section>

          <section className="pt-4 border-t border-gray-50">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-bold text-gray-400">W</span>
                <NumberInput value={Math.round(props.width || 0)} onChange={(v: number) => updateSelected('width', v)} />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-bold text-gray-400">H</span>
                <NumberInput value={Math.round(props.height || 0)} onChange={(v: number) => updateSelected('height', v)} />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-bold text-gray-400">X</span>
                <NumberInput value={Math.round(props.left || 0)} onChange={(v: number) => updateSelected('left', v)} />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-bold text-gray-400">Y</span>
                <NumberInput value={Math.round(props.top || 0)} onChange={(v: number) => updateSelected('top', v)} />
              </div>
            </div>
          </section>
        </div>
      );
    }

    if (isSecurity) {
      return (
        <div className="space-y-6">
          <h2 className="text-sm font-bold text-gray-800">Customize Security</h2>

          {isBarcode ? (
            <section className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-2">Barcode Format</label>
                <select
                  value={props.securityFormat}
                  onChange={(e) => handleSecurityPropChange('securityFormat', e.target.value)}
                  className="w-full p-3 border border-gray-100 rounded-xl text-xs outline-none focus:ring-1 focus:ring-green-500 bg-white"
                >
                  <option value="code128">Code 128</option>
                  <option value="code39">Code 39</option>
                  <option value="ean13">EAN-13</option>
                  <option value="upca">UPC-A</option>
                  <option value="pdf417">PDF417</option>
                  <option value="datamatrix">Data Matrix</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-2">Input Data</label>
                <textarea
                  value={props.securityData}
                  onChange={(e) => handleSecurityPropChange('securityData', e.target.value)}
                  className="w-full p-3 border border-gray-100 rounded-xl text-xs outline-none focus:ring-1 focus:ring-green-500 bg-white h-24 resize-none"
                />
              </div>
            </section>
          ) : (
            <section className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-2">QR Code Type</label>
                <select
                  value={props.securityType}
                  onChange={(e) => handleSecurityPropChange('securityType', e.target.value)}
                  className="w-full p-3 border border-gray-100 rounded-xl text-xs outline-none focus:ring-1 focus:ring-green-500 bg-white"
                >
                  <option value="URL">URL</option>
                  <option value="Text">Text</option>
                  <option value="Email">Email</option>
                  <option value="Phone">Phone</option>
                  <option value="VCard">VCard</option>
                </select>
              </div>

              {props.securityType === 'URL' && (
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-2">Website URL</label>
                  <input
                    type="text"
                    value={props.securityData}
                    onChange={(e) => handleSecurityPropChange('securityData', e.target.value)}
                    placeholder="https://example.com"
                    className="w-full p-3 border border-gray-100 rounded-xl text-xs outline-none focus:ring-1 focus:ring-green-500 bg-white"
                  />
                </div>
              )}

              {props.securityType === 'Text' && (
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-2">Text Content</label>
                  <textarea
                    value={props.securityData}
                    onChange={(e) => handleSecurityPropChange('securityData', e.target.value)}
                    placeholder="Enter text..."
                    className="w-full p-3 border border-gray-100 rounded-xl text-xs outline-none focus:ring-1 focus:ring-green-500 bg-white h-24 resize-none"
                  />
                </div>
              )}

              {props.securityType === 'Email' && (
                <div className="space-y-3">
                  <input
                    type="email"
                    value={props.qrFields.email || ''}
                    onChange={(e) => handleSecurityPropChange('qrFields', { ...props.qrFields, email: e.target.value })}
                    placeholder="Email address"
                    className="w-full p-3 border border-gray-100 rounded-xl text-xs outline-none focus:ring-1 focus:ring-green-500 bg-white"
                  />
                  <input
                    type="text"
                    value={props.qrFields.subject || ''}
                    onChange={(e) => handleSecurityPropChange('qrFields', { ...props.qrFields, subject: e.target.value })}
                    placeholder="Subject (optional)"
                    className="w-full p-3 border border-gray-100 rounded-xl text-xs outline-none focus:ring-1 focus:ring-green-500 bg-white"
                  />
                  <textarea
                    value={props.qrFields.body || ''}
                    onChange={(e) => handleSecurityPropChange('qrFields', { ...props.qrFields, body: e.target.value })}
                    placeholder="Text (optional)"
                    className="w-full p-3 border border-gray-100 rounded-xl text-xs outline-none focus:ring-1 focus:ring-green-500 bg-white h-20 resize-none"
                  />
                </div>
              )}

              {props.securityType === 'Phone' && (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={props.qrFields.country || ''}
                    onChange={(e) => handleSecurityPropChange('qrFields', { ...props.qrFields, country: e.target.value })}
                    placeholder="Country code"
                    className="w-full p-3 border border-gray-100 rounded-xl text-xs outline-none focus:ring-1 focus:ring-green-500 bg-white"
                  />
                  <input
                    type="text"
                    value={props.qrFields.area || ''}
                    onChange={(e) => handleSecurityPropChange('qrFields', { ...props.qrFields, area: e.target.value })}
                    placeholder="Area Code"
                    className="w-full p-3 border border-gray-100 rounded-xl text-xs outline-none focus:ring-1 focus:ring-green-500 bg-white"
                  />
                  <input
                    type="text"
                    value={props.qrFields.number || ''}
                    onChange={(e) => handleSecurityPropChange('qrFields', { ...props.qrFields, number: e.target.value })}
                    placeholder="Phone Number"
                    className="w-full p-3 border border-gray-100 rounded-xl text-xs outline-none focus:ring-1 focus:ring-green-500 bg-white"
                  />
                </div>
              )}

              {props.securityType === 'VCard' && (
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={props.qrFields.firstName || ''}
                    onChange={(e) => handleSecurityPropChange('qrFields', { ...props.qrFields, firstName: e.target.value })}
                    placeholder="First Name"
                    className="w-full p-3 border border-gray-100 rounded-xl text-xs outline-none focus:ring-1 focus:ring-green-500 bg-white"
                  />
                  <input
                    type="text"
                    value={props.qrFields.lastName || ''}
                    onChange={(e) => handleSecurityPropChange('qrFields', { ...props.qrFields, lastName: e.target.value })}
                    placeholder="Last Name"
                    className="w-full p-3 border border-gray-100 rounded-xl text-xs outline-none focus:ring-1 focus:ring-green-500 bg-white"
                  />
                  <input
                    type="text"
                    value={props.qrFields.phone || ''}
                    onChange={(e) => handleSecurityPropChange('qrFields', { ...props.qrFields, phone: e.target.value })}
                    placeholder="Phone"
                    className="w-full p-3 border border-gray-100 rounded-xl text-xs outline-none focus:ring-1 focus:ring-green-500 bg-white"
                  />
                  <input
                    type="email"
                    value={props.qrFields.email || ''}
                    onChange={(e) => handleSecurityPropChange('qrFields', { ...props.qrFields, email: e.target.value })}
                    placeholder="E-mail"
                    className="w-full p-3 border border-gray-100 rounded-xl text-xs outline-none focus:ring-1 focus:ring-green-500 bg-white"
                  />
                  <input
                    type="text"
                    value={props.qrFields.org || ''}
                    onChange={(e) => handleSecurityPropChange('qrFields', { ...props.qrFields, org: e.target.value })}
                    placeholder="Organization"
                    className="w-full p-3 border border-gray-100 rounded-xl text-xs outline-none focus:ring-1 focus:ring-green-500 bg-white"
                  />
                  <input
                    type="text"
                    value={props.qrFields.position || ''}
                    onChange={(e) => handleSecurityPropChange('qrFields', { ...props.qrFields, position: e.target.value })}
                    placeholder="Position"
                    className="w-full p-3 border border-gray-100 rounded-xl text-xs outline-none focus:ring-1 focus:ring-green-500 bg-white"
                  />
                  <input
                    type="text"
                    value={props.qrFields.address || ''}
                    onChange={(e) => handleSecurityPropChange('qrFields', { ...props.qrFields, address: e.target.value })}
                    placeholder="Address"
                    className="w-full p-3 border border-gray-100 rounded-xl text-xs outline-none focus:ring-1 focus:ring-green-500 bg-white"
                  />
                  <input
                    type="text"
                    value={props.qrFields.website || ''}
                    onChange={(e) => handleSecurityPropChange('qrFields', { ...props.qrFields, website: e.target.value })}
                    placeholder="Web-site"
                    className="w-full p-3 border border-gray-100 rounded-xl text-xs outline-none focus:ring-1 focus:ring-green-500 bg-white"
                  />
                  <textarea
                    value={props.qrFields.notes || ''}
                    onChange={(e) => handleSecurityPropChange('qrFields', { ...props.qrFields, notes: e.target.value })}
                    placeholder="Notes"
                    className="w-full p-3 border border-gray-100 rounded-xl text-xs outline-none focus:ring-1 focus:ring-green-500 bg-white h-20 resize-none col-span-2"
                  />
                </div>
              )}
            </section>
          )}

          <section>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-[11px] font-bold text-gray-700">Insert Smart Field</label>
              <Info size={12} className="text-gray-300" />
            </div>
            <select className="w-full p-3 border border-gray-100 rounded-xl text-xs outline-none focus:ring-1 focus:ring-green-500 bg-white appearance-none">
              <option>Select a Smart field...</option>
              <option>Full Name</option>
              <option>Employee ID</option>
            </select>
          </section>

          <button
            onClick={() => applySecurityChanges(props)}
            className="w-full py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-all shadow-lg shadow-green-100"
          >
            Apply
          </button>

          <section className="space-y-4 pt-4 border-t border-gray-50">
            <NumberInput
              label="Rotation"
              value={props.angle || 0}
              onChange={(v: number) => updateSelected('angle', v)}
              max={360}
            />
            <input
              type="range" min="0" max="360"
              value={props.angle || 0}
              onChange={(e) => updateSelected('angle', parseInt(e.target.value))}
              className="w-full h-1 bg-green-500 rounded-lg appearance-none cursor-pointer"
            />

            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-bold text-gray-400">W</span>
                <NumberInput value={Math.round(props.width || 0)} onChange={(v: number) => updateSelected('width', v)} />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-bold text-gray-400">H</span>
                <NumberInput value={Math.round(props.height || 0)} onChange={(v: number) => updateSelected('height', v)} />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-bold text-gray-400">X</span>
                <NumberInput value={Math.round(props.left || 0)} onChange={(v: number) => updateSelected('left', v)} />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-bold text-gray-400">Y</span>
                <NumberInput value={Math.round(props.top || 0)} onChange={(v: number) => updateSelected('top', v)} />
              </div>
            </div>
          </section>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {(selectedObject.type === 'i-text' || selectedObject.type === 'text') && (
          <section>
            <label className="text-xs font-bold text-gray-700 block mb-2">Add Text</label>
            <textarea
              value={props.text}
              onChange={(e) => updateSelected('text', e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-1 focus:ring-green-500 outline-none h-24 resize-none font-mono"
            />
            <div className="mt-3">
              <label className="text-xs font-bold text-gray-700 block mb-2">Insert Smart Field</label>
              <select
                onChange={(e) => {
                  if (e.target.value === 'Select a Smart field...') return;
                  updateSelected('text', props.text + ' ' + e.target.value);
                  e.target.value = 'Select a Smart field...';
                }}
                className="w-full p-2 border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value="Select a Smart field...">Select a Smart field...</option>
                {(() => {
                  const { formConfig, members } = useDesignerStore.getState();
                  const enabled = formConfig?.enabledFields;
                  
                  const showField = (label: string) => {
                    return !enabled || enabled.includes(label);
                  };

                  return (
                    <>
                      {['First Name', 'Last Name', 'Nickname', 'Date of Birth', 'Gender'].some(showField) && (
                        <optgroup label="Personal Info">
                          {showField('First Name') && <option value="{{firstName}}">First Name</option>}
                          {showField('Last Name') && <option value="{{lastName}}">Last Name</option>}
                          {showField('Nickname') && <option value="{{nickname}}">Nickname</option>}
                          {showField('Date of Birth') && <option value="{{dob}}">Date of Birth</option>}
                          {showField('Gender') && <option value="{{gender}}">Gender</option>}
                        </optgroup>
                      )}
                      {['Title', 'ID number', 'Employee ID', 'Department', 'Hire Date'].some(showField) && (
                        <optgroup label="Employment Info">
                          {showField('Title') && <option value="{{title}}">Job Title</option>}
                          {showField('ID number') && <option value="{{idNumber}}">ID Number</option>}
                          {showField('Employee ID') && <option value="{{employeeId}}">Employee ID</option>}
                          {showField('Department') && <option value="{{department}}">Department</option>}
                          {showField('Hire Date') && <option value="{{hireDate}}">Hire Date</option>}
                        </optgroup>
                      )}
                      {['Email', 'Phone 1', 'Phone 2', 'Fax', 'Website'].some(showField) && (
                        <optgroup label="Contact Info">
                          {showField('Email') && <option value="{{email}}">Email</option>}
                          {showField('Phone 1') && <option value="{{phone1}}">Phone 1</option>}
                          {showField('Phone 2') && <option value="{{phone2}}">Phone 2</option>}
                          {showField('Fax') && <option value="{{fax}}">Fax</option>}
                          {showField('Website') && <option value="{{website}}">Website</option>}
                        </optgroup>
                      )}
                      {['Street 1', 'Street 2', 'City', 'State', 'Postal Code', 'Country'].some(showField) && (
                        <optgroup label="Address Info">
                          {showField('Street 1') && <option value="{{street1}}">Street 1</option>}
                          {showField('Street 2') && <option value="{{street2}}">Street 2</option>}
                          {showField('City') && <option value="{{city}}">City</option>}
                          {showField('State') && <option value="{{state}}">State</option>}
                          {showField('Postal Code') && <option value="{{postalCode}}">Postal Code</option>}
                          {showField('Country') && <option value="{{country}}">Country</option>}
                        </optgroup>
                      )}
                      {['Issue Date', 'Expiration Date', 'Grade Level', 'Security Level'].some(showField) && (
                        <optgroup label="Card Details">
                          {showField('Issue Date') && <option value="{{issueDate}}">Issue Date</option>}
                          {showField('Expiration Date') && <option value="{{expirationDate}}">Expiration Date</option>}
                          {showField('Grade Level') && <option value="{{gradeLevel}}">Grade Level</option>}
                          {showField('Security Level') && <option value="{{securityLevel}}">Security Level</option>}
                        </optgroup>
                      )}
                      {['Height', 'Weight', 'Eye color', 'Hair color'].some(showField) && (
                        <optgroup label="Physical Attributes">
                          {showField('Height') && <option value="{{height}}">Height</option>}
                          {showField('Weight') && <option value="{{weight}}">Weight</option>}
                          {showField('Eye color') && <option value="{{eyeColor}}">Eye Color</option>}
                          {showField('Hair color') && <option value="{{hairColor}}">Hair Color</option>}
                        </optgroup>
                      )}
                      
                      {/* Dynamically append Custom Text Fields */}
                      {members && members.length > 0 && members[0].customFields && Object.keys(members[0].customFields).filter(f => !formConfig?.customImageFields?.includes(f)).length > 0 && (
                        <optgroup label="Custom Fields">
                          {Object.keys(members[0].customFields)
                            .filter(f => !formConfig?.customImageFields?.includes(f))
                            .map(field => (
                              <option key={field} value={`{{${field}}}`}>{field}</option>
                          ))}
                        </optgroup>
                      )}
                    </>
                  );
                })()}
              </select>
            </div>

            {/* Variable Coloring Section */}
            {(() => {
              const textValue = props.text as string | undefined;
              const matches = textValue?.match(/{{([^}]+)}}/g);
              if (!matches || matches.length === 0) return null;
              
              const uniqueVars = Array.from(new Set(matches.map((m: string) => m.replace(/[{}]/g, '').trim())));
              
              return (
                <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles size={14} className="text-purple-500" />
                    <label className="text-[11px] font-black text-gray-700 uppercase tracking-wider">Variable Colors</label>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                     {uniqueVars.map((varKey: string) => {
                       const colorMap: Record<string, string> = props.variableColors || {};
                       return (
                       <div key={varKey} className="flex items-center justify-between bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
                         <span className="text-[10px] font-bold text-gray-500 truncate max-w-[100px]">{varKey}</span>
                         <div className="flex items-center gap-2">
                           <input
                             type="color"
                             value={colorMap[varKey] || props.fill || '#000000'}
                             onChange={(e) => {
                               const newColors: Record<string, string> = { ...colorMap, [varKey]: e.target.value };
                               updateSelected('variableColors', newColors);
                             }}
                             className="w-6 h-6 rounded-md border-none cursor-pointer overflow-hidden"
                           />
                           <button 
                             onClick={() => {
                               const newColors: Record<string, string> = { ...colorMap };
                               delete newColors[varKey];
                               updateSelected('variableColors', newColors);
                             }}
                             className="text-[10px] text-gray-400 hover:text-red-500 font-bold"
                           >Reset</button>
                         </div>
                       </div>
                       );
                     })}
                  </div>
                </div>
              );
            })()}
          </section>
        )}

        <section>
          <label className="text-xs font-bold text-gray-700 block mb-3">Text Style</label>
          <div className="space-y-3">
            <div className="flex gap-2">
              <FontSelect 
                value={props.fontFamily} 
                onChange={(val) => updateSelected('fontFamily', val)} 
              />
              <div className="w-24 flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <input
                  type="number"
                  value={props.fontSize}
                  onChange={(e) => updateSelected('fontSize', parseInt(e.target.value))}
                  className="w-full px-2 text-xs outline-none"
                />
                <div className="flex flex-col border-l border-gray-200">
                  <button onClick={() => updateSelected('fontSize', props.fontSize + 1)} className="p-0.5 hover:bg-gray-50"><Plus size={10} /></button>
                  <button onClick={() => updateSelected('fontSize', props.fontSize - 1)} className="p-0.5 hover:bg-gray-50"><Minus size={10} /></button>
                </div>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={props.fill}
                onChange={(e) => updateSelected('fill', e.target.value)}
                className="w-10 h-10 rounded-lg border-none cursor-pointer"
              />
              <div className="flex-1 flex border border-gray-200 rounded-lg divide-x divide-gray-200 overflow-hidden">
                <button
                  onClick={() => updateSelected('fontWeight', props.fontWeight === 'bold' ? 'normal' : 'bold')}
                  className={`flex-1 py-2 hover:bg-gray-50 text-xs font-bold ${props.fontWeight === 'bold' ? 'bg-green-50 text-green-600' : ''}`}
                >B</button>
                <button
                  onClick={() => updateSelected('fontStyle', props.fontStyle === 'italic' ? 'normal' : 'italic')}
                  className={`flex-1 py-2 hover:bg-gray-50 text-xs italic ${props.fontStyle === 'italic' ? 'bg-green-50 text-green-600' : ''}`}
                >I</button>
                <button
                  onClick={() => updateSelected('underline', !props.underline)}
                  className={`flex-1 py-2 hover:bg-gray-50 text-xs underline ${props.underline ? 'bg-green-50 text-green-600' : ''}`}
                >U</button>
              </div>
              <div className="flex border border-gray-200 rounded-lg divide-x divide-gray-200 overflow-hidden">
                {['left', 'center', 'right'].map(align => (
                  <button
                    key={align}
                    onClick={() => updateSelected('textAlign', align)}
                    className={`p-2 hover:bg-gray-50 transition-colors ${props.textAlign === align ? 'bg-green-50 text-green-600' : 'text-gray-400'}`}
                  >
                    {align === 'left' && <AlignLeft size={16} />}
                    {align === 'center' && <AlignCenter size={16} />}
                    {align === 'right' && <AlignRight size={16} />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Width</label>
              <input
                type="number"
                value={props.width}
                onChange={(e) => updateSelected('width', parseInt(e.target.value))}
                className="w-full p-2 border border-gray-200 rounded-lg text-xs outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Height</label>
              <input
                type="number"
                value={props.height}
                onChange={(e) => updateSelected('height', parseInt(e.target.value))}
                className="w-full p-2 border border-gray-200 rounded-lg text-xs outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">X Position</label>
              <input
                type="number"
                value={props.left}
                onChange={(e) => updateSelected('left', parseInt(e.target.value))}
                className="w-full p-2 border border-gray-200 rounded-lg text-xs outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Y Position</label>
              <input
                type="number"
                value={props.top}
                onChange={(e) => updateSelected('top', parseInt(e.target.value))}
                className="w-full p-2 border border-gray-200 rounded-lg text-xs outline-none"
              />
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-gray-700">Rotation</label>
            <div className="w-16 h-8 border border-gray-200 rounded-lg flex items-center justify-center text-xs font-bold text-gray-600">
              {props.angle}°
            </div>
          </div>
          <input
            type="range"
            min="0" max="360"
            value={props.angle}
            onChange={(e) => updateSelected('angle', parseInt(e.target.value))}
            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-500"
          />
        </section>

        <section>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-gray-700">Transparency</label>
            <div className="w-16 h-8 border border-gray-200 rounded-lg flex items-center justify-between px-2 text-[10px] font-bold">
              {Math.round((1 - props.opacity) * 100)}
              <div className="flex flex-col">
                <button onClick={() => updateSelected('opacity', Math.max(0, props.opacity - 0.1))}><Plus size={10} /></button>
                <button onClick={() => updateSelected('opacity', Math.min(1, props.opacity + 0.1))}><Minus size={10} /></button>
              </div>
            </div>
          </div>
          <input
            type="range"
            min="0" max="1" step="0.1"
            value={1 - props.opacity}
            onChange={(e) => updateSelected('opacity', 1 - parseFloat(e.target.value))}
            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-500"
          />
        </section>
      </div>
    );
  };

  const addImageToCanvas = async (ph: string, label: string, canvas: fabric.Canvas | null, setActivePanel?: (p: string | null) => void) => {
    if (!canvas) return;

    let dataUrl = '';
    const { members, previewMemberId } = useDesignerStore.getState();
    const firstMember = previewMemberId ? members.find(m => m.id === previewMemberId) || members[0] : members[0];

    try {
      if (ph === '{{qr_code}}') {
        dataUrl = await QRCode.toDataURL('http://idcreator.com');
      } else if (ph === '{{barcode}}' || ph === '{{pdf417}}' || ph === '{{datamatrix}}') {
        const format: string = ph === '{{pdf417}}' ? 'pdf417' : (ph === '{{datamatrix}}' ? 'datamatrix' : 'code128');

        let data = '1234567890';
        if (format === 'upca') data = '01234567890';
        if (format === 'ean13') data = '012345678901';

        const canvas_ = document.createElement('canvas');
        try {
          const opts: any = {
            bcid: format,
            text: data,
            scale: 3,
            backgroundcolor: 'ffffff',
          };
          if (format === 'pdf417') opts.columns = 4;
          if (format !== 'pdf417' && format !== 'datamatrix') {
            opts.height = 10;
            opts.includetext = true;
            opts.textxalign = 'center';
          }

          // @ts-ignore
          bwipjs.toCanvas(canvas_, opts);
          dataUrl = canvas_.toDataURL();
        } catch (e) {
          console.error('Initial BWIP Error:', e);
        }
      } else if (firstMember) {
        const key = ph.replace(/[{}]/g, '').trim();
        if (key === 'photo' && firstMember.profileImage) dataUrl = firstMember.profileImage;
        else if (key === 'signature' && firstMember.signature) dataUrl = firstMember.signature;
        else if (key === 'fingerprint' && firstMember.fingerprint) dataUrl = firstMember.fingerprint;
        else if (key === 'logo' && firstMember.divisionLogo) dataUrl = firstMember.divisionLogo;
        else if (firstMember.customFields && firstMember.customFields[key]) {
          dataUrl = firstMember.customFields[key];
        }
      }
    } catch (err) {
      console.error('Error generating initial image:', err);
    }

    const addFallbackGroup = () => {
      const size = 120;
      const bg = new fabric.Rect({
        width: size,
        height: size,
        fill: '#f8fafc',
        stroke: '#cbd5e1',
        strokeWidth: 1,
        rx: 8,
        ry: 8,
      });

      const elements: fabric.Object[] = [bg];

      // Add illustrative elements based on type
      if (ph === '{{photo}}') {
        const silhouette = new fabric.Path('M60 45a15 15 0 100-30 15 15 0 000 30zM30 90c0-15 12-25 30-25s30 10 30 25', {
          fill: '#94a3b8',
          left: 30,
          top: 25,
          scaleX: 1,
          scaleY: 1
        });
        elements.push(silhouette);
      } else if (ph === '{{fingerprint}}') {
        const line1 = new fabric.Line([0, 0, size, size], { stroke: '#cbd5e1', strokeWidth: 1 });
        const line2 = new fabric.Line([size, 0, 0, size], { stroke: '#cbd5e1', strokeWidth: 1 });
        elements.push(line1, line2);
      }

      const labelText = new fabric.Text(label.toUpperCase(), {
        fontSize: 10,
        fontFamily: 'Inter',
        fontWeight: '900',
        fill: '#475569',
        backgroundColor: 'white',
        padding: 4,
        left: size / 2,
        top: size - 20,
        originX: 'center',
        originY: 'center'
      });
      elements.push(labelText);

      const group = new fabric.Group(elements, {
        left: 100,
        top: 100,
      });

      // @ts-ignore
      group.variableType = 'image';
      // @ts-ignore
      group.placeholder = ph;

      canvas.add(group);
      canvas.setActiveObject(group);
      if (setActivePanel) setActivePanel('customize');
    };

    if (dataUrl) {
      fabric.Image.fromURL(dataUrl, (img) => {
        if (!img) {
          console.error('Failed to load image from URL:', dataUrl);
          addFallbackGroup();
          return;
        }

        const offset = canvas.getObjects().length * 15;
        
        const maxSize = 150;
        if (img.width && img.height && (img.width > maxSize || img.height > maxSize)) {
          const scale = Math.min(maxSize / img.width, maxSize / img.height);
          img.scale(scale);
        }

        img.set({
          left: 50 + offset,
          top: 50 + offset,
        });
        // @ts-ignore
        img.placeholder = ph;
        // @ts-ignore
        img.variableType = 'image';
        // @ts-ignore
        img.securityData = ph === '{{qr_code}}' ? 'http://idcreator.com' : '1234567890';
        // @ts-ignore
        img.securityFormat = ph === '{{pdf417}}' ? 'pdf417' : (ph === '{{datamatrix}}' ? 'datamatrix' : 'code128');
        // @ts-ignore
        img.securityType = 'URL';
        // @ts-ignore
        img.qrFields = {};

        canvas.add(img);
        canvas.setActiveObject(img);
        if (setActivePanel) setActivePanel('customize');
      }, { crossOrigin: 'anonymous' });
      return;
    }

    addFallbackGroup();
  };


  export const ShapesPanel = () => {
    const { canvas, saveState, setActivePanel } = useDesignerStore();

    const addShape = (type: string) => {
      if (!canvas) return;

      let shape: fabric.Object;
      const common = {
        left: 100,
        top: 100,
        fill: '#000000',
        stroke: '#000000',
        strokeWidth: 0,
      };

      switch (type) {
        case 'rect':
          shape = new fabric.Rect({ ...common, width: 100, height: 100 });
          break;
        case 'circle':
          shape = new fabric.Circle({ ...common, radius: 50 });
          break;
        case 'triangle':
          shape = new fabric.Triangle({ ...common, width: 100, height: 100 });
          break;
        case 'line':
          shape = new fabric.Rect({ ...common, width: 200, height: 2 });
          break;
        case 'star':
          // Custom 5-point star path
          shape = new fabric.Path('M 50 0 L 61 35 L 98 35 L 68 57 L 79 91 L 50 70 L 21 91 L 32 57 L 2 35 L 39 35 Z', {
            ...common,
            scaleX: 1.2,
            scaleY: 1.2,
          });
          break;
        case 'hexagon':
          shape = new fabric.Polygon([
            { x: 50, y: 0 }, { x: 93, y: 25 }, { x: 93, y: 75 },
            { x: 50, y: 100 }, { x: 7, y: 75 }, { x: 7, y: 25 }
          ], common);
          break;
        case 'octagon':
          shape = new fabric.Polygon([
            { x: 30, y: 0 }, { x: 70, y: 0 }, { x: 100, y: 30 }, { x: 100, y: 70 },
            { x: 70, y: 100 }, { x: 30, y: 100 }, { x: 0, y: 70 }, { x: 0, y: 30 }
          ], common);
          break;
        case 'heart':
          shape = new fabric.Path('M 50 90 L 45 85 C 15 55 0 40 0 25 C 0 10 10 0 25 0 C 35 0 45 5 50 15 C 55 5 65 0 75 0 C 90 0 100 10 100 25 C 100 40 85 55 55 85 Z', {
            ...common,
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'diamond':
          shape = new fabric.Rect({ ...common, width: 70, height: 70, angle: 45 });
          break;
        case 'arrow':
          shape = new fabric.Path('M 0 40 L 60 40 L 60 20 L 100 50 L 60 80 L 60 60 L 0 60 Z', {
            ...common,
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'shield':
          shape = new fabric.Path('M 50 0 L 100 20 L 100 60 C 100 85 50 100 50 100 C 50 100 0 85 0 60 L 0 20 Z', {
            ...common,
            scaleX: 0.8,
            scaleY: 0.8,
          });
          break;
        case 'rounded_rect':
          shape = new fabric.Rect({ ...common, width: 100, height: 100, rx: 20, ry: 20 });
          break;
        case 'ellipse':
          shape = new fabric.Ellipse({ ...common, rx: 60, ry: 35 });
          break;
        case 'pentagon':
          shape = new fabric.Polygon([
            { x: 50, y: 0 }, { x: 100, y: 38 }, { x: 82, y: 100 },
            { x: 18, y: 100 }, { x: 0, y: 38 }
          ], common);
          break;
        default: return;
      }

      canvas.add(shape);
      canvas.setActiveObject(shape);
      canvas.renderAll();
      saveState();
      setActivePanel('customize');
    };

    const shapes = [
      { id: 'rect', label: 'Square', icon: <Square size={24} /> },
      { id: 'circle', label: 'Circle', icon: <CircleIcon size={24} /> },
      { id: 'triangle', label: 'Triangle', icon: <TriangleIcon size={24} /> },
      { id: 'line', label: 'Line', icon: <LineIcon size={24} className="rotate-45" /> },
      { id: 'star', label: 'Star', icon: <Star size={24} /> },
      { id: 'hexagon', label: 'Hexagon', icon: <Hexagon size={24} /> },
      { id: 'heart', label: 'Heart', icon: <Heart size={24} /> },
      { id: 'arrow', label: 'Arrow', icon: <ArrowRight size={24} /> },
      { id: 'shield', label: 'Shield', icon: <Shield size={24} /> },
      { id: 'diamond', label: 'Diamond', icon: <Square size={24} className="rotate-45" /> },
      { id: 'rounded_rect', label: 'Rounded', icon: <div className="w-6 h-6 border-2 border-current rounded-md" /> },
      { id: 'ellipse', label: 'Ellipse', icon: <div className="w-8 h-4 border-2 border-current rounded-full" /> },
      { id: 'octagon', label: 'Octagon', icon: <Hexagon size={24} className="rotate-90" /> },
      { id: 'pentagon', label: 'Pentagon', icon: <div className="w-6 h-6 border-2 border-current clip-path-pentagon" style={{ clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }} /> },
    ];

    return (
      <div className="space-y-6">
        <h2 className="text-sm font-bold text-gray-800">Shapes</h2>
        <div className="grid grid-cols-4 gap-3">
          {shapes.map(item => (
            <button
              key={item.id}
              onClick={() => addShape(item.id)}
              className="flex flex-col items-center justify-center p-3 border border-gray-100 bg-white rounded-xl hover:border-green-500 hover:bg-green-50 transition-all group"
            >
              <div className="text-gray-400 group-hover:text-green-600 mb-1">
                {item.icon}
              </div>
              <span className="text-[10px] font-bold text-gray-600">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  export const ImagesPanel = ({ setPanel }: { setPanel: (p: string | null) => void }) => {
    const { canvas, setIsImageLibraryOpen } = useDesignerStore();
    const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);



    const imageVariables = [
      { label: 'Headshot', ph: '{{photo}}', icon: <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center"><Type size={16} /></div> },
      { label: 'Signature', ph: '{{signature}}', icon: <SlidersHorizontal size={18} /> },
      { label: 'QR Code', ph: '{{qr_code}}', icon: <Shapes size={18} /> },
      { label: 'Barcode', ph: '{{barcode}}', icon: <CreditCard size={18} /> },
      { label: 'Company Logo', ph: '{{logo}}', icon: <ImageIcon size={18} /> },
      { label: 'Fingerprint', ph: '{{fingerprint}}', icon: <ShieldCheck size={18} /> },
    ];

    return (
      <div className="space-y-6">
        <section>
          <label className="text-xs font-bold text-gray-400 block mb-3 uppercase tracking-wider">Static Images</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setIsAddDialogOpen(true)}
              className="flex flex-col items-center justify-center p-4 border border-gray-100 bg-white rounded-2xl hover:border-green-200 transition-all shadow-sm active:scale-95 group"
            >
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center mb-2 group-hover:bg-green-50 transition-colors text-gray-400 group-hover:text-green-600">
                <Plus size={20} />
              </div>
              <span className="text-[11px] font-black text-gray-700">Upload Image</span>
            </button>
            <button
              onClick={() => setIsImageLibraryOpen(true)}
              className="flex flex-col items-center justify-center p-4 bg-green-500 text-white rounded-2xl hover:bg-green-600 transition-all shadow-md active:scale-95 group"
            >
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-2">
                <ImageIcon size={20} />
              </div>
              <span className="text-[11px] font-black">My Images</span>
            </button>
          </div>
        </section>

        {/* Import the dialog locally if needed or use it from elsewhere */}
        {/* For now, I'll assume AddImageDialog is imported */}
        <AddImageDialog isOpen={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)} />

        <section>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Variable Images</label>
            <span className="w-4 h-4 rounded-full bg-gray-100 text-[10px] flex items-center justify-center text-gray-400 cursor-help">?</span>
          </div>
          <div className="grid grid-cols-2 gap-3 pb-10">
            {imageVariables.map(item => (
              <button
                key={item.ph}
                onClick={() => addImageToCanvas(item.ph, item.label, canvas, setPanel)}
                className="flex flex-col items-center justify-center p-5 border border-gray-100 bg-white rounded-3xl hover:border-green-400 hover:shadow-xl hover:scale-[1.02] transition-all group shadow-sm active:scale-95"
              >
                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-2 group-hover:bg-green-50 transition-colors">
                  <div className="text-gray-400 group-hover:text-green-600 scale-125">
                    {item.icon}
                  </div>
                </div>
                <span className="text-[11px] font-black text-gray-700 text-center leading-tight">{item.label}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    );
  };

  export const SecurityPanel = () => {
    const { config, setConfig, canvas, setActivePanel } = useDesignerStore();

    const laminationOpts = [
      { id: 'none', label: 'None', icon: <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center"><div className="w-full h-0.5 bg-gray-300 rotate-45" /></div> },
      { id: 'transparent', label: 'Transparent', icon: <div className="w-8 h-8 rounded-lg bg-gray-100 flex flex-col items-center justify-center gap-0.5"><div className="w-5 h-0.5 bg-gray-300" /><div className="w-5 h-0.5 bg-gray-300" /><div className="w-5 h-0.5 bg-gray-300" /></div> },
      { id: 'hologram', label: 'Hologram', icon: <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-200 via-purple-200 to-pink-200 shadow-sm" /> },
    ];

    return (
      <div className="space-y-8 pb-20">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => addImageToCanvas('{{barcode}}', 'Barcode', canvas, setActivePanel)}
            className="flex flex-col items-center justify-center p-5 border border-gray-100 bg-white rounded-3xl hover:border-green-400 transition-all shadow-sm active:scale-95 group"
          >
            <ScanBarcode className="w-8 h-8 mb-2 text-gray-400 group-hover:text-green-600 transition-colors" />
            <span className="text-[11px] font-black text-gray-700">Add Barcode</span>
          </button>
          <button
            onClick={() => addImageToCanvas('{{qr_code}}', 'QR Code', canvas, setActivePanel)}
            className="flex flex-col items-center justify-center p-5 border border-gray-100 bg-white rounded-3xl hover:border-green-400 transition-all shadow-sm active:scale-95 group"
          >
            <QrCode className="w-8 h-8 mb-2 text-gray-400 group-hover:text-green-600 transition-colors" />
            <span className="text-[11px] font-black text-gray-700">Add QR Code</span>
          </button>
        </div>

        <section>
          <div className="flex items-center gap-2 mb-3">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Frontside Lamination</label>
            <Info size={12} className="text-gray-300 cursor-help" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {laminationOpts.map(opt => (
              <button
                key={opt.id}
                onClick={() => setConfig({ frontLamination: opt.id as any })}
                className={`flex flex-col items-center justify-center py-4 border rounded-2xl transition-all relative ${config.frontLamination === opt.id ? 'border-green-500 bg-green-50 shadow-sm ring-1 ring-green-500' : 'border-gray-100 hover:border-gray-200 bg-gray-50/30'}`}
              >
                {config.frontLamination === opt.id && <div className="absolute top-1 right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-white"><Plus size={10} className="rotate-45" /></div>}
                <div className="mb-2">{opt.icon}</div>
                <span className={`text-[10px] font-bold ${config.frontLamination === opt.id ? 'text-green-700' : 'text-gray-400'}`}>{opt.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-3">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Backside Lamination</label>
            <Info size={12} className="text-gray-300 cursor-help" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {laminationOpts.map(opt => (
              <button
                key={opt.id}
                onClick={() => setConfig({ backLamination: opt.id as any })}
                className={`flex flex-col items-center justify-center py-4 border rounded-2xl transition-all relative ${config.backLamination === opt.id ? 'border-green-500 bg-green-50 shadow-sm ring-1 ring-green-500' : 'border-gray-100 hover:border-gray-200 bg-gray-50/30'}`}
              >
                {config.backLamination === opt.id && <div className="absolute top-1 right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-white"><Plus size={10} className="rotate-45" /></div>}
                <div className="mb-2">{opt.icon}</div>
                <span className={`text-[10px] font-bold ${config.backLamination === opt.id ? 'text-green-700' : 'text-gray-400'}`}>{opt.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Magnetic Stripe Encoding</label>
              <Info size={12} className="text-gray-300 cursor-help" />
            </div>
            <button
              onClick={() => setConfig({ magStripeEnabled: !config.magStripeEnabled })}
              className={`w-10 h-5 rounded-full relative transition-colors ${config.magStripeEnabled ? 'bg-green-500' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${config.magStripeEnabled ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>

          {config.magStripeEnabled && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
              {['Track 1', 'Track 2', 'Track 3'].map((track, i) => (
                <div key={track} className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">{track}:</label>
                  <input
                    type="text"
                    value={(config.magStripeTracks as any)[`track${i + 1}`]}
                    onChange={(e) => setConfig({
                      magStripeTracks: { ...config.magStripeTracks, [`track${i + 1}`]: e.target.value }
                    })}
                    placeholder={`Enter data for ${track}...`}
                    className="w-full px-3 py-2 border border-gray-100 rounded-xl text-xs outline-none focus:ring-1 focus:ring-green-500 bg-white"
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <label className="text-[11px] font-bold text-gray-700 block mb-2 uppercase tracking-wider">Smart Fields:</label>
          <select className="w-full p-3 border border-gray-100 rounded-xl text-xs outline-none focus:ring-1 focus:ring-green-500 bg-white appearance-none">
            <option>Select a Smart field...</option>
            <option>Full Name</option>
            <option>Employee ID</option>
            <option>Department</option>
          </select>
        </section>
      </div>
    );
  };
