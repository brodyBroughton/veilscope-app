// src/app/admin/updates/AdminUpdatesClient.tsx
"use client";

import { useState } from "react";
import styles from "./AdminUpdatesClient.module.css";
import { slugify } from "@/lib/slugify";

type AdminUpdate = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  date: string; // YYYY-MM-DD
  image: string;
  imageAlt: string;
  tags: string[];
  featured: boolean;
  published: boolean;
  content: string;
};

interface Props {
  initialUpdates: AdminUpdate[];
}

type FormState = {
  title: string;
  slug: string;
  summary: string;
  date: string;
  image: string; // filename in the UI
  imageAlt: string;
  tagsCsv: string;
  featured: boolean;
  published: boolean;
  content: string;
  slugTouched: boolean;
};

const IMAGE_BASE_PATH = "/assets/img/updates/";
const TAG_OPTIONS = ["Weekly Report", "Brody", "Jacob"];

function emptyFormState(): FormState {
  return {
    title: "",
    slug: "",
    summary: "",
    date: new Date().toISOString().slice(0, 10),
    image: "",
    imageAlt: "",
    tagsCsv: "",
    featured: false,
    published: true,
    content: "",
    slugTouched: false,
  };
}

function toFormState(u: AdminUpdate): FormState {
  // For editing: show only the filename if the image uses our base path
  const image =
    u.image && u.image.startsWith(IMAGE_BASE_PATH)
      ? u.image.slice(IMAGE_BASE_PATH.length)
      : u.image;

  return {
    title: u.title,
    slug: u.slug,
    summary: u.summary,
    date: u.date,
    image,
    imageAlt: u.imageAlt,
    tagsCsv: u.tags.join(", "),
    featured: u.featured,
    published: u.published,
    content: u.content,
    slugTouched: !!u.slug,
  };
}

function fromFormState(form: FormState) {
  const filename = form.image.trim();

  const image =
    filename.length === 0
      ? ""
      : // If the admin pastes a full path or URL, respect it; otherwise prefix base path.
        filename.startsWith("/") || filename.startsWith("http")
      ? filename
      : `${IMAGE_BASE_PATH}${filename}`;

  return {
    title: form.title,
    slug: form.slug,
    summary: form.summary,
    date: form.date,
    image,
    imageAlt: form.imageAlt,
    tags: form.tagsCsv
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    featured: form.featured,
    published: form.published,
    content: form.content,
  };
}

