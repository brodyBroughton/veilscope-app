// src/app/WebAppShell.tsx
"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import Drawer from "@/components/Drawer";
import Workbench, { type CompanyLike } from "@/components/Workbench";

type CompanySummary = {
  ticker: string;
  name: string;
  desc: string;
};

type SavedItemDTO = {
  id: string;
  ticker: string;
  name: string;
  desc: string;
  score: number | null;
  factors: CompanyLike["factors"];
};

export default function WebAppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [activeTicker, setActiveTicker] = useState<string>("");
  const [activeCompany, setActiveCompany] = useState<CompanyLike | null>(null);
  const [isRunningAnalysis, setIsRunningAnalysis] = useState(false);

  const [savedItems, setSavedItems] = useState<SavedItemDTO[]>([]);

  // Load saved items on mount
  useEffect(() => {
    let cancelled = false;

    const loadSavedItems = async () => {
      try {
        const res = await fetch("/api/item/list", {
          method: "GET",
          cache: "no-store",
        });

        if (!res.ok) {
          // 401 when logged out is normal
          const text = await res.text().catch(() => "");
          console.error("Failed to load saved items:", res.status, text);
          return;
        }

        const data = (await res.json()) as SavedItemDTO[];
        if (!cancelled) {
          setSavedItems(data || []);

          // If nothing active yet, auto-select the first saved item (optional, nice UX).
          if (!activeTicker && data.length > 0) {
            const first = data[0];
            setActiveTicker(first.ticker);
            setActiveCompany({
              name: first.name,
              desc: first.desc,
              ticker: first.ticker,
              score: first.score,
              factors: first.factors,
            });
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Error loading saved items:", err);
        }
      }
    };

    loadSavedItems();

    return () => {
      cancelled = true;
    };
  }, []); // run once

  const handleToggleDrawer = () => {
    setDrawerOpen((open) => !open);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
  };

  const handleSelectCompany = (company: CompanySummary) => {
    const ticker = company.ticker.toUpperCase();
    setActiveTicker(ticker);

    // See if we already have a saved item for this ticker
    const saved = savedItems.find(
      (item) => item.ticker.toUpperCase() === ticker
    );

    if (saved) {
      setActiveCompany({
        name: saved.name,
        desc: saved.desc,
        ticker: saved.ticker,
        score: saved.score,
        factors: saved.factors,
      });
    } else {
      // Fallback to just the summary (no analysis yet)
      setActiveCompany({
        name: company.name,
        desc: company.desc,
        ticker,
        score: null,
        factors: [],
      });
    }

    // Persist summary in DB (creates or updates Item)
    void (async () => {
      try {
        const res = await fetch("/api/item/summary", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ticker,
            name: company.name,
            desc: company.desc,
          }),
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          console.error("Failed to save summary item:", res.status, text);
          return;
        }

        const savedContent = (await res.json()) as CompanyLike;

        setActiveCompany(savedContent);

        // Also update savedItems list so Drawer stays in sync
        setSavedItems((prev) => {
          const others = prev.filter(
            (item) => item.ticker.toUpperCase() !== ticker
          );
          return [
            {
              id: `${ticker}-local`, // you can ignore id here, it’s just for list keys
              ticker: savedContent.ticker,
              name: savedContent.name,
              desc: savedContent.desc,
              score: savedContent.score,
              factors: savedContent.factors,
            },
            ...others,
          ];
        });
      } catch (err) {
        console.error("Error saving summary item:", err);
      }
    })();
  };

  const handleRunAnalysis = async (ticker: string) => {
    if (!ticker) return;

    try {
      setIsRunningAnalysis(true);

      const res = await fetch("/api/analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ticker }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("Analysis failed:", res.status, text);
        return;
      }

      const data = (await res.json()) as CompanyLike;

      setActiveCompany((prev) => {
        if (!prev) return data;
        if (prev.ticker.toUpperCase() !== data.ticker.toUpperCase()) return data;
        return {
          ...prev,
          score: data.score,
          factors: data.factors,
        };
      });

      // Update savedItems so Drawer reflects analysis status
      setSavedItems((prev) => {
        const others = prev.filter(
          (item) => item.ticker.toUpperCase() !== data.ticker.toUpperCase()
        );
        return [
          {
            id: `${data.ticker}-local`,
            ticker: data.ticker,
            name: data.name,
            desc: data.desc,
            score: data.score,
            factors: data.factors,
          },
          ...others,
        ];
      });
    } catch (err) {
      console.error("Analysis error:", err);
    } finally {
      setIsRunningAnalysis(false);
    }
  };

  const topbarTicker = activeTicker || null;

  return (
    <div className={`webapp ${drawerOpen ? "drawer-open" : "drawer-closed"}`}>
      <Topbar
        onToggleDrawer={handleToggleDrawer}
        onOpenSettings={() => {
          // TODO: open settings page / route
        }}
        activeTicker={topbarTicker}
      />

      <Drawer
        open={drawerOpen}
        onClose={handleCloseDrawer}
        activeKey={activeTicker}
        onSelectCompany={handleSelectCompany}
        savedCompanies={savedItems.map((item) => ({
          ticker: item.ticker,
          name: item.name,
          desc: item.desc,
        }))}
      />

      <Workbench
        activeTicker={topbarTicker}
        company={activeCompany}
        onRunAnalysis={handleRunAnalysis}
      />

      {isRunningAnalysis && (
        <div className="analysis-overlay">
          <span>Running analysis…</span>
        </div>
      )}
    </div>
  );
}
