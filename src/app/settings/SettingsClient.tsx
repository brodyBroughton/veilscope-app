// src/app/settings/SettingsClient.tsx
"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./SettingsClient.module.css";
import Link from "next/link";

type SettingsSectionKey = "general" | "appearance" | "billing" | "security";

const SECTIONS: { key: SettingsSectionKey; label: string }[] = [
  { key: "general", label: "General" },
  { key: "appearance", label: "Appearance" },
  { key: "billing", label: "Billing" },
  { key: "security", label: "Security" },
];

const MAX_NAME_LENGTH = 50;

type SettingsClientProps = {
  initialProfile: {
    name: string;
    email: string;
    image: string | null;
  };
};

const APP_HOME_PATH =
  process.env.NEXT_PUBLIC_APP_HOME_PATH ?? "/";

export default function SettingsClient({ initialProfile }: SettingsClientProps) {
  const router = useRouter();

  const [activeSection, setActiveSection] =
    useState<SettingsSectionKey>("general");

  // General/profile state
  const [fullName, setFullName] = useState(initialProfile.name);
  const [email] = useState(initialProfile.email);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    initialProfile.image
  );
  const [generalSaving, setGeneralSaving] = useState(false);
  const [generalMessage, setGeneralMessage] = useState<string | null>(null);

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [avatarRemoving, setAvatarRemoving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Appearance / theme state (local only – wiring later)
  const [theme, setTheme] = useState<"system" | "light" | "dark">("system");

  // Security state
  const [securitySaving, setSecuritySaving] = useState(false);
  const [securityMessage, setSecurityMessage] = useState<string | null>(null);

  // Security password fields – fully controlled
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleBackClick = () => {
    router.push(APP_HOME_PATH);
  };

  const handleAvatarButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange: React.ChangeEventHandler<HTMLInputElement> = async (
    e
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError(null);
    setGeneralMessage(null);
    setAvatarUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to upload avatar");
      }

      setAvatarPreview(data.url as string);
      setShowRemoveConfirm(false);
      setGeneralMessage("Profile photo updated.");
    } catch (err: any) {
      console.error(err);
      setAvatarError(err?.message || "Upload failed.");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleRequestRemoveAvatar = () => {
    setAvatarError(null);
    setGeneralMessage(null);
    setShowRemoveConfirm(true);
  };

  const handleConfirmRemoveAvatar = async () => {
  setAvatarError(null);
  setGeneralMessage(null);
  setAvatarRemoving(true);

  try {
    const res = await fetch("/api/profile/avatar", {
      method: "DELETE",
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error((data as any).error || "Failed to remove avatar");
    }

    setAvatarPreview(null);
    setShowRemoveConfirm(false);
    setGeneralMessage("Profile photo removed.");
  } catch (err: any) {
    console.error(err);
    setAvatarError(err?.message || "Failed to remove avatar.");
  } finally {
    setAvatarRemoving(false);
  }
};


  const handleCancelRemoveAvatar = () => {
    setShowRemoveConfirm(false);
  };

    const handleSaveGeneral: React.FormEventHandler = async (e) => {
    e.preventDefault();
    setGeneralSaving(true);
    setGeneralMessage(null);
    setAvatarError(null);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: fullName,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error((data as any).error || "Failed to save profile");
      }

      // Optionally sync local state with what the server returns
      if (data?.name && typeof data.name === "string") {
        setFullName(data.name);
      }

      setGeneralMessage("Profile settings saved.");
    } catch (err: any) {
      console.error(err);
      setGeneralMessage(err?.message || "Failed to save profile.");
    } finally {
      setGeneralSaving(false);
    }
  };

  const handleSaveAppearance: React.FormEventHandler = async (e) => {
    e.preventDefault();
    console.log("Saving appearance settings", { theme });
  };

  const handleSaveSecurity: React.FormEventHandler = async (e) => {
    e.preventDefault();
    setSecuritySaving(true);
    setSecurityMessage(null);

    try {
      console.log("Saving security settings (stub)", {
        currentPassword,
        newPassword,
        confirmPassword,
      });

      await new Promise((resolve) => setTimeout(resolve, 600));

      setSecurityMessage("Security settings saved (stub).");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } finally {
      setSecuritySaving(false);
    }
  };

  const handleDeleteAccount = () => {
    const confirmed = window.confirm(
      "This will permanently delete your account when wired to the backend. Continue?"
    );
    if (!confirmed) return;

    console.log("Account deletion requested (stub)");
  };

  const renderSection = () => {
    switch (activeSection) {
      case "general":
        return (
          <section
            className={styles.section}
            aria-labelledby="settings-general-heading"
          >
            <header className={styles.sectionHeader}>
              <h2 id="settings-general-heading">Profile</h2>
              <p>Manage your basic account information.</p>
            </header>

            {generalMessage && (
              <div className={styles.sectionBanner}>{generalMessage}</div>
            )}
            {avatarError && (
              <div
                className={`${styles.sectionBanner} ${styles.sectionBannerError}`}
              >
                {avatarError}
              </div>
            )}

            <form className={styles.sectionForm} onSubmit={handleSaveGeneral}>
              <div className={styles.avatarRow}>
                <div className={styles.avatarWrapper}>
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Profile preview"
                      className={styles.avatarImg}
                    />
                  ) : (
                    <div className={styles.avatarFallback}>
                      <span>
                        {fullName
                          ? fullName
                              .split(" ")
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((p) => p[0]?.toUpperCase())
                              .join("")
                          : "VS"}
                      </span>
                    </div>
                  )}
                </div>
                <div className={styles.avatarMeta}>
                  <span className={styles.inputLabel}>Profile photo</span>
                  <p className={styles.muted}>
                    This will be shown in the app header.
                  </p>
                  <div className={styles.avatarActions}>
                    <button
                      type="button"
                      className={styles.buttonSecondary}
                      onClick={handleAvatarButtonClick}
                      disabled={avatarUploading || avatarRemoving}
                    >
                      {avatarUploading ? "Uploading…" : "Change photo"}
                    </button>
                    {avatarPreview && !avatarUploading && (
                      <button
                        type="button"
                        className={styles.buttonGhost}
                        onClick={handleRequestRemoveAvatar}
                        disabled={avatarRemoving}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className={styles.hiddenFileInput}
                    onChange={handleAvatarChange}
                  />
                </div>
              </div>

              {showRemoveConfirm && (
                <div className={styles.avatarRemoveConfirm}>
                  <div>
                    <div className={styles.avatarRemoveConfirmTitle}>
                      Remove profile photo?
                    </div>
                    <p className={styles.avatarRemoveConfirmBody}>
                      This will remove your current avatar from your Veilscope
                      account. You can always upload a new one later.
                    </p>
                  </div>
                  <div className={styles.avatarRemoveConfirmActions}>
                    <button
                      type="button"
                      className={styles.buttonDanger}
                      onClick={handleConfirmRemoveAvatar}
                      disabled={avatarRemoving}
                    >
                      {avatarRemoving ? "Removing…" : "Yes, remove photo"}
                    </button>
                    <button
                      type="button"
                      className={styles.buttonGhost}
                      onClick={handleCancelRemoveAvatar}
                      disabled={avatarRemoving}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className={styles.fieldGroup}>
  <label className={styles.inputLabel}>
    Full name<span className={styles.required}>*</span>
  </label>
  <input
    type="text"
    value={fullName}
    onChange={(e) => setFullName(e.target.value)}
    className={styles.textInput}
    placeholder="Your name"
    required
    maxLength={MAX_NAME_LENGTH}
  />
  <p className={styles.muted}>
    {fullName.length}/{MAX_NAME_LENGTH} characters
  </p>
</div>

              <div className={styles.fieldGroup}>
                <label className={styles.inputLabel}>Email</label>
                <input
                  type="email"
                  value={email}
                  readOnly
                  disabled
                  className={`${styles.textInput} ${styles.textInputReadonly}`}
                />
                <p className={styles.muted}>
                  Email changes are managed by support for now.
                </p>
              </div>

              <div className={styles.actionsRow}>
                <button
                  type="submit"
                  className={styles.buttonPrimary}
                  disabled={generalSaving}
                >
                  {generalSaving ? "Saving…" : "Save profile"}
                </button>
              </div>
            </form>
          </section>
        );

      case "appearance":
        return (
          <section
            className={styles.section}
            aria-labelledby="settings-appearance-heading"
          >
            <header className={styles.sectionHeader}>
              <h2 id="settings-appearance-heading">Appearance</h2>
              <p>Control theme preferences across the Veilscope app.</p>
            </header>

            <form className={styles.sectionForm} onSubmit={handleSaveAppearance}>
              <div className={styles.fieldGroup}>
  <span className={styles.inputLabel}>Theme</span>
  <p className={styles.muted}>
    These are placeholders; we&apos;ll wire them into the theme system shortly.
  </p>

  <div
    className={styles.themePillGroup}
    role="radiogroup"
    aria-label="Theme"
  >
    <button
      type="button"
      role="radio"
      aria-checked={theme === "system"}
      className={`${styles.themePill} ${
        theme === "system" ? styles.themePillActive : ""
      }`}
      onClick={() => setTheme("system")}
    >
      System
    </button>

    <button
      type="button"
      role="radio"
      aria-checked={theme === "light"}
      className={`${styles.themePill} ${
        theme === "light" ? styles.themePillActive : ""
      }`}
      onClick={() => setTheme("light")}
    >
      Light
    </button>

    <button
      type="button"
      role="radio"
      aria-checked={theme === "dark"}
      className={`${styles.themePill} ${
        theme === "dark" ? styles.themePillActive : ""
      }`}
      onClick={() => setTheme("dark")}
    >
      Dark
    </button>
  </div>
</div>


              <div className={styles.actionsRow}>
                <button type="submit" className={styles.buttonPrimary}>
                  Save appearance
                </button>
              </div>
            </form>
          </section>
        );

      case "billing":
        return (
          <section
            className={styles.section}
            aria-labelledby="settings-billing-heading"
          >
            <header className={styles.sectionHeader}>
              <h2 id="settings-billing-heading">Billing</h2>
              <p>Plan, invoices, and payment methods.</p>
            </header>

            <div className={styles.sectionBody}>
              <div className={styles.cardRow}>
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>Current plan</h3>
                  <p className={styles.muted}>
                    You&apos;re currently on a placeholder plan. We&apos;ll
                    surface real subscription details here once billing is
                    connected.
                  </p>
                  <button
                    type="button"
                    className={styles.buttonSecondary}
                    onClick={() =>
                      console.log("Manage subscription clicked (stub)")
                    }
                  >
                    Manage subscription
                  </button>
                </div>
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>Billing email</h3>
                  <p className={styles.muted}>
                    Invoices and receipts will be sent to:
                  </p>
                  <p className={styles.billingEmail}>
                    {email || "billing@example.com"}
                  </p>
                  <p className={styles.muted}>
                    This will be editable once billing is wired in.
                  </p>
                </div>
              </div>
            </div>
          </section>
        );

            case "security":
        return (
          <section
            className={styles.section}
            aria-labelledby="settings-security-heading"
          >
            <header className={styles.sectionHeader}>
              <h2 id="settings-security-heading">Security</h2>
              <p>Keep your account protected.</p>
            </header>

            <div className={styles.sectionBody}>
              <div className={styles.fieldGroup}>
                <p className={styles.muted}>
                  To change your password, use the dedicated reset flow. You
                  don&apos;t need to be signed in to use it.
                </p>
              </div>

              <div className={styles.actionsRow}>
                <Link href="/forgot-password" className={styles.buttonSecondary}>
                  Reset password
                </Link>
              </div>

              <div className={styles.dangerZone}>
                <h3>Danger zone</h3>
                <p>
                  Deleting your account will remove access to Veilscope app
                  features and may remove associated data. This action will be
                  permanent once wired to the backend.
                </p>
                <button
                  type="button"
                  className={styles.buttonDanger}
                  onClick={handleDeleteAccount}
                >
                  Delete account
                </button>
              </div>
            </div>
          </section>
        );
  };
  }
  return (
    <div className={styles.settingsPage}>
      <div className={styles.settingsShell}>
        {/* Prominent back-to-app pill, on its own row */}
        <div className={styles.settingsBackRow}>
          <button
            type="button"
            className={styles.backToAppButton}
            onClick={handleBackClick}
          >
            ← Back to app
          </button>
        </div>

        <div className={styles.settingsLayout}>
          {/* Left: sections nav */}
          <nav className={styles.sidebar} aria-label="Settings sections">
            {SECTIONS.map((section) => (
              <button
                key={section.key}
                type="button"
                className={`${styles.sidebarItem} ${
                  activeSection === section.key
                    ? styles.sidebarItemActive
                    : ""
                }`}
                onClick={() => setActiveSection(section.key)}
              >
                <span>{section.label}</span>
              </button>
            ))}
          </nav>

          {/* Right: active section */}
          <div className={styles.contentPane}>{renderSection()}</div>
        </div>
      </div>
    </div>
  );
}