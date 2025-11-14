"use client";

import { useState } from "react";
import styles from "./AdminUpdatesClient.module.css";

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
  image: string;
  imageAlt: string;
  tagsCsv: string;
  featured: boolean;
  published: boolean;
  content: string;
};

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
  };
}

function toFormState(u: AdminUpdate): FormState {
  return {
    title: u.title,
    slug: u.slug,
    summary: u.summary,
    date: u.date,
    image: u.image,
    imageAlt: u.imageAlt,
    tagsCsv: u.tags.join(", "),
    featured: u.featured,
    published: u.published,
    content: u.content,
  };
}

function fromFormState(form: FormState) {
  return {
    title: form.title,
    slug: form.slug,
    summary: form.summary,
    date: form.date,
    image: form.image,
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
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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
    } catch (err) {
      console.error(err);
      setError("Network error while saving.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.adminContainer}>
      <header className={styles.header}>
        <h1 className="text-3xl font-extrabold tracking-tight">
          Project Updates <span className="font-normal text-[var(--ink-2)]">(Admin)</span>
        </h1>
        <p className="mt-2 max-w-2xl text-base text-[var(--ink-2)]">
          Manage the updates shown on the marketing site. Only{" "}
          <strong className="text-[var(--ink)]">published</strong> updates are visible publicly.
        </p>
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
                <li key={u.id}>
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
                    </div>
                    <div className="flex gap-1.5 text-xs flex-shrink-0 ml-2">
                      {u.featured && (
                        <span className="rounded-full bg-yellow-500/10 px-2 py-1 text-yellow-400 font-medium">
                          Featured
                        </span>
                      )}
                      {!u.published && (
                        <span className="rounded-full bg-gray-500/10 px-2 py-1 text-gray-400 font-medium">
                          Draft
                        </span>
                      )}
                    </div>
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
            <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              <strong className="font-semibold">Error:</strong> {error}
            </div>
          )}
          {message && (
            <div className="mb-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-400">
              <strong className="font-semibold">Success:</strong> {message}
            </div>
          )}

          <form className="grid gap-5" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-[var(--ink)]">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="h-10 rounded-lg border border-[var(--ui)] bg-[var(--panel-2)] px-3 text-sm text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                required
                placeholder="Enter update title"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-semibold text-[var(--ink)]">
                Slug{" "}
                <span className="text-xs font-normal text-[var(--ink-2)]">
                  (optional, auto-generated from title)
                </span>
              </label>
              <input
                type="text"
                className="h-10 rounded-lg border border-[var(--ui)] bg-[var(--panel-2)] px-3 text-sm text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
                value={form.slug}
                onChange={(e) =>
                  setForm((f) => ({ ...f, slug: e.target.value }))
                }
                placeholder="url-friendly-slug"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-semibold text-[var(--ink)]">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className="h-10 rounded-lg border border-[var(--ui)] bg-[var(--panel-2)] px-3 text-sm text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
                required
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-semibold text-[var(--ink)]">
                Summary <span className="text-red-500">*</span>
              </label>
              <textarea
                className="min-h-[80px] rounded-lg border border-[var(--ui)] bg-[var(--panel-2)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--accent)] resize-y"
                value={form.summary}
                onChange={(e) =>
                  setForm((f) => ({ ...f, summary: e.target.value }))
                }
                required
                placeholder="Brief summary of the update (shown in cards)"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-semibold text-[var(--ink)]">
                Tags{" "}
                <span className="text-xs font-normal text-[var(--ink-2)]">
                  (comma-separated)
                </span>
              </label>
              <input
                type="text"
                className="h-10 rounded-lg border border-[var(--ui)] bg-[var(--panel-2)] px-3 text-sm text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
                value={form.tagsCsv}
                onChange={(e) =>
                  setForm((f) => ({ ...f, tagsCsv: e.target.value }))
                }
                placeholder="AI, Product, Release"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-[var(--ink)]">
                  Hero Image URL
                </label>
                <input
                  type="text"
                  className="h-10 rounded-lg border border-[var(--ui)] bg-[var(--panel-2)] px-3 text-sm text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  value={form.image}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, image: e.target.value }))
                  }
                  placeholder="/assets/img/updates/image.jpg"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-semibold text-[var(--ink)]">
                  Image Alt Text
                </label>
                <input
                  type="text"
                  className="h-10 rounded-lg border border-[var(--ui)] bg-[var(--panel-2)] px-3 text-sm text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  value={form.imageAlt}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, imageAlt: e.target.value }))
                  }
                  placeholder="Describe the image"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-semibold text-[var(--ink)]">
                Content <span className="text-xs font-normal text-[var(--ink-2)]">(HTML)</span>
              </label>
              <textarea
                className="min-h-[200px] rounded-lg border border-[var(--ui)] bg-[var(--panel-2)] px-3 py-2 text-sm font-mono text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--accent)] resize-y"
                value={form.content}
                onChange={(e) =>
                  setForm((f) => ({ ...f, content: e.target.value }))
                }
                placeholder="<p>Long-form HTML content goes here...</p>"
              />
            </div>

            <div className="flex gap-6 text-sm pt-2">
              <label className="inline-flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, featured: e.target.checked }))
                  }
                />
                <span className="font-medium">Featured Update</span>
              </label>

              <label className="inline-flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, published: e.target.checked }))
                  }
                />
                <span className="font-medium">Published</span>
              </label>
            </div>

            <div className="pt-2 border-t border-[var(--ui)]">
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
    </div>
  );
}