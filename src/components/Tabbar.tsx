"use client";

import React from "react";
import type { Tab } from "@/types/ui";

interface TabbarProps {
  tabs: Tab[];
  activeKey: string;
  onActivate: (key: string) => void;
  onClose: (key: string) => void;
}

export default function Tabbar({
  tabs,
  activeKey,
  onActivate,
  onClose,
}: TabbarProps) {
  return (
    <>
      {tabs.map((t) => (
        <div
          key={t.key}
          className={`tabitem ${activeKey === t.key ? "is-active" : ""}`}
        >
          <button
            role="tab"
            aria-selected={activeKey === t.key}
            className={`tab ${activeKey === t.key ? "is-active" : ""}`}
            onClick={() => onActivate(t.key)}
          >
            {t.label}
          </button>
          <button
            className="tab-close"
            aria-label={`Close ${t.label}`}
            title="Close"
            onClick={() => onClose(t.key)}
          >
            ×
          </button>
        </div>
      ))}
    </>
  );
}
