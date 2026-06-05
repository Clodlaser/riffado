"use client";

import { ArrowDownAZ, Folder, Rows3, Search, X } from "lucide-react";
import type * as React from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

export type SortOrder = "newest" | "oldest" | "name";
export type ListDensity = "comfortable" | "compact";

export function RecordingListToolbar({
    query,
    onQueryChange,
    onEnterSelectFirst,
    searchRef,
    filteredCount,
    totalCount,
    sortOrder,
    onSortOrderChange,
    density,
    onDensityChange,
    folders = [],
    selectedFolderId = "all",
    onSelectFolder,
}: {
    query: string;
    onQueryChange: (next: string) => void;
    onEnterSelectFirst: () => void;
    searchRef: React.RefObject<HTMLInputElement | null>;
    filteredCount: number;
    totalCount: number;
    sortOrder: SortOrder;
    onSortOrderChange: (next: SortOrder) => void;
    density: ListDensity;
    onDensityChange: (next: ListDensity) => void;
    folders?: { id: string; name: string; color: string }[];
    selectedFolderId?: string;
    onSelectFolder?: (id: string) => void;
}) {
    return (
        <div className="flex flex-col gap-2 border-b p-3">
            <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    ref={searchRef}
                    value={query}
                    onChange={(e) => onQueryChange(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            onEnterSelectFirst();
                        }
                    }}
                    placeholder="Search recordings, transcripts..."
                    className="h-9 pl-8 pr-8"
                    aria-label="Search recordings"
                />
                {query && (
                    <button
                        type="button"
                        onClick={() => onQueryChange("")}
                        aria-label="Clear search"
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
                    >
                        <X className="size-4" />
                    </button>
                )}
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                    {filteredCount}
                    {query ? " matching" : ""} of {totalCount} recording
                    {totalCount !== 1 ? "s" : ""}
                </span>
                <div className="flex items-center gap-1">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs lg:hidden"
                                aria-label="Filter by folder"
                            >
                                <Folder className="size-3.5 mr-1" />
                                <span className="truncate max-w-[80px]">
                                    {selectedFolderId === "all"
                                        ? "All"
                                        : folders.find(
                                              (f) => f.id === selectedFolderId,
                                          )?.name || "Folder"}
                                </span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Folder Filter</DropdownMenuLabel>
                            <DropdownMenuRadioGroup
                                value={selectedFolderId}
                                onValueChange={(v) => onSelectFolder?.(v)}
                            >
                                <DropdownMenuRadioItem value="all">
                                    All Recordings
                                </DropdownMenuRadioItem>
                                {folders.map((folder) => (
                                    <DropdownMenuRadioItem
                                        key={folder.id}
                                        value={folder.id}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="size-2 rounded-full border border-black/10 dark:border-white/10"
                                                style={{
                                                    backgroundColor: `hsl(${folder.color})`,
                                                }}
                                            />
                                            <span>{folder.name}</span>
                                        </div>
                                    </DropdownMenuRadioItem>
                                ))}
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                aria-label="Sort"
                            >
                                <ArrowDownAZ className="size-3.5" />
                                <span>
                                    {sortOrder === "newest"
                                        ? "Newest"
                                        : sortOrder === "oldest"
                                          ? "Oldest"
                                          : "Name"}
                                </span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                            <DropdownMenuRadioGroup
                                value={sortOrder}
                                onValueChange={(v) =>
                                    onSortOrderChange(v as SortOrder)
                                }
                            >
                                <DropdownMenuRadioItem value="newest">
                                    Newest first
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="oldest">
                                    Oldest first
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="name">
                                    Name
                                </DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                aria-label="Density"
                            >
                                <Rows3 className="size-3.5" />
                                <span>
                                    {density === "compact"
                                        ? "Compact"
                                        : "Comfortable"}
                                </span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Density</DropdownMenuLabel>
                            <DropdownMenuRadioGroup
                                value={density}
                                onValueChange={(v) =>
                                    onDensityChange(v as ListDensity)
                                }
                            >
                                <DropdownMenuRadioItem value="comfortable">
                                    Comfortable
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="compact">
                                    Compact
                                </DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    );
}
