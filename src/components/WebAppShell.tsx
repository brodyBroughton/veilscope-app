"use client";

import { useState } from "react";
import Topbar from "@/components/Topbar";
import Tabbar from "@/components/Tabbar";
import Drawer from "@/components/Drawer";
import Workbench from "@/components/Workbench";
import Statusbar from "@/components/Statusbar";
import { useTheme } from "@/hooks/useTheme";
import type { Tab } from "@/types/ui";

export default function WebAppShell() {
  const { theme, setTheme } = useTheme();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tabs, setTabs] = useState<Tab[]>([
    { key: "AAPL", label: "AAPL 10-K" },
    { key: "MSFT", label: "MSFT 10-Q" },
    { key: "SAMPLE", label: "Sample Scorecard" },
  ]);
  const [activeKey, setActiveKey] = useState<string>("AAPL");

  const handleActivate = (key: string) => {
    setActiveKey(key);
  };

  const handleClose = (key: string) => {
    setTabs((prev) => {
      const next = prev.filter((t) => t.key !== key);
      if (key === activeKey) {
        setActiveKey(next[0]?.key ?? "SAMPLE");
      }
      return next.length > 0 ? next : [{ key: "SAMPLE", label: "Sample Scorecard" }];
    });
  };

  const openTicker = (key: string, label: string) => {
    setTabs((prev) => {
      if (!prev.some((t) => t.key === key)) {
        return [...prev, { key, label }];
      }
      return prev;
    });
    setActiveKey(key);
    if (window.matchMedia("(max-width: 991px)").matches) {
      setDrawerOpen(false);
    }
  };

  return (
    <>
      <Topbar
        tabs={tabs}
        activeKey={activeKey}
        onActivate={handleActivate}
        onClose={handleClose}
        onToggleDrawer={() => setDrawerOpen((o) => !o)}
        onOpenSettings={() => {
          /* TODO: open settings modal/chart */
        }}
      />

      <Tabbar
        tabs={tabs}
        activeKey={activeKey}
        onActivate={handleActivate}
        onClose={handleClose}
      />

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onOpenTicker={openTicker}
      />

      <Workbench activeKey={activeKey} />

      <Statusbar />
    </>
  );
}
