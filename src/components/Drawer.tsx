"use client";

import React from "react";

export default function Drawer({
  open,
  onClose,
  onOpenTicker,
}: {
  open: boolean;
  onClose: () => void;
  onOpenTicker: (key: string, label: string) => void;
}) {
  const closeOnMobile = () => {
    if (window.matchMedia("(max-width: 991px)").matches) onClose();
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
            {/* Search button removed */}
          </div>
          <div className="drawer-actions">
            <button className="mini-btn" type="button" aria-label="New Folder">
              New Folder
            </button>
            <button className="mini-btn" type="button" aria-label="New Analysis">
              New Analysis
            </button>
          </div>
        </div>

        <nav className="tree" aria-label="Saved items">
          <details open>
            <summary>Portfolio</summary>
            <ul id="portfolioList">
              <li>
                <details open>
                  <summary>Tech</summary>
                  <ul>
                    <li>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          onOpenTicker("AAPL", "AAPL — 10-K 2024");
                          closeOnMobile();
                        }}
                      >
                        AAPL — 10-K 2024
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          onOpenTicker("MSFT", "MSFT — 10-Q 2025-Q1");
                          closeOnMobile();
                        }}
                      >
                        MSFT — 10-Q 2025-Q1
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          onOpenTicker("NVDA", "NVDA — 10-K 2024");
                          closeOnMobile();
                        }}
                      >
                        NVDA — 10-K 2024
                      </a>
                    </li>
                  </ul>
                </details>
              </li>
              <li>
                <details>
                  <summary>Energy</summary>
                  <ul>
                    <li>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          onOpenTicker("XOM", "XOM — 10-K 2024");
                          closeOnMobile();
                        }}
                      >
                        XOM — 10-K 2024
                      </a>
                    </li>
                  </ul>
                </details>
              </li>
            </ul>
          </details>
        </nav>
      </aside>
    </>
  );
}
