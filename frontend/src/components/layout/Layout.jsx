import React from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { AskTrafficTwin } from "../common/AskTrafficTwin";

export function Layout() {
  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col font-sans">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-[#070B14] to-[#0A101D] p-4 md:p-6">
          <Outlet />
        </main>
      </div>
      <AskTrafficTwin />
    </div>
  );
}
