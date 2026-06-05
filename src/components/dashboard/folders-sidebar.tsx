"use client";

import { Folder, FolderPlus, Mic, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FolderType {
    id: string;
    name: string;
    color: string;
    parentId?: string | null;
}

interface FolderNode extends FolderType {
    children: FolderNode[];
}

interface FoldersSidebarProps {
    folders: FolderType[];
    selectedFolderId: string;
    onSelectFolder: (id: string) => void;
    onManageFolders: () => void;
}

function buildFolderTree(foldersList: FolderType[]): FolderNode[] {
    const nodesMap = new Map<string, FolderNode>();
    const roots: FolderNode[] = [];

    for (const f of foldersList) {
        nodesMap.set(f.id, { ...f, children: [] });
    }

    for (const f of foldersList) {
        const node = nodesMap.get(f.id);
        if (!node) continue;
        if (f.parentId) {
            const parent = nodesMap.get(f.parentId);
            if (parent) {
                parent.children.push(node);
            } else {
                roots.push(node);
            }
        } else {
            roots.push(node);
        }
    }

    const sortNodes = (nodes: FolderNode[]) => {
        nodes.sort((a, b) => a.name.localeCompare(b.name));
        for (const n of nodes) {
            sortNodes(n.children);
        }
    };
    sortNodes(roots);

    return roots;
}

function FolderItemNode({
    node,
    depth,
    selectedFolderId,
    onSelectFolder,
}: {
    node: FolderNode;
    depth: number;
    selectedFolderId: string;
    onSelectFolder: (id: string) => void;
}) {
    return (
        <div className="space-y-1">
            <button
                type="button"
                onClick={() => onSelectFolder(node.id)}
                className={cn(
                    "w-full flex items-center gap-3 py-1.5 rounded-lg text-sm transition-colors text-left",
                    selectedFolderId === node.id
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
                style={{ paddingLeft: `${12 + depth * 12}px` }}
            >
                <div
                    className="size-2 rounded-full border border-black/10 dark:border-white/10 shrink-0"
                    style={{
                        backgroundColor: `hsl(${node.color})`,
                    }}
                />
                <span className="truncate">{node.name}</span>
            </button>
            {node.children.length > 0 && (
                <div className="space-y-1">
                    {node.children.map((child) => (
                        <FolderItemNode
                            key={child.id}
                            node={child}
                            depth={depth + 1}
                            selectedFolderId={selectedFolderId}
                            onSelectFolder={onSelectFolder}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export function FoldersSidebar({
    folders,
    selectedFolderId,
    onSelectFolder,
    onManageFolders,
}: FoldersSidebarProps) {
    const folderTree = buildFolderTree(folders);

    return (
        <Card className="h-full border bg-card text-card-foreground shadow-sm">
            <CardContent className="flex h-full flex-col gap-4 p-4">
                <div className="flex items-center justify-between px-2 py-1">
                    <div className="flex items-center gap-2">
                        <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Folder className="size-4" />
                        </div>
                        <h2 className="text-sm font-bold tracking-tight text-foreground">
                            Library
                        </h2>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={onManageFolders}
                        title="Manage Folders"
                        aria-label="Manage folders"
                    >
                        <Settings className="size-4 text-muted-foreground hover:text-foreground" />
                    </Button>
                </div>

                <nav className="flex-1 space-y-1 overflow-y-auto">
                    <button
                        type="button"
                        onClick={() => onSelectFolder("all")}
                        className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                            selectedFolderId === "all"
                                ? "bg-primary/10 text-primary font-semibold"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                    >
                        <Mic className="size-4" />
                        <span>All Recordings</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => onSelectFolder("uncategorized")}
                        className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                            selectedFolderId === "uncategorized"
                                ? "bg-primary/10 text-primary font-semibold"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                    >
                        <Folder className="size-4 text-muted-foreground/80" />
                        <span>Uncategorized</span>
                    </button>

                    <div className="py-2">
                        <p className="px-3 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider mb-2">
                            Folders
                        </p>
                        {folders.length === 0 ? (
                            <p className="px-3 py-1 text-xs text-muted-foreground/75 italic">
                                No custom folders yet.
                            </p>
                        ) : (
                            <div className="space-y-1">
                                {folderTree.map((node) => (
                                    <FolderItemNode
                                        key={node.id}
                                        node={node}
                                        depth={0}
                                        selectedFolderId={selectedFolderId}
                                        onSelectFolder={onSelectFolder}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </nav>

                <Button
                    onClick={onManageFolders}
                    variant="outline"
                    size="sm"
                    className="w-full justify-center gap-2 mt-auto"
                >
                    <FolderPlus className="size-4" />
                    <span>Manage Folders</span>
                </Button>
            </CardContent>
        </Card>
    );
}