export default function AdminUpdatesClient({ initialUpdates }: Props) {
  const [updates, setUpdates] = useState<AdminUpdate[]>(initialUpdates);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialUpdates[0]?.id ?? null
  );
  const [form, setForm] = useState<FormState>(() =>
    initialUpdates[0] ? toFormState(initialUpdates[0]) : emptyFormState()
  );
  const [saving, setSaving] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Delete confirmation state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteTitle, setConfirmDeleteTitle] = useState<string>("");
  const [deleting, setDeleting] = useState(false);

  // Derived tags array used by the tag pills
  const selectedTags: string[] = form.tagsCsv
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  function handleSelect(update: AdminUpdate) {
    setSelectedId(update.id);
    setForm(toFormState(update));
    setError(null);
    setMessage(null);
  }

  function handleNew() {
    setSelectedId(null);
    setForm(emptyFormState());
    setError(null);
    setMessage(null);
  }

  // Title change: auto-generate slug unless slug was manually touched
  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newTitle = e.target.value;

    setForm((prev) => {
      const next: FormState = {
        ...prev,
        title: newTitle,
        slug: prev.slugTouched ? prev.slug : slugify(newTitle),
      };

      setHasUnsavedChanges(true);

      if (selectedId) {
        const merged = fromFormState(next);
        setUpdates((prevUpdates) =>
          prevUpdates.map((u) =>
            u.id === selectedId ? { ...u, ...merged } : u
          )
        );
      }

      return next;
    });
  }

  // Slug change: mark as touched and normalize
  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;

    setForm((prev) => {
      const next: FormState = {
        ...prev,
        slugTouched: true,
        slug: slugify(raw),
      };

      setHasUnsavedChanges(true);

      if (selectedId) {
        const merged = fromFormState(next);
        setUpdates((prevUpdates) =>
          prevUpdates.map((u) =>
            u.id === selectedId ? { ...u, ...merged } : u
          )
        );
      }

      return next;
    });
  }

  // Tags: toggle a tag on/off using pill buttons
  function toggleTag(tag: string) {
    setForm((prev) => {
      const currentTags = prev.tagsCsv
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      let nextTags: string[];
      if (currentTags.includes(tag)) {
        nextTags = currentTags.filter((t) => t !== tag);
      } else {
        nextTags = [...currentTags, tag];
      }

      const next: FormState = {
        ...prev,
        tagsCsv: nextTags.join(", "),
      };

      setHasUnsavedChanges(true);

      if (selectedId) {
        const merged = fromFormState(next);
        setUpdates((prevUpdates) =>
          prevUpdates.map((u) =>
            u.id === selectedId ? { ...u, ...merged } : u
          )
        );
      }

      return next;
    });
  }

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      setHasUnsavedChanges(true);

      // Keep selected update in the list in sync (for "Save all" semantics)
      if (selectedId) {
        const merged = fromFormState(next);
        setUpdates((prevUpdates) =>
          prevUpdates.map((u) =>
            u.id === selectedId ? { ...u, ...merged } : u
          )
        );
      }

      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const payload = fromFormState(form);

      let res: Response;
      if (selectedId) {
        res = await fetch("/api/admin/updates", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id: selectedId, ...payload }),
        });
      } else {
        res = await fetch("/api/admin/updates", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to save update.");
        return;
      }

      const saved: AdminUpdate = await res.json();

      if (selectedId) {
        setUpdates((prev) =>
          prev.map((u) => (u.id === saved.id ? saved : u))
        );
        setMessage("Update saved successfully!");
      } else {
        setUpdates((prev) => [saved, ...prev]);
        setSelectedId(saved.id);
        setForm(toFormState(saved));
        setMessage("Update created successfully!");
      }

      setHasUnsavedChanges(false);
    } catch (err) {
      console.error(err);
      setError("Network error while saving.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAll() {
    if (!updates.length) return;

    setSavingAll(true);
    setError(null);
    setMessage(null);

    try {
      const savedResults: AdminUpdate[] = [];

      // Persist each update as it currently exists in local state.
      for (const u of updates) {
        const res = await fetch("/api/admin/updates", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            id: u.id,
            title: u.title,
            slug: u.slug,
            summary: u.summary,
            date: u.date,
            image: u.image,
            imageAlt: u.imageAlt,
            tags: u.tags,
            featured: u.featured,
            published: u.published,
            content: u.content,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to save some updates.");
        }

        const saved = (await res.json()) as AdminUpdate;
        savedResults.push(saved);
      }

      setUpdates(savedResults);
      setHasUnsavedChanges(false);
      setMessage("All changes saved successfully!");
    } catch (err: any) {
      console.error("Save all error:", err);
      setError(err.message || "Failed to save all changes.");
    } finally {
      setSavingAll(false);
    }
  }

  function handleDeleteClick(update: AdminUpdate) {
    setConfirmDeleteId(update.id);
    setConfirmDeleteTitle(update.title);
  }

  async function handleConfirmDelete() {
    if (!confirmDeleteId) return;

    setDeleting(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/updates", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: confirmDeleteId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete update.");
      }

      setUpdates((prev) => {
        const next = prev.filter((u) => u.id !== confirmDeleteId);

        // If we just deleted the one being edited, move selection
        if (selectedId === confirmDeleteId) {
          if (next.length > 0) {
            const first = next[0];
            setSelectedId(first.id);
            setForm(toFormState(first));
          } else {
            setSelectedId(null);
            setForm(emptyFormState());
          }
        }

        return next;
      });

      setMessage("Update deleted successfully.");
      setConfirmDeleteId(null);
      setHasUnsavedChanges(false);
    } catch (err: any) {
      console.error("Delete error:", err);
      setError(err.message || "Failed to delete update.");
    } finally {
      setDeleting(false);
    }
  }

  function handleCancelDelete() {
    setConfirmDeleteId(null);
  }

  return (
    <div className={styles.adminContainer}>
      <header className={styles.header}>
        <div className={styles.headerMain}>
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">
              Project Updates{" "}
              <span className="font-normal text-[var(--ink-2)]">(Admin)</span>
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-relaxed text-[var(--ink-2)]">
              Manage the updates shown on the marketing site. Only{" "}
              <strong className="text-[var(--ink)]">published</strong> updates
              are visible publicly.
            </p>
          </div>
          <div className={styles.headerActions}>
            {hasUnsavedChanges && (
              <span className={styles.unsavedBadge}>Unsaved changes</span>
            )}
            <button
              type="button"
              className={styles.buttonPrimary}
              onClick={handleSaveAll}
              disabled={savingAll || !updates.length}
            >
              {savingAll ? "Saving all…" : "Save all changes"}
            </button>
          </div>
        </div>
      </header>
      <div className={styles.gridTwoCols}>
        {/* Left: list */}
        <section className={styles.listSection}>
          <div className={styles.listSectionHeader}>
        <h2 className="text-base font-bold">Existing Updates</h2>
        <button
          type="button"
          onClick={handleNew}
          className="text-sm font-semibold text-[var(--accent)] hover:underline transition-all"
        >
          + New Update
        </button>
          </div>

          {updates.length === 0 ? (
        <p className="text-sm text-[var(--ink-2)] py-4 text-center">
          No updates yet. Create your first one!
        </p>
          ) : (
        <ul className={styles.listItems}>
  {updates.map((u) => (
    <li key={u.id} className={styles.listItemRow}>
      <button
        type="button"
        onClick={() => handleSelect(u)}
        className={`${styles.listItemButton} ${
          selectedId === u.id ? styles.listItemSelected : ""
        }`}
      >
        <div className="flex-1 min-w-0">
          <div className="truncate font-medium">{u.title}</div>

          <div className="text-xs text-[var(--ink-2)] mt-0.5">
            {u.date} · {u.slug}
          </div>

          {(u.featured || !u.published) && (
            <div className="mt-1 flex flex-wrap gap-1.5 text-xs">
              {u.featured && (
                <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-[0.7rem] text-yellow-400 font-medium whitespace-nowrap">
                  Featured
                </span>
              )}

              {!u.published && (
                <span className="rounded-full bg-gray-500/10 px-2 py-0.5 text-[0.7rem] text-gray-300 font-medium whitespace-nowrap">
                  Draft
                </span>
              )}
            </div>
          )}
        </div>
      </button>

      <button
        type="button"
        className={styles.deleteButton}
        onClick={() => handleDeleteClick(u)}
      >
        Delete
      </button>
    </li>
  ))}
</ul>
          )}
        </section>

        {/* Right: form */}
        <section className={styles.formSection}>
          <h2 className={styles.formHeader}>
            {selectedId ? "Edit Update" : "Create New Update"}
          </h2>

          {error && (
            <div className="mb-5 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3.5 text-sm text-red-400">
              <strong className="font-semibold">Error:</strong> {error}
            </div>
          )}
          {message && (
            <div className="mb-5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-3.5 text-sm text-emerald-400">
              <strong className="font-semibold">Success:</strong> {message}
            </div>
          )}

          <form className="grid gap-6" onSubmit={handleSubmit}>
            <div className="grid gap-2.5">
              <label className="text-sm font-semibold text-[var(--ink)]">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="h-11 rounded-lg border border-[var(--ui)] bg-[var(--panel-2)] px-3.5 text-sm text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
                value={form.title}
                onChange={handleTitleChange}
                required
                placeholder="Enter update title"
              />
            </div>

            <div className="grid gap-2.5">
              <label className="text-sm font-semibold text-[var(--ink)]">
                Slug{" "}
                <span className="text-xs font-normal text-[var(--ink-2)]">
                  (optional, auto-generated from title)
                </span>
              </label>
              <input
                type="text"
                className="h-11 rounded-lg border border-[var(--ui)] bg-[var(--panel-2)] px-3.5 text-sm text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
                value={form.slug}
                onChange={handleSlugChange}
                placeholder="week-3-progress-report-brody"
              />
            </div>

            <div className="grid gap-2.5">
              <label className="text-sm font-semibold text-[var(--ink)]">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className="h-11 rounded-lg border border-[var(--ui)] bg-[var(--panel-2)] px-3.5 text-sm text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
                value={form.date}
                onChange={(e) => updateForm("date", e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2.5">
              <label className="text-sm font-semibold text-[var(--ink)]">
                Summary <span className="text-red-500">*</span>
              </label>
              <textarea
                className="min-h-[90px] rounded-lg border border-[var(--ui)] bg-[var(--panel-2)] px-3.5 py-2.5 text-sm text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--accent)] resize-y"
                value={form.summary}
                onChange={(e) => updateForm("summary", e.target.value)}
                required
                placeholder="Brief summary of the update (shown in cards)"
              />
            </div>

            {/* Tags as pill buttons */}
            <div className="grid gap-2.5">
              <label className="text-sm font-semibold text-[var(--ink)]">
                Tags{" "}
                <span className="text-xs font-normal text-[var(--ink-2)]">
                  (click to toggle, multiple allowed)
                </span>
              </label>
              <div className="flex flex-wrap gap-2">
                {TAG_OPTIONS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={[
                        "px-3 py-1.5 rounded-full text-xs font-medium border outline-none transition-colors",
                        isSelected
                          ? "bg-[var(--accent)] border-[var(--accent)] text-white"
                          : "bg-[var(--panel-2)] border-[var(--ui)] text-[var(--ink-2)] hover:border-[var(--accent)] hover:text-[var(--ink)]",
                      ].join(" ")}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="grid gap-2.5">
                <label className="text-sm font-semibold text-[var(--ink)]">
                  Hero Image Filename
                  <span className="text-xs font-normal text-[var(--ink-2)] ml-1">
                    (e.g. hero-update.png)
                  </span>
                </label>
                <input
                  type="text"
                  className="h-11 rounded-lg border border-[var(--ui)] bg-[var(--panel-2)] px-3.5 text-sm text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  value={form.image}
                  onChange={(e) => updateForm("image", e.target.value)}
                  placeholder="hero-update.png"
                />
              </div>

              <div className="grid gap-2.5">
                <label className="text-sm font-semibold text-[var(--ink)]">
                  Image Alt Text
                </label>
                <input
                  type="text"
                  className="h-11 rounded-lg border border-[var(--ui)] bg-[var(--panel-2)] px-3.5 text-sm text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  value={form.imageAlt}
                  onChange={(e) => updateForm("imageAlt", e.target.value)}
                  placeholder="Describe the image"
                />
              </div>
            </div>

            <div className="grid gap-2.5">
              <label className="text-sm font-semibold text-[var(--ink)]">
                Content{" "}
                <span className="text-xs font-normal text-[var(--ink-2)]">
                  (HTML)
                </span>
              </label>
              <textarea
                className="min-h-[240px] rounded-lg border border-[var(--ui)] bg-[var(--panel-2)] px-3.5 py-2.5 text-sm font-mono text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--accent)] resize-y"
                value={form.content}
                onChange={(e) => updateForm("content", e.target.value)}
                placeholder="<p>Long-form HTML content goes here...</p>"
              />
            </div>

            <div className="flex gap-8 text-sm pt-3">
              <label className="inline-flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => updateForm("featured", e.target.checked)}
                />
                <span className="font-medium">Featured Update</span>
              </label>

              <label className="inline-flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => updateForm("published", e.target.checked)}
                />
                <span className="font-medium">Published</span>
              </label>
            </div>

            <div className="pt-3 border-t border-[var(--ui)] mt-2">
              <button
                type="submit"
                disabled={saving}
                className={styles.buttonPrimary}
              >
                {saving
                  ? "Saving..."
                  : selectedId
                  ? "Save Changes"
                  : "Create Update"}
              </button>
            </div>
          </form>
        </section>
      </div>

      {/* Delete confirmation modal */}
      {confirmDeleteId && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Delete this update?</h3>
            <p className={styles.modalBody}>
              "{confirmDeleteTitle}" will be permanently removed. This action
              cannot be undone.
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.buttonDanger}
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Yes, delete"}
              </button>
              <button
                type="button"
                className={styles.buttonGhost}
                onClick={handleCancelDelete}
                disabled={deleting}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
