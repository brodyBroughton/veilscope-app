// src/app/WebAppShell.tsx
"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import Drawer from "@/components/Drawer";
import Workbench, { type AnalysisFacts, type CompanyLike } from "@/components/Workbench";

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
  facts: AnalysisFacts | null;
};

export default function WebAppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [activeTicker, setActiveTicker] = useState<string>("");
  const [activeCompany, setActiveCompany] = useState<CompanyLike | null>(null);
  const [isRunningAnalysis, setIsRunningAnalysis] = useState(false);
  const [analysisFacts, setAnalysisFacts] = useState<AnalysisFacts | null>(null);
  const [analysisFactsTicker, setAnalysisFactsTicker] = useState<string>("");

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
            setAnalysisFactsTicker(first.ticker);
            setAnalysisFacts(first.facts ?? null);
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

  const handleDeleteSavedCompany = async (ticker: string) => {
    if (!ticker) return;

    try {
      const res = await fetch("/api/item/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ticker }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("Failed to delete saved item:", res.status, text);
        return;
      }

      setSavedItems((prev) => {
        const normalizedTicker = ticker.toUpperCase();
        const nextItems = prev.filter(
          (item) => item.ticker.toUpperCase() !== normalizedTicker
        );

        if (activeTicker.toUpperCase() === normalizedTicker) {
          if (nextItems.length > 0) {
            const first = nextItems[0];
            setActiveTicker(first.ticker);
            setActiveCompany({
              name: first.name,
              desc: first.desc,
              ticker: first.ticker,
              score: first.score,
              factors: first.factors,
            });
            setAnalysisFactsTicker(first.ticker);
            setAnalysisFacts(first.facts ?? null);
          } else {
            setActiveTicker("");
            setActiveCompany(null);
            setAnalysisFactsTicker("");
            setAnalysisFacts(null);
          }
        }

        return nextItems;
      });
    } catch (err) {
      console.error("Error deleting saved item:", err);
    }
  };

  const handleSelectCompany = (company: CompanySummary) => {
    const ticker = company.ticker.toUpperCase();
    setActiveTicker(ticker);
    setAnalysisFactsTicker(ticker);

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
      setAnalysisFacts(saved.facts ?? null);
    } else {
      setAnalysisFacts(null);
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
          const previousItem = prev.find(
            (item) => item.ticker.toUpperCase() === ticker
          );
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
              facts: previousItem?.facts ?? null,
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
      setAnalysisFacts(null);
      setAnalysisFactsTicker(ticker);

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

      const data = await res.json();
      console.log("Analysis response:", data);
      const nextFacts = (data?.facts as AnalysisFacts | undefined) ?? null;
      setAnalysisFacts(nextFacts);
      setSavedItems((prev) => {
        const normalizedTicker = ticker.toUpperCase();
        const existing = prev.find(
          (item) => item.ticker.toUpperCase() === normalizedTicker
        );
        const others = prev.filter(
          (item) => item.ticker.toUpperCase() !== normalizedTicker
        );
        const baseCompany = existing ?? {
          id: `${normalizedTicker}-local`,
          ticker: normalizedTicker,
          name: activeCompany?.name ?? normalizedTicker,
          desc: activeCompany?.desc ?? "",
          score: activeCompany?.score ?? null,
          factors: activeCompany?.factors ?? [],
          facts: null,
        };
        return [
          {
            ...baseCompany,
            facts: nextFacts,
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
        onDeleteSavedCompany={handleDeleteSavedCompany}
        savedCompanies={savedItems.map((item) => ({
          ticker: item.ticker,
          name: item.name,
          desc: item.desc,
        }))}
      />

      <Workbench
        activeTicker={topbarTicker}
        company={activeCompany}
        facts={analysisFactsTicker === topbarTicker ? analysisFacts : null}
        isFactsLoading={isRunningAnalysis && analysisFactsTicker === topbarTicker}
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
