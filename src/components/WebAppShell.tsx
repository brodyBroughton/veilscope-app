"use client";

import { useState } from "react";
import Topbar from "@/components/Topbar";
import Drawer from "@/components/Drawer";
import Workbench from "@/components/Workbench";

// Map your internal keys to real tickers.
// Adjust these as needed.
const TICKER_BY_KEY: Record<string, string> = {
  ALPHA: "AAPL",
  NODATA: "VRTX",
};

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

  const activeTicker = TICKER_BY_KEY[activeKey] ?? activeKey;

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

      <Workbench activeKey={activeKey} activeTicker={activeTicker} />
    </div>
  );
}
