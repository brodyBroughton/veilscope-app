"use client";

import React from "react";

type DrawerProps = {
  open: boolean;
  onClose: () => void;
};

export default function Drawer({ open, onClose }: DrawerProps) {
  const closeOnMobile = () => {
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 991px)").matches) {
      onClose();
    }
  };

  return (
    <>
      {open && <div className="scrim" onClick={onClose} />}
      <aside
        id="appDrawer"
        className={`app-drawer ${open ? "is-open" : ""}`}
        role="complementary"
        aria-label="Explorer"
        aria-hidden={!open}
        tabIndex={-1}
      >
        <div className="drawer-head">
          <div className="search">
            <input
              id="tickerSearch"
              type="search"
              inputMode="search"
              placeholder="Search Ticker…"
              aria-label="Search ticker"
            />
          </div>
        </div>
      </aside>
    </>
  );
}