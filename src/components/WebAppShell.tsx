// src/app/WebAppShell.tsx (or wherever this lives)
"use client";

import { useState } from "react";
import Topbar from "@/components/Topbar";
import Drawer from "@/components/Drawer";
import Workbench from "@/components/Workbench";
import { DATA } from "@/lib/data";

export default function WebAppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeKey, setActiveKey] = useState<string>("ALPHA");

  const handleToggleDrawer = () => {
    setDrawerOpen((open) => !open);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
  };

  const handleSelectCompany = (key: string) => {
    setActiveKey(key);
  };

  // Look up the active company from DATA using the internal key (ALPHA, NONEXISTENT, etc.)
  const activeCompany = DATA[activeKey as keyof typeof DATA] ?? DATA.ALPHA;

  // Use the company's ticker for live quotes (or null/undefined when there isn't one)
  const activeTicker = activeCompany.ticker || null;

  return (
    <div className={`webapp ${drawerOpen ? "drawer-open" : "drawer-closed"}`}>
      <Topbar
        onToggleDrawer={handleToggleDrawer}
        onOpenSettings={() => {
          // TODO: open settings page / route
        }}
        activeTicker={activeTicker}
      />

      <Drawer
        open={drawerOpen}
        onClose={handleCloseDrawer}
        activeKey={activeKey}
        onSelectCompany={handleSelectCompany}
      />

      {/* Workbench already uses DATA[activeKey] internally, so this stays keyed on ALPHA/NONEXISTENT */}
      <Workbench activeKey={activeKey} />
    </div>
  );
}