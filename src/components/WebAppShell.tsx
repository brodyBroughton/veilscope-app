"use client";

import { useState } from "react";
import Topbar from "@/components/Topbar";
import Drawer from "@/components/Drawer";
import Workbench from "@/components/Workbench";
// import { useTheme } from "@/hooks/useTheme"; // if you still use theme

export default function WebAppShell() {
  // const { theme, setTheme } = useTheme();

  const [drawerOpen, setDrawerOpen] = useState(false);

  // For now, just show SAMPLE as the placeholder company
  const defaultKey = "SAMPLE";

  return (
    <div className={`webapp ${!drawerOpen ? "drawer-closed" : ""}`}>
      <Topbar
        onToggleDrawer={() => setDrawerOpen((open) => !open)}
        onOpenSettings={() => {
          // TODO: open settings modal
        }}
      />

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      <Workbench activeKey={defaultKey} />
    </div>
  );
}
