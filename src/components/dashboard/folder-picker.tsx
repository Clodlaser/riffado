"use client";

import { Check, Folder, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FolderType {
    id: string;
    name: string;
    color: string;
    parentId?: string | null;
}

interface FolderPickerProps {
    currentFolderId: string | null | undefined;
    folders: FolderType[];
    onAssign: (folderId: string | null) => void;
    disabled?: boolean;
}

function getFolderPath(folder: FolderType, allFolders: FolderType[]): string {
    const parts: string[] = [folder.name];
    let current = folder;
    while (current.parentId) {
        const parent = allFolders.find((f) => f.id === current.parentId);
        if (!parent) break;
        parts.unshift(parent.name);
        current = parent;
    }
    return parts.join(" / ");
}

export function FolderPicker({
    currentFolderId,
    folders,
    onAssign,
    disabled = false,
}: FolderPickerProps) {
    const currentFolder = currentFolderId
        ? folders.find((f) => f.id === currentFolderId)
        : null;

    const currentFolderPath = currentFolder
        ? getFolderPath(currentFolder, folders)
        : "";

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-2 font-medium"
                    disabled={disabled}
                    title={currentFolderPath || "Uncategorized"}
                >
                    {currentFolder ? (
                        <>
                            <div
                                className="size-2 rounded-full border border-black/10 dark:border-white/10 shrink-0"
                                style={{
                                    backgroundColor: `hsl(${currentFolder.color})`,
                                }}
                            />
                            <span className="max-w-[120px] truncate">
                                {currentFolder.name}
                            </span>
                        </>
                    ) : (
                        <>
                            <Folder className="size-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground italic">
                                Uncategorized
                            </span>
                        </>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="w-[220px] max-h-[300px] overflow-y-auto"
            >
                <DropdownMenuLabel className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">
                    Move to...
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {folders.map((folder) => {
                    const path = getFolderPath(folder, folders);
                    return (
                        <DropdownMenuItem
                            key={folder.id}
                            onSelect={() => onAssign(folder.id)}
                            className="flex items-center justify-between"
                            title={path}
                        >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div
                                    className="size-2 rounded-full border border-black/10 dark:border-white/10 shrink-0"
                                    style={{
                                        backgroundColor: `hsl(${folder.color})`,
                                    }}
                                />
                                <span className="truncate text-xs">{path}</span>
                            </div>
                            {currentFolderId === folder.id && (
                                <Check className="size-3.5 shrink-0 ml-2" />
                            )}
                        </DropdownMenuItem>
                    );
                })}
                {folders.length > 0 && <DropdownMenuSeparator />}
                <DropdownMenuItem
                    onSelect={() => onAssign(null)}
                    className="italic text-muted-foreground"
                >
                    <div className="flex items-center gap-2">
                        <FolderOpen className="size-3.5 text-muted-foreground" />
                        <span>None (Uncategorized)</span>
                    </div>
                    {!currentFolderId && <Check className="size-3.5 ml-auto" />}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
