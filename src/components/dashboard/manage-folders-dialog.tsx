"use client";

import { Check, Folder, FolderPlus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FolderType {
    id: string;
    name: string;
    color: string;
}

interface ManageFoldersDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    folders: FolderType[];
    onComplete?: () => void;
}

const COLOR_SWATCHES = [
    { label: "Primary Green", value: "142 36% 45%" },
    { label: "Warm Amber", value: "35 48% 52%" },
    { label: "Deep Clay", value: "16 28% 48%" },
    { label: "Soft Green", value: "142 36% 65%" },
    { label: "Soft Amber", value: "35 48% 72%" },
    { label: "Soft Clay", value: "16 28% 68%" },
    { label: "Soft Blue", value: "199 43% 48%" },
    { label: "Muted Rose", value: "346 45% 55%" },
];

export function ManageFoldersDialog({
    open,
    onOpenChange,
    folders,
    onComplete,
}: ManageFoldersDialogProps) {
    const [name, setName] = useState("");
    const [selectedColor, setSelectedColor] = useState(COLOR_SWATCHES[0].value);
    const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleSelectFolderForEdit = (folder: FolderType) => {
        setEditingFolderId(folder.id);
        setName(folder.name);
        setSelectedColor(folder.color);
    };

    const handleCancelEdit = () => {
        setEditingFolderId(null);
        setName("");
        setSelectedColor(COLOR_SWATCHES[0].value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = name.trim();
        if (!trimmedName) {
            toast.error("Folder name is required");
            return;
        }

        setIsSaving(true);
        try {
            if (editingFolderId) {
                // Update
                const res = await fetch(`/api/folders/${editingFolderId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: trimmedName,
                        color: selectedColor,
                    }),
                });
                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    throw new Error(
                        errorData.message || "Failed to update folder",
                    );
                }
                toast.success("Folder updated");
            } else {
                // Create
                const res = await fetch("/api/folders", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: trimmedName,
                        color: selectedColor,
                    }),
                });
                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    throw new Error(
                        errorData.message || "Failed to create folder",
                    );
                }
                toast.success("Folder created");
            }

            setName("");
            setEditingFolderId(null);
            onComplete?.();
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Error saving folder",
            );
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteFolder = async (folderId: string) => {
        if (
            !confirm(
                "Are you sure you want to delete this folder? Recordings inside this folder will not be deleted, but will be moved to Uncategorized.",
            )
        ) {
            return;
        }

        try {
            const res = await fetch(`/api/folders/${folderId}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Delete failed");
            toast.success("Folder deleted");
            if (editingFolderId === folderId) {
                handleCancelEdit();
            }
            onComplete?.();
        } catch {
            toast.error("Failed to delete folder");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-hidden p-0 md:max-w-[800px] lg:max-w-[900px] flex flex-col">
                <div className="px-6 py-4 border-b bg-muted/20 flex justify-between items-center shrink-0">
                    <div>
                        <DialogTitle className="text-lg font-bold">
                            Manage Folders
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                            Organize your workspace with custom folders and
                            colors.
                        </DialogDescription>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-[400px]">
                    {/* Left Panel: Active folders list */}
                    <div className="w-full md:w-1/2 p-6 border-r overflow-y-auto bg-muted/5">
                        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                            <Folder className="size-4 text-primary" />
                            <span>Active Folders ({folders.length})</span>
                        </h3>

                        {folders.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                                <Folder className="size-8 opacity-40 mb-2" />
                                <p className="text-xs">
                                    No folders yet. Create one on the right!
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {folders.map((f) => (
                                    <div
                                        key={f.id}
                                        className="group flex items-center justify-between p-3 bg-card rounded-lg border hover:border-primary/50 transition-all"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div
                                                className="size-3 rounded-full border border-black/10 dark:border-white/10 shrink-0"
                                                style={{
                                                    backgroundColor: `hsl(${f.color})`,
                                                }}
                                            />
                                            <span className="font-medium text-sm truncate">
                                                {f.name}
                                            </span>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon-sm"
                                                onClick={() =>
                                                    handleSelectFolderForEdit(f)
                                                }
                                                title="Edit"
                                                aria-label={`Edit ${f.name}`}
                                            >
                                                <span className="text-xs font-semibold">
                                                    Edit
                                                </span>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon-sm"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() =>
                                                    handleDeleteFolder(f.id)
                                                }
                                                title="Delete"
                                                aria-label={`Delete ${f.name}`}
                                            >
                                                <Trash2 className="size-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Panel: Create/Edit form */}
                    <div className="w-full md:w-1/2 p-6 overflow-y-auto">
                        <h3 className="text-sm font-semibold mb-6 flex items-center gap-2">
                            <FolderPlus className="size-4 text-tertiary" />
                            <span>
                                {editingFolderId
                                    ? "Edit Folder"
                                    : "Create New Folder"}
                            </span>
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label
                                    htmlFor="folder-name"
                                    className="text-xs font-semibold"
                                >
                                    Folder Name
                                </Label>
                                <Input
                                    id="folder-name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., Professional, Personal, Ideas"
                                    maxLength={30}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold block mb-2">
                                    Folder Color
                                </Label>
                                <div className="grid grid-cols-4 gap-2">
                                    {COLOR_SWATCHES.map((swatch) => (
                                        <button
                                            key={swatch.value}
                                            type="button"
                                            onClick={() =>
                                                setSelectedColor(swatch.value)
                                            }
                                            className="h-10 rounded-md border flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                                            style={{
                                                backgroundColor: `hsl(${swatch.value} / 0.15)`,
                                                borderColor:
                                                    selectedColor ===
                                                    swatch.value
                                                        ? `hsl(${swatch.value})`
                                                        : "transparent",
                                                color: `hsl(${swatch.value})`,
                                            }}
                                            title={swatch.label}
                                        >
                                            <div
                                                className="size-3.5 rounded-full border border-black/10 dark:border-white/10 flex items-center justify-center shrink-0"
                                                style={{
                                                    backgroundColor: `hsl(${swatch.value})`,
                                                }}
                                            >
                                                {selectedColor ===
                                                    swatch.value && (
                                                    <Check className="size-2.5 text-white" />
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Preview */}
                            <div className="pt-4 border-t">
                                <Label className="text-xs font-semibold text-muted-foreground block mb-2">
                                    Live Preview
                                </Label>
                                <div className="p-3 bg-muted/40 rounded-xl border flex items-center justify-between shadow-sm max-w-[240px]">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div
                                            className="size-8 rounded-lg flex items-center justify-center border shrink-0"
                                            style={{
                                                backgroundColor: `hsl(${selectedColor} / 0.1)`,
                                                borderColor: `hsl(${selectedColor} / 0.2)`,
                                                color: `hsl(${selectedColor})`,
                                            }}
                                        >
                                            <Folder className="size-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-bold text-sm truncate">
                                                {name.trim() || "Folder Name"}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground leading-none mt-0.5">
                                                0 items
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t">
                                {editingFolderId && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={handleCancelEdit}
                                        disabled={isSaving}
                                    >
                                        Cancel Edit
                                    </Button>
                                )}
                                <Button
                                    type="submit"
                                    disabled={isSaving}
                                    className="gap-2"
                                >
                                    {isSaving ? "Saving…" : "Save Folder"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
