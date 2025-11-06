"use client";

import React, { useState } from "react";
import type { Tab } from "@/types/ui";

interface TopbarProps {
  tabs: Tab[];
  activeKey: string;
  onActivate: (key: string) => void;
  onClose: (key: string) => void;
  onToggleDrawer: () => void;
  onOpenSettings: () => void;
}

export default function Topbar({
  tabs,
  activeKey,
  onActivate,
  onClose,
  onToggleDrawer,
  onOpenSettings,
}: TopbarProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleNotificationsClick = () => {
    setProfileOpen(false);
    setNotifOpen((o) => !o);
  };
  const handleProfileClick = () => {
    setNotifOpen(false);
    setProfileOpen((o) => !o);
  };

  return (
    <header className="app-topbar" role="banner">
      <div className="topbar-left">
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

      <div className="tabbar" role="tablist" aria-label="Open items">
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
      </div>

      <div className="topbar-actions">
        <span className="action">
          <button
            className="icon-btn"
            aria-label="Open settings"
            onClick={onOpenSettings}
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
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 ..."></path>
            </svg>
          </button>
        </span>

        <span className="action">
          <button
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
              <path d="M6.5 8a5.5 5.5 0 0 1 11 0c0 1.9.5 3.2 1.1 4.2.4.7.9 1.4 .9 2.3v.5H4v-.5c0-.9.5-1.6 .9-2.3C6 11.2 6.5 9.9 6.5 8z" />
              <path d="M14 19a2 2 0 0 1-4 0" />
            </svg>
          </button>
          {notifOpen && (
            <div className="popover" role="dialog" aria-label="Notifications">
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
            className="avatar"
            aria-label="Account"
            aria-haspopup="dialog"
            aria-expanded={profileOpen}
            onClick={handleProfileClick}
          >
            <img className="profile-photo" src="https://placehold.co/32x32" alt="User avatar" />
          </button>
          {profileOpen && (
            <div className="popover" role="dialog" aria-label="Profile">
              <div className="popover-card profile-card">
                <img className="profile-photo" src="https://placehold.co/96x96" alt="" />
                <div className="profile-meta">
                  <strong>John Smith</strong>
                  <span className="profile-email">john.smith@example.com</span>
                  <a href="#" className="mini-link">Manage account</a>
                </div>
              </div>
            </div>
          )}
        </span>
      </div>
    </header>
  );
}
