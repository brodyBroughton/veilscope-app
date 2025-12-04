// src/components/Drawer.tsx
"use client";

import React from "react";

type CompanySummary = {
  ticker: string;
  name: string;
  desc: string;
};

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  // Treat this as the active ticker symbol (e.g. "NVDA")
  activeKey: string;
  // Called with the selected company summary
  onSelectCompany: (company: CompanySummary) => void;
  // Saved companies loaded from the database
  savedCompanies: CompanySummary[];
};

export default function Drawer({
  open,
  onClose,
  activeKey,
  onSelectCompany,
  savedCompanies,
}: DrawerProps) {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<CompanySummary[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const closeOnMobile = () => {
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 991px)").matches) {
      onClose();
    }
  };

  const handleSelect = (company: CompanySummary) => {
    onSelectCompany(company);
    closeOnMobile();
  };

  // Debounced search → /api/search
  React.useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsSearching(false);
      setError(null);
      return;
    }

    setIsSearching(true);
    setError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error("Search failed");
        }

        const data = await res.json();
        setResults(data.results ?? []);
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error("Search error", err);
        setError("Search failed. Please try again.");
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [query]);

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
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="drawer-search-results">
          {/* When no query, show saved companies */}
          {query.trim().length === 0 && (
            <>
              {savedCompanies.length === 0 ? (
                <p className="drawer-hint">
                  Type a ticker or company name to search.
                </p>
              ) : (
                <nav className="tree" aria-label="Saved companies">
                  <ul>
                    {savedCompanies.map((company) => (
                      <li key={company.ticker}>
                        <button
                          type="button"
                          className="drawer-item-btn"
                          onClick={() => handleSelect(company)}
                          aria-current={
                            company.ticker === activeKey ? "page" : undefined
                          }
                        >
                          <span className="drawer-item-name">
                            {company.name} ({company.ticker})
                          </span>
                          <span className="drawer-item-meta">
                            {/* We don't know analysis state here; the main pane will show it */}
                            Saved
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}
            </>
          )}

          {/* When there is a query, show search results */}
          {query.trim().length > 0 && (
            <>
              {isSearching && <p className="drawer-hint">Searching…</p>}
              {error && <p className="drawer-error">{error}</p>}
              {!isSearching && !error && results.length === 0 && (
                <p className="drawer-hint">No matches found.</p>
              )}
              {results.length > 0 && (
                <nav className="tree" aria-label="Search results">
                  <ul>
                    {results.map((company) => (
                      <li key={company.ticker}>
                        <button
                          type="button"
                          className="drawer-item-btn"
                          onClick={() => handleSelect(company)}
                          aria-current={
                            company.ticker === activeKey ? "page" : undefined
                          }
                        >
                          <span className="drawer-item-name">
                            {company.name} ({company.ticker})
                          </span>
                          <span className="drawer-item-meta">Needs analysis</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}
            </>
          )}
        </div>
      </aside>
    </>
  );
}