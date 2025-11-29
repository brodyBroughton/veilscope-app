// app/admin/AdminTopbar.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./AdminShell.module.css";

type AdminTopbarProps = {
  email: string | null;
  avatarUrl?: string | null;
  name?: string | null;
};

const ADMIN_LINKS = [
  {
    href: "/admin/updates",
    label: "Project Updates",
  },
  // Add more admin pages here later if needed
];

export default function AdminTopbar({
  email,
  avatarUrl,
  name,
}: AdminTopbarProps) {
  const [profileOpen, setProfileOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement | null>(null);
  const avatarButtonRef = useRef<HTMLButtonElement | null>(null);

  const initials = (() => {
    if (name && name.trim().length > 0) {
      return name
        .trim()
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("");
    }

    if (email && email.length > 0) {
      return email
        .split("@")[0]
        .split(/[._-]/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("");
    }

    return "AD";
  })();

  const handleProfileClick = () => {
    setProfileOpen((open) => !open);
  };

  const handleProfileSettingsClick: React.MouseEventHandler<
    HTMLAnchorElement
  > = () => {
    setProfileOpen(false);
    // navigation handled by <Link>
  };

  const handleAdminLinkClick: React.MouseEventHandler<HTMLAnchorElement> = () => {
    setProfileOpen(false);
  };

  // Close the profile menu when clicking outside the avatar/popover
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

  return (
    <header className={styles.adminTopbar} role="banner">
      <div className={styles.adminTopbarLeft}>
        <Link href="/" className={styles.adminBrand} aria-label="Veilscope home">
          <img
            className={styles.adminLogo}
            src="/assets/img/logos/veilscope-logo-light.svg"
            alt="Veilscope Logo"
          />
          <span className={styles.adminBadge} aria-label="Admin area">
            Admin
          </span>
        </Link>
      </div>

      <div className={styles.adminTopbarRight}>
        <button
          ref={avatarButtonRef}
          className="avatar"
          aria-label="Account"
          aria-haspopup="dialog"
          aria-expanded={profileOpen}
          onClick={handleProfileClick}
        >
          {avatarUrl ? (
            <img className="profile-photo" src={avatarUrl} alt="User avatar" />
          ) : (
            <span className={styles.adminAvatarInitials}>{initials}</span>
          )}
        </button>

        {profileOpen && (
          <div
            ref={profileRef}
            className="popover"
            role="dialog"
            aria-label="Profile"
          >
            <div className="popover-card profile-card">
              {avatarUrl ? (
                <img className="profile-photo" src={avatarUrl} alt="" />
              ) : (
                <div className={styles.adminAvatar}>
                  <span className={styles.adminAvatarInitials}>{initials}</span>
                </div>
              )}
              <div className="profile-meta">
                <strong>{name || email || "Admin"}</strong>
                <span className="profile-email">{email ?? ""}</span>

                <Link
                  href="/settings"
                  className="mini-link profile-settings-btn"
                  onClick={handleProfileSettingsClick}
                >
                  <span>Settings</span>
                </Link>

                {ADMIN_LINKS.length > 0 && (
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
      </div>
    </header>
  );
}
