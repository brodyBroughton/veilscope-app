// src/app/settings/SettingsShell.tsx
"use client";

import Topbar from "@/components/Topbar";
import SettingsClient from "./SettingsClient";

type SettingsShellProps = {
  initialProfile: {
    name: string;
    email: string;
    image: string | null;
  };
};

export default function SettingsShell({ initialProfile }: SettingsShellProps) {
  // No drawer on the settings page; handlers are no-ops here.
  const noop = () => {};

  return (
    <div className="settings-app-shell">
      <Topbar
        onToggleDrawer={noop}
        onOpenSettings={noop}
        activeTicker={null}
        showMenuButton={false}   /* <<< Hides hamburger on this page only */
      />
      <SettingsClient initialProfile={initialProfile} />
    </div>
  );
}
