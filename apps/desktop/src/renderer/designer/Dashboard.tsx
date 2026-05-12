import React, { useEffect } from 'react';
import { Plus, Sparkles, Globe, Clock, Edit2 } from 'lucide-react';
import { SavedDesign, useDesignerStore } from './store';

// Dual-side card preview — matches the exact same style as My Designs
const DesignCard = ({
  design,
  onClick,
  accentColor = 'green',
  badge,
}: {
  design: any;
  onClick: () => void;
  accentColor?: 'green' | 'amber';
  badge?: React.ReactNode;
}) => {
  const hoverShadow = accentColor === 'green'
    ? ''
    : '';
  const hoverBorder = accentColor === 'green' ? 'group-hover:border-green-400' : 'group-hover:border-amber-400';

  // Orientation determines split direction:
  // horizontal card → top/bottom split (flex-col)
  // vertical card   → left/right split (flex-row)
  const isHorizontal = design.config?.orientation === 'horizontal';

  return (
    <button
      onClick={onClick}
      className={`flex flex-col group text-left w-full bg-white rounded-[28px] border border-gray-100 overflow-hidden transition-all duration-500 ${hoverShadow} ${hoverBorder} group-hover:-translate-y-2`}
    >
      {/* Dual-side preview — aspect-square to match My Designs */}
      <div className="relative w-full aspect-square bg-gray-100 overflow-hidden group-hover:bg-green-50/20 transition-colors duration-500">
        <div className={`w-full h-full flex ${isHorizontal ? 'flex-col' : 'flex-row'}`}>
          {/* Front */}
          <div className="flex-1 relative overflow-hidden border-b border-gray-100 last:border-0">
            {design.thumbnailFront ? (
              <img src={design.thumbnailFront} alt="Front" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-300 text-xs font-bold">No Preview</div>
            )}
            <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-md text-[9px] font-black text-white rounded-md uppercase tracking-wider">
              Front
            </div>
          </div>

          {/* Back */}
          <div className="flex-1 relative overflow-hidden border-l border-gray-100 first:border-0">
            {design.thumbnailBack ? (
              <img src={design.thumbnailBack} alt="Back" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-300 text-xs font-bold">No Preview</div>
            )}
            <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-md text-[9px] font-black text-white rounded-md uppercase tracking-wider">
              Back
            </div>
          </div>
        </div>

        {/* Top-right badge (e.g. Sparkles for official) */}
        {badge && (
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all ">
            {badge}
          </div>
        )}

        {/* Hover action overlay */}
        <div className="absolute inset-0 bg-gray-900/10 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-500 z-20 flex items-center justify-center">
          <div className="p-4 bg-white text-gray-900 rounded-2xl  transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
            <Edit2 size={22} strokeWidth={2.5} />
          </div>
        </div>
      </div>

      {/* Label */}
      <div className="px-4 py-3 border-t border-gray-50">
        <h3 className={`text-sm font-black text-gray-900 truncate transition-colors ${accentColor === 'green' ? 'group-hover:text-green-600' : 'group-hover:text-amber-600'}`}>
          {design.name}
        </h3>
        <p className="text-[10px] font-bold text-gray-900 uppercase tracking-widest mt-0.5">
          {design.isGlobal ? 'Official Design' : `Modified ${new Date(design.timestamp || design.updatedAt || '').toLocaleDateString()}`}
        </p>
      </div>
    </button>
  );
};

export const Dashboard = ({ onSelect }: { onSelect: (design: SavedDesign | null) => void }) => {
  const savedDesigns = useDesignerStore((s) => s.savedDesigns);
  const loadTemplatesFromDb = useDesignerStore((s) => s.loadTemplatesFromDb);

  useEffect(() => {
    void loadTemplatesFromDb();
  }, []);

  const officialTemplates = savedDesigns.filter((d: any) => d.isGlobal);
  const myRecent = savedDesigns.filter((d: any) => !d.isGlobal).slice(0, 4);

  return (
    <div className="flex-1 overflow-y-auto bg-[#fafaf9] px-10 py-12 custom-scrollbar">
      <div className="max-w-[1600px] mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Get Started</h1>
          <p className="text-gray-900 font-medium mt-2 text-lg">Pick a professional template or start from scratch.</p>
        </header>

        {/* Section: Official Templates */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-green-100 text-green-600 rounded-xl">
              <Globe size={20} strokeWidth={2.5} />
            </div>
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-widest text-sm">Official ID Templates</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {/* Blank Canvas — matches card height via aspect-square */}
            <button
              type="button"
              onClick={() => onSelect(null)}
              className="flex flex-col group w-full text-left bg-white rounded-[28px] border-2 border-dashed border-gray-200 overflow-hidden transition-all duration-500 hover:border-green-400  hover:-translate-y-2"
            >
              <div className="relative w-full aspect-square flex flex-col items-center justify-center gap-4 bg-gray-50/50 group-hover:bg-green-50/30 transition-colors duration-500">
                <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-gray-300  transition-all duration-500 group-hover:text-green-600  group-hover:rotate-90">
                  <Plus size={28} strokeWidth={2.5} />
                </div>
              </div>
              <div className="px-4 py-3 border-t border-gray-100">
                <h3 className="text-sm font-black text-gray-900 group-hover:text-green-600 transition-colors">Blank Canvas</h3>
                <p className="text-[10px] font-bold text-gray-900 uppercase tracking-widest mt-0.5">Start from scratch</p>
              </div>
            </button>

            {/* Official template cards */}
            {officialTemplates.map((design: any) => (
              <DesignCard
                key={design.id}
                design={design}
                onClick={() => onSelect(design)}
                accentColor="green"
                badge={<Sparkles size={14} className="text-green-500 fill-green-500" />}
              />
            ))}
          </div>
        </section>

        {/* Section: Recent Designs */}
        {myRecent.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                <Clock size={20} strokeWidth={2.5} />
              </div>
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-widest text-sm">Your Recent Designs</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {myRecent.map((design: any) => (
                <DesignCard
                  key={design.id}
                  design={design}
                  onClick={() => onSelect(design)}
                  accentColor="amber"
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
