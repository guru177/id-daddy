import React from "react";
import { DataUpload } from "../designer/DataUpload";

export function UploadView() {
  return (
    <div className="flex flex-col h-full bg-stone-50 overflow-hidden text-gray-900">
      <div className="flex-1 overflow-hidden relative">
        <DataUpload />
      </div>
    </div>
  );
}
