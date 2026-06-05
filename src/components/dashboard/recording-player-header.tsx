"use client";

import { AudioWaveform, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FolderPicker } from "@/components/dashboard/folder-picker";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { formatBytes } from "@/lib/format-bytes";
import { formatDateTime } from "@/lib/format-date";
import { formatDuration } from "@/lib/format-duration";
import type { Recording } from "@/types/recording";

interface Props {
    recording: Recording;
    /** Resolved playback duration in seconds (0 when not yet loaded). */
    duration: number;
    scrubberStyle: "waveform" | "slider";
    waveformStatus: "idle" | "ready" | "decoding" | "skipped" | "error";
    folders?: { id: string; name: string; color: string }[];
    onFolderChange?: () => void;
    onDecodeWaveform: () => void;
}

export function RecordingPlayerHeader({
    recording,
    duration,
    scrubberStyle,
    waveformStatus,
    folders = [],
    onFolderChange,
    onDecodeWaveform,
}: Props) {
    const handleAssignFolder = async (folderId: string | null) => {
        try {
            const res = await fetch(`/api/recordings/${recording.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ folderId }),
            });
            if (!res.ok) throw new Error("Failed to assign folder");
            toast.success(
                folderId ? "Recording moved to folder" : "Recording unassigned",
            );
            onFolderChange?.();
        } catch {
            toast.error("Failed to move recording");
        }
    };

    const metaParts: string[] = [
        formatDateTime(recording.startTime, "relative"),
        formatDuration(duration || recording.duration / 1000),
        formatBytes(recording.filesize),
    ];

    return (
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-3">
            <div className="min-w-0 flex-1 flex flex-col gap-1">
                <CardTitle className="truncate text-lg">
                    {recording.filename}
                </CardTitle>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    {metaParts.map((part, i) => (
                        <span
                            key={part}
                            className="inline-flex items-center gap-2"
                        >
                            {i > 0 && (
                                <span aria-hidden="true" className="opacity-40">
                                    ·
                                </span>
                            )}
                            <span>{part}</span>
                        </span>
                    ))}
                    {scrubberStyle === "waveform" &&
                        waveformStatus === "decoding" && (
                            <span className="inline-flex items-center gap-1">
                                <span aria-hidden="true" className="opacity-40">
                                    ·
                                </span>
                                <Loader2 className="size-3 animate-spin" />
                                Analyzing audio…
                            </span>
                        )}
                    {scrubberStyle === "waveform" &&
                        waveformStatus === "skipped" && (
                            <button
                                type="button"
                                onClick={onDecodeWaveform}
                                className="inline-flex items-center gap-1 underline-offset-2 hover:text-foreground hover:underline"
                                title="Decode waveform in your browser (may take a few seconds)"
                            >
                                <span aria-hidden="true" className="opacity-40">
                                    ·
                                </span>
                                <AudioWaveform className="size-3" />
                                Generate waveform
                            </button>
                        )}
                    {scrubberStyle === "waveform" &&
                        waveformStatus === "error" && (
                            <button
                                type="button"
                                onClick={onDecodeWaveform}
                                className="inline-flex items-center gap-1 text-destructive underline-offset-2 hover:underline"
                            >
                                <span aria-hidden="true" className="opacity-40">
                                    ·
                                </span>
                                <AudioWaveform className="size-3" />
                                Retry waveform
                            </button>
                        )}
                </div>
            </div>
            {folders && folders.length > 0 && (
                <div className="shrink-0 pt-0.5">
                    <FolderPicker
                        currentFolderId={recording.folderId}
                        folders={folders}
                        onAssign={handleAssignFolder}
                    />
                </div>
            )}
        </CardHeader>
    );
}
