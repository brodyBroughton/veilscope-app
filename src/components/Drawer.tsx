"use client";

import React from "react";
import { DATA } from "@/lib/data";

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  activeKey: string;
  onSelectCompany: (key: string) => void;
};

export default function Drawer({ open, onClose, activeKey, onSelectCompany }: DrawerProps) {
  const closeOnMobile = () => {
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 991px)").matches) {
      onClose();
    }
  };

  const handleSelect = (key: string) => {
    onSelectCompany(key);
    closeOnMobile();
  };

  return (
    <>
      {open && <div className="scrim" onClick={onClose} />}
      <aside
        id="appDrawer"
        className={`app-drawer ${open ? "is-open" : ""}`}
        role="complementary"
        aria-label="Companies"
        aria-hidden={!open}
        tabIndex={-1}
      >
        <div className="drawer-head">
          <div className="search">
            <input
              id="tickerSearch"
              type="search"
              inputMode="search"
              placeholder="Search company…"
              aria-label="Search company"
            />
          </div>
          {/* You can wire this search up later; for now it's just visual */}
        </div>

        {/* Simple list of companies from DATA */}
        <nav className="tree" aria-label="Companies">
          <ul>
            {Object.entries(DATA).map(([key, company]) => {
              const hasAnalysis =
                typeof company.score === "number" &&
                Number.isFinite(company.score) &&
                company.factors.length > 0;

              return (
                <li key={key}>
                  <button
                    type="button"
                    className="drawer-item-btn"
                    onClick={() => handleSelect(key)}
                    aria-current={key === activeKey ? "page" : undefined}
                  >
                    <span className="drawer-item-name">{company.name}</span>
                    <span className="drawer-item-meta">
                      {hasAnalysis
                        ? `Score: ${company.score}/100`
                        : "Needs analysis"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}