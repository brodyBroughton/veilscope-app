// src/components/Topbar.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

type Quote = {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
  asOf: string;
};

interface TopbarProps {
  onToggleDrawer: () => void;
  onOpenSettings: () => void;
  activeTicker?: string | null;
  showMenuButton?: boolean; // NEW – optional, default true
}

const LOGIN_PATH = "/login";

const ADMIN_LINKS = [
  {
    href: "/admin/updates",
    label: "Project Updates",
  },
];

export default function Topbar({
  onToggleDrawer,
  onOpenSettings,
  activeTicker,
  showMenuButton = true,
}: TopbarProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);

  const profileRef = useRef<HTMLDivElement | null>(null);
  const avatarButtonRef = useRef<HTMLButtonElement | null>(null);

  const notifRef = useRef<HTMLDivElement | null>(null);
  const notifButtonRef = useRef<HTMLButtonElement | null>(null);

  const handleNotificationsClick = () => {
    setProfileOpen(false);
    setNotifOpen((o) => !o);
  };

  const handleProfileClick = () => {
    setNotifOpen(false);
    setProfileOpen((o) => !o);
  };

  const handleProfileSettingsClick: React.MouseEventHandler<
    HTMLAnchorElement
  > = () => {
    setProfileOpen(false);
    onOpenSettings?.();
  };

  const handleAdminLinkClick: React.MouseEventHandler<HTMLAnchorElement> = () => {
    setProfileOpen(false);
  };

  // Close the profile menu when clicking outside the profile popover/avatar.
  useEffect(() => {
    if (!profileOpen) return;

    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        profileRef.current &&
        !profileRef.current.contains(target) &&
        avatarButtonRef.current &&
        !avatarButtonRef.current.contains(target)
      ) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleDocumentClick);
    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
    };
  }, [profileOpen]);

  // Close the notifications popover when clicking outside the bell / popover.
  useEffect(() => {
    if (!notifOpen) return;

    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        notifRef.current &&
        !notifRef.current.contains(target) &&
        notifButtonRef.current &&
        !notifButtonRef.current.contains(target)
      ) {
        setNotifOpen(false);
      }
    };

    document.addEventListener("mousedown", handleDocumentClick);
    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
    };
  }, [notifOpen]);

    // Fetch user info (email, role, avatar image from DB)
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await fetch("/api/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          headers: { accept: "application/json" },
        });

        const ct = res.headers.get("content-type") || "";
        if (res.status === 401 || !ct.includes("application/json")) {
          window.location.replace(LOGIN_PATH);
          return;
        }

        const data = (await res.json()) as {
          email?: string;
          role?: string | null;
          image?: string | null;
          name?: string | null;
        };

        if (mounted) {
          setEmail(data?.email ?? null);
          setRole(data?.role ?? null);
          setAvatarUrl(data?.image ?? null);
          setName(data?.name ?? null); // NEW
        }
      } catch {
        window.location.replace(LOGIN_PATH);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);


  // Poll quote for activeTicker every 10s
  useEffect(() => {
    if (!activeTicker) {
      setQuote(null);
      return;
    }

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const fetchQuote = async () => {
      try {
        const res = await fetch(
          `/api/quote?symbol=${encodeURIComponent(activeTicker)}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        if (!res.ok) {
          if (!cancelled) setQuote(null);
          return;
        }

        const data = (await res.json()) as Quote;
        if (!cancelled) {
          setQuote(data);
        }
      } catch {
        if (!cancelled) {
          setQuote(null);
        }
      }
    };

    fetchQuote();
    intervalId = setInterval(fetchQuote, 10_000);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeTicker]);

  return (
    <header className="app-topbar" role="banner">
      {/* Left: menu + logo */}
      <div className="topbar-left">
        {showMenuButton && (
          <button
            className="icon-btn menu-btn"
            aria-label="Open navigation"
            onClick={onToggleDrawer}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M3 6h18M3 12h18M3 18h18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
        <a className="app-brand" href="/" aria-label="Veilscope">
          <img
            className="logo logo-dark"
            src="/assets/img/logos/veilscope-logo-dark.svg"
            alt="Veilscope Logo"
          />
          <img
            className="logo logo-light"
            src="/assets/img/logos/veilscope-logo-light.svg"
            alt="Veilscope Logo"
          />
        </a>
      </div>

      {/* Center: stock strip (desktop only via CSS) */}
      <div className="topbar-center" aria-live="polite">
        {activeTicker && quote && (
          <div className="stock-pill">
            <span className="stock-symbol">{quote.symbol}</span>
            <span className="stock-dot">•</span>
            <span className="stock-price">${quote.price.toFixed(2)}</span>
            <span
              className={`stock-change ${
                quote.changePct >= 0 ? "pos" : "neg"
              }`}
            >
              {quote.changePct >= 0 ? "+" : ""}
              {quote.changePct.toFixed(2)}%
            </span>
          </div>
        )}
      </div>

      {/* Right: notifications + profile */}
      <div className="topbar-actions">
        <span className="action">
          <button
            ref={notifButtonRef}
            className="icon-btn"
            aria-label="Open notifications"
            aria-expanded={notifOpen}
            onClick={handleNotificationsClick}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6.5 8a5.5 5.5 0 0 1 11 0c0 1.9.5 3.2 1.1 4.2.4.7.9 1.4.9 2.3v.5H4v-.5c0-.9.5-1.6.9-2.3C6 11.2 6.5 9.9 6.5 8z" />
              <path d="M14 19a2 2 0 0 1-4 0" />
            </svg>
          </button>
          {notifOpen && (
            <div
              ref={notifRef}
              className="popover"
              role="dialog"
              aria-label="Notifications"
            >
              <div className="popover-card">
                <strong>Notifications</strong>
                <p>No new notifications.</p>
                <a href="#" className="mini-link">
                  View all
                </a>
              </div>
            </div>
          )}
        </span>

        <span className="action">
          <button
            ref={avatarButtonRef}
            className="avatar"
            aria-label="Account"
            aria-haspopup="dialog"
            aria-expanded={profileOpen}
            onClick={handleProfileClick}
          >
            <img
              className="profile-photo"
              src={avatarUrl ?? "https://placehold.co/32x32"}
              alt="User avatar"
            />
          </button>
          {profileOpen && (
            <div
              ref={profileRef}
              className="popover"
              role="dialog"
              aria-label="Profile"
            >
              <div className="popover-card profile-card">
                <img
                  className="profile-photo"
                  src={avatarUrl ?? "https://placehold.co/96x96"}
                  alt="User avatar"
                />
                <div className="profile-meta">
                  <strong>{name || email || "Loading…"}</strong>
                  <span className="profile-email">{email ?? ""}</span>

                  <Link
                    href="/settings"
                    className="mini-link profile-settings-btn"
                    onClick={handleProfileSettingsClick}
                  >
                    <span>Settings</span>
                  </Link>

                  {role === "admin" && ADMIN_LINKS.length > 0 && (
                    <nav className="profile-admin-nav" aria-label="Admin">
                      <span className="profile-admin-label">Admin</span>
                      <ul className="profile-admin-list">
                        {ADMIN_LINKS.map((link) => (
                          <li key={link.href}>
                            <Link
                              href={link.href}
                              className="mini-link profile-admin-link"
                              onClick={handleAdminLinkClick}
                            >
                              {link.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </nav>
                  )}

                  <form method="POST" action="/api/logout">
                    <button type="submit" className="mini-link signout-btn">
                      Sign out
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </span>
      </div>
    </header>
  );
}
