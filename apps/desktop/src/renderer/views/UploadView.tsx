import React, { useState } from "react";
import { DataUpload } from "../designer/DataUpload";
import { MyMembers } from "../designer/MyMembers";

export function UploadView() {
  const [activeTab, setActiveTab] = useState<'Manage Data' | 'Member Previews'>('Manage Data');

  return (
    <div className="flex flex-col h-full bg-stone-50 overflow-hidden text-gray-800">
      {/* Top Navigation for Upload View */}
      <header className="h-[73px] bg-green-50/50 border-b border-stone-200 flex items-center justify-center gap-10 px-4 shrink-0">
        <button 
          onClick={() => setActiveTab('Manage Data')}
          className={`text-[11px] uppercase tracking-wide font-black h-full border-b-[3px] px-2 transition-all pt-[3px] ${activeTab === 'Manage Data' ? 'border-[#34a853] text-[#34a853]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          Manage Data
        </button>
        <button 
          onClick={() => setActiveTab('Member Previews')}
          className={`text-[11px] uppercase tracking-wide font-black h-full border-b-[3px] px-2 transition-all pt-[3px] ${activeTab === 'Member Previews' ? 'border-[#34a853] text-[#34a853]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          Member Previews
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'Manage Data' && <DataUpload />}
        {activeTab === 'Member Previews' && <MyMembers />}
      </div>
    </div>
  );
}
