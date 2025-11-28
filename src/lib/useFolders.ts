"use client";

import useSWR from "swr";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    let msg = `Request failed with status ${res.status}`;
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch {
      // ignore JSON parse failures
    }
    throw new Error(msg);
  }
  return res.json();
};

export type Item = {
  id: string;
  title: string;
  ticker: string | null;
  type: string | null;
};

export type FolderNode = {
  id: string;
  name: string;
  parentId: string | null;
  sortOrder?: number; // exists in DB
  children: FolderNode[];
  items: Item[];
};

export function useFolders() {
  const { data, error, mutate } = useSWR<FolderNode[]>("/api/folders", fetcher);
  const isLoading = !data && !error;

  async function createFolder(name: string, parentId: string | null = null) {
    const res = await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, parentId }),
    });

    if (!res.ok) {
      let msg = `Failed to create folder (status ${res.status})`;
      try {
        const data = await res.json();
        if (data?.error) msg = data.error;
      } catch {
        // ignore
      }
      console.error("createFolder error:", msg);
      throw new Error(msg);
    }

    await mutate();
  }

  async function renameFolder(id: string, name: string) {
    const res = await fetch(`/api/folders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (!res.ok) {
      let msg = `Failed to rename folder (status ${res.status})`;
      try {
        const data = await res.json();
        if (data?.error) msg = data.error;
      } catch {}
      console.error("renameFolder error:", msg);
      throw new Error(msg);
    }

    await mutate();
  }

  async function deleteFolder(id: string) {
    const res = await fetch(`/api/folders/${id}`, { method: "DELETE" });

    if (!res.ok) {
      let msg = `Failed to delete folder (status ${res.status})`;
      try {
        const data = await res.json();
        if (data?.error) msg = data.error;
      } catch {}
      console.error("deleteFolder error:", msg);
      throw new Error(msg);
    }

    await mutate();
  }

  // Move a single folder to be a child of parentId (drop onto folder)
  async function moveFolder(id: string, parentId: string | null) {
    const res = await fetch(`/api/folders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parentId }),
    });

    if (!res.ok) {
      let msg = `Failed to move folder (status ${res.status})`;
      try {
        const data = await res.json();
        if (data?.error) msg = data.error;
      } catch {}
      console.error("moveFolder error:", msg);
      throw new Error(msg);
    }

    await mutate();
  }

  // Bulk update (parentId + sortOrder) for reordering like VS Code.
  async function bulkUpdateFolders(
    updates: { id: string; parentId: string | null; sortOrder: number }[]
  ) {
    const results = await Promise.all(
      updates.map(({ id, parentId, sortOrder }) =>
        fetch(`/api/folders/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ parentId, sortOrder }),
        })
      )
    );

    const bad = results.find((r) => !r.ok);
    if (bad) {
      let msg = `Bulk update failed (status ${bad.status})`;
      try {
        const data = await bad.json();
        if (data?.error) msg = data.error;
      } catch {}
      console.error("bulkUpdateFolders error:", msg);
      throw new Error(msg);
    }

    await mutate();
  }

  return {
    folders: data ?? [],
    isLoading,
    error,
    createFolder,
    renameFolder,
    deleteFolder,
    moveFolder,
    bulkUpdateFolders,
  };
}
