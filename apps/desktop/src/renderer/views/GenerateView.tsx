import React from "react";
import { MyMembers } from "../designer/MyMembers";

export function GenerateView() {
  return (
    <div className="flex flex-col h-full bg-stone-50 overflow-hidden">
      <MyMembers />
    </div>
  );
}
