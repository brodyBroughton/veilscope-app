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
    // drawer close-on-mobile handled inside Drawer via media query, if you kept that
  };

  const activeCompany = DATA[activeKey];
  const activeTicker = activeCompany?.ticker ?? null;

  return (
    <div className={`webapp ${drawerOpen ? "drawer-open" : "drawer-closed"}`}>
      <Topbar
        onToggleDrawer={handleToggleDrawer}
        onOpenSettings={() => {
          // TODO: open settings modal
        }}
        activeTicker={activeTicker}
      />

      <Drawer
        open={drawerOpen}
        onClose={handleCloseDrawer}
        activeKey={activeKey}
        onSelectCompany={handleSelectCompany}
      />

      <Workbench activeKey={activeKey} />
    </div>
  );
}
