"use client";

import React from "react";
import { useFolders, FolderNode } from "@/lib/useFolders";

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  onOpenTicker: (key: string, label: string) => void;
};

// ------- helpers to prevent dropping into own subtree -------

function findFolderById(nodes: FolderNode[], id: string): FolderNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findFolderById(node.children, id);
    if (found) return found;
  }
  return null;
}

function containsInChildren(nodes: FolderNode[], id: string): boolean {
  for (const node of nodes) {
    if (node.id === id) return true;
    if (containsInChildren(node.children, id)) return true;
  }
  return false;
}

/**
 * Returns true if `candidateId` is in the subtree under `ancestorId`.
 * Used to prevent making a folder a child of its own descendant.
 */
function isDescendant(tree: FolderNode[], ancestorId: string, candidateId: string): boolean {
  const ancestor = findFolderById(tree, ancestorId);
  if (!ancestor) return false;
  return containsInChildren(ancestor.children, candidateId);
}

/** Get siblings for a given parent (null = root level) */
function getSiblings(tree: FolderNode[], parentId: string | null): FolderNode[] {
  if (parentId === null) return tree;
  const parent = findFolderById(tree, parentId);
  return parent ? parent.children : [];
}

// -----------------------------------------------------------

type ActiveDropZone = { parentId: string | null; index: number } | null;

export default function Drawer({ open, onClose, onOpenTicker }: DrawerProps) {
  const {
    folders,
    isLoading,
    createFolder,
    renameFolder,
    deleteFolder,
    moveFolder,
    bulkUpdateFolders,
  } = useFolders();

  const [contextMenu, setContextMenu] = React.useState<{
    visible: boolean;
    x: number;
    y: number;
    folder: FolderNode | null;
  }>({
    visible: false,
    x: 0,
    y: 0,
    folder: null,
  });

  const [draggedFolderId, setDraggedFolderId] = React.useState<string | null>(null);
  const [dropTargetFolderId, setDropTargetFolderId] = React.useState<string | null>(null);
  const [activeDropZone, setActiveDropZone] = React.useState<ActiveDropZone>(null);

  const closeOnMobile = () => {
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 991px)").matches) {
      onClose();
    }
  };

  // Close context menu on any document click
  React.useEffect(() => {
    function handleClick() {
      setContextMenu((prev) => ({ ...prev, visible: false, folder: null }));
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  // ---- basic folder actions ----

  const handleNewRootFolder = async () => {
    const name = window.prompt("New folder name?");
    if (!name) return;
    await createFolder(name, null);
  };

  const handleRename = async (id: string, currentName: string) => {
    const name = window.prompt("Rename folder", currentName);
    if (!name || name === currentName) return;
    await renameFolder(id, name);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this folder and its contents?")) return;
    await deleteFolder(id);
  };

  // ---- context menu (right click only) ----

  const openContextMenuAtEvent = (event: React.MouseEvent, folder: FolderNode) => {
    event.preventDefault();
    event.stopPropagation();

    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      folder,
    });
  };

  const handleContextAction = (action: "rename" | "delete") => {
    const folder = contextMenu.folder;
    if (!folder) return;

    setContextMenu((prev) => ({ ...prev, visible: false, folder: null }));

    switch (action) {
      case "rename":
        void handleRename(folder.id, folder.name);
        break;
      case "delete":
        void handleDelete(folder.id);
        break;
    }
  };

  // ---- drag & drop handlers ----

  const handleDragStart = (id: string) => {
    setDraggedFolderId(id);
    setDropTargetFolderId(null);
    setActiveDropZone(null);
  };

  const handleDragEnterFolder = (id: string) => {
    if (!draggedFolderId || draggedFolderId === id) return;
    setDropTargetFolderId(id);
    setActiveDropZone(null);
  };

  const handleDragEnd = () => {
    setDraggedFolderId(null);
    setDropTargetFolderId(null);
    setActiveDropZone(null);
  };

  // Drop ON a folder summary → become subfolder of that folder
  const handleDropOnFolder = async (targetFolderId: string) => {
    if (!draggedFolderId || draggedFolderId === targetFolderId) {
      handleDragEnd();
      return;
    }

    // Prevent making a folder child of its own descendant
    if (isDescendant(folders, draggedFolderId, targetFolderId)) {
      handleDragEnd();
      return;
    }

    try {
      await moveFolder(draggedFolderId, targetFolderId);
    } finally {
      handleDragEnd();
    }
  };

  // Drop BETWEEN folders (on a drop zone) → reorder like VS Code
  const handleReorderDrop = async (parentId: string | null, targetIndex: number) => {
    if (!draggedFolderId) {
      handleDragEnd();
      return;
    }

    // Prevent reparenting into own descendant (if moving to a new parent)
    if (parentId && isDescendant(folders, draggedFolderId, parentId)) {
      handleDragEnd();
      return;
    }

    const draggedFolder = findFolderById(folders, draggedFolderId);
    if (!draggedFolder) {
      handleDragEnd();
      return;
    }

    const siblings = getSiblings(folders, parentId);
    if (!siblings.length) {
      // No siblings yet: just move to empty parent
      try {
        await bulkUpdateFolders([{ id: draggedFolderId, parentId, sortOrder: 0 }]);
      } finally {
        handleDragEnd();
      }
      return;
    }

    // Remove dragged folder if it's already among these siblings
    const filtered = siblings.filter((f) => f.id !== draggedFolderId);

    // Clamp index into range
    const insertIndex = Math.max(0, Math.min(targetIndex, filtered.length));

    // Insert dragged folder into new position
    filtered.splice(insertIndex, 0, draggedFolder);

    // Build updates with new sortOrder
    const updates = filtered.map((f, idx) => ({
      id: f.id,
      parentId,
      sortOrder: idx,
    }));

    try {
      await bulkUpdateFolders(updates);
    } finally {
      handleDragEnd();
    }
  };

  return (
    <>
      {open && <div className="scrim" onClick={onClose} />}
      <aside
        id="appDrawer"
        className={`app-drawer ${open ? "is-open" : ""}`}
        role="complementary"
        aria-label="Explorer"
        aria-hidden={!open}
        tabIndex={-1}
      >
        <div className="drawer-head">
          <div className="search">
            <input
              id="tickerSearch"
              type="search"
              inputMode="search"
              placeholder="Search Ticker…"
              aria-label="Search ticker"
            />
          </div>
          <div className="drawer-actions">
            <button
              className="mini-btn"
              type="button"
              aria-label="New Folder"
              onClick={handleNewRootFolder}
            >
              New Folder
            </button>
            <button className="mini-btn" type="button" aria-label="New Analysis">
              New Analysis
            </button>
          </div>
        </div>

        <nav className="tree" aria-label="Saved items">
          {isLoading && <p>Loading folders…</p>}
          {!isLoading && folders.length === 0 && (
            <p className="empty-state">No folders yet. Create one to get started.</p>
          )}

          <FolderList
            nodes={folders}
            parentId={null}
            onOpenTicker={onOpenTicker}
            onOpenContextMenu={openContextMenuAtEvent}
            closeOnMobile={closeOnMobile}
            onDragStart={handleDragStart}
            onDragEnterFolder={handleDragEnterFolder}
            onDragEnd={handleDragEnd}
            onDropOnFolder={handleDropOnFolder}
            onReorderDrop={handleReorderDrop}
            draggedFolderId={draggedFolderId}
            dropTargetFolderId={dropTargetFolderId}
            activeDropZone={activeDropZone}
            setActiveDropZone={setActiveDropZone}
          />
        </nav>

        {contextMenu.visible && contextMenu.folder && (
          <div
            className="context-menu"
            style={{
              position: "fixed",
              top: contextMenu.y,
              left: contextMenu.x,
              zIndex: 9999,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" onClick={() => handleContextAction("rename")}>
              Rename
            </button>
            <button type="button" onClick={() => handleContextAction("delete")}>
              Delete
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

// ---------- Folder list & rows ----------

type FolderListProps = {
  nodes: FolderNode[];
  parentId: string | null;
  onOpenTicker: (key: string, label: string) => void;
  onOpenContextMenu: (e: React.MouseEvent, folder: FolderNode) => void;
  closeOnMobile: () => void;

  onDragStart: (id: string) => void;
  onDragEnterFolder: (id: string) => void;
  onDragEnd: () => void;
  onDropOnFolder: (targetId: string) => void;

  onReorderDrop: (parentId: string | null, index: number) => void;
  draggedFolderId: string | null;
  dropTargetFolderId: string | null;
  activeDropZone: ActiveDropZone;
  setActiveDropZone: React.Dispatch<React.SetStateAction<ActiveDropZone>>;
};

function FolderList({
  nodes,
  parentId,
  onOpenTicker,
  onOpenContextMenu,
  closeOnMobile,
  onDragStart,
  onDragEnterFolder,
  onDragEnd,
  onDropOnFolder,
  onReorderDrop,
  draggedFolderId,
  dropTargetFolderId,
  activeDropZone,
  setActiveDropZone,
}: FolderListProps) {
  if (!nodes.length) return null;

  return (
    <ul>
      {nodes.map((node, index) => (
        <React.Fragment key={node.id}>
          {/* Drop zone BEFORE this folder */}
          <DropZone
            positionIndex={index}
            parentId={parentId}
            draggedFolderId={draggedFolderId}
            activeDropZone={activeDropZone}
            setActiveDropZone={setActiveDropZone}
            onReorderDrop={onReorderDrop}
          />

          <FolderNodeRow
            node={node}
            parentId={parentId}
            onOpenTicker={onOpenTicker}
            onOpenContextMenu={onOpenContextMenu}
            closeOnMobile={closeOnMobile}
            onDragStart={onDragStart}
            onDragEnterFolder={onDragEnterFolder}
            onDragEnd={onDragEnd}
            onDropOnFolder={onDropOnFolder}
            draggedFolderId={draggedFolderId}
            dropTargetFolderId={dropTargetFolderId}
            onReorderDrop={onReorderDrop}
            activeDropZone={activeDropZone}
            setActiveDropZone={setActiveDropZone}
          />

          {/* After last item, add a trailing drop zone */}
          {index === nodes.length - 1 && (
            <DropZone
              positionIndex={index + 1}
              parentId={parentId}
              draggedFolderId={draggedFolderId}
              activeDropZone={activeDropZone}
              setActiveDropZone={setActiveDropZone}
              onReorderDrop={onReorderDrop}
            />
          )}
        </React.Fragment>
      ))}
    </ul>
  );
}

type DropZoneProps = {
  parentId: string | null;
  positionIndex: number;
  draggedFolderId: string | null;
  activeDropZone: ActiveDropZone;
  setActiveDropZone: React.Dispatch<React.SetStateAction<ActiveDropZone>>;
  onReorderDrop: (parentId: string | null, index: number) => void;
};

function DropZone({
  parentId,
  positionIndex,
  draggedFolderId,
  activeDropZone,
  setActiveDropZone,
  onReorderDrop,
}: DropZoneProps) {
  const isActive =
    activeDropZone &&
    activeDropZone.parentId === parentId &&
    activeDropZone.index === positionIndex;

  if (!draggedFolderId) {
    // don't render interactive drop zone if nothing is being dragged
    return <li className="drop-zone-placeholder" aria-hidden="true" />;
  }

  return (
    <li
      className={`drop-zone ${isActive ? "drop-zone-active" : ""}`}
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!draggedFolderId) return;
        setActiveDropZone({ parentId, index: positionIndex });
      }}
      onDragOver={(e) => {
        if (!draggedFolderId) return;
        e.preventDefault();
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!draggedFolderId) return;
        onReorderDrop(parentId, positionIndex);
      }}
    />
  );
}

type FolderNodeRowProps = {
  node: FolderNode;
  parentId: string | null;
  onOpenTicker: (key: string, label: string) => void;
  onOpenContextMenu: (e: React.MouseEvent, folder: FolderNode) => void;
  closeOnMobile: () => void;

  onDragStart: (id: string) => void;
  onDragEnterFolder: (id: string) => void;
  onDragEnd: () => void;
  onDropOnFolder: (targetId: string) => void;

  draggedFolderId: string | null;
  dropTargetFolderId: string | null;

  onReorderDrop: (parentId: string | null, index: number) => void;
  activeDropZone: ActiveDropZone;
  setActiveDropZone: React.Dispatch<React.SetStateAction<ActiveDropZone>>;
};

function FolderNodeRow({
  node,
  parentId,
  onOpenTicker,
  onOpenContextMenu,
  closeOnMobile,
  onDragStart,
  onDragEnterFolder,
  onDragEnd,
  onDropOnFolder,
  draggedFolderId,
  dropTargetFolderId,
  onReorderDrop,
  activeDropZone,
  setActiveDropZone,
}: FolderNodeRowProps) {
  const isDropTarget =
    dropTargetFolderId === node.id && draggedFolderId !== null && draggedFolderId !== node.id;

  return (
    <li onContextMenu={(e) => onOpenContextMenu(e, node)}>
      <details open>
        <summary
          className={`folder-summary ${isDropTarget ? "folder-drop-target" : ""}`}
          draggable
          onDragStart={(e) => {
            e.stopPropagation();
            onDragStart(node.id);
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDragEnterFolder(node.id);
          }}
          onDragOver={(e) => {
            if (!draggedFolderId || draggedFolderId === node.id) return;
            e.preventDefault(); // allow drop onto folder
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDropOnFolder(node.id);
          }}
          onDragEnd={(e) => {
            e.stopPropagation();
            onDragEnd();
          }}
        >
          <span>{node.name}</span>
        </summary>

        {/* Items inside this folder */}
        {node.items.length > 0 && (
          <ul>
            {node.items.map((item) => (
              <li key={item.id}>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    const label = item.title || item.ticker || "Item";
                    onOpenTicker(item.ticker ?? "", label);
                    closeOnMobile();
                  }}
                >
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
        )}

        {/* Subfolders */}
        {node.children.length > 0 && (
          <FolderList
            nodes={node.children}
            parentId={node.id}
            onOpenTicker={onOpenTicker}
            onOpenContextMenu={onOpenContextMenu}
            closeOnMobile={closeOnMobile}
            onDragStart={onDragStart}
            onDragEnterFolder={onDragEnterFolder}
            onDragEnd={onDragEnd}
            onDropOnFolder={onDropOnFolder}
            onReorderDrop={onReorderDrop}
            draggedFolderId={draggedFolderId}
            dropTargetFolderId={dropTargetFolderId}
            activeDropZone={activeDropZone}
            setActiveDropZone={setActiveDropZone}
          />
        )}
      </details>
    </li>
  );
}
