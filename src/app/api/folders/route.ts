import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { folders } from "@/db/schema";
import { requireApiSession } from "@/lib/auth-server";
import { AppError, apiHandler, ErrorCode } from "@/lib/errors";

// GET - List all folders for user
export const GET = apiHandler(async (request: Request) => {
    const session = await requireApiSession(request);

    const userFolders = await db
        .select({
            id: folders.id,
            name: folders.name,
            color: folders.color,
            createdAt: folders.createdAt,
        })
        .from(folders)
        .where(eq(folders.userId, session.user.id))
        .orderBy(folders.name);

    return NextResponse.json({ folders: userFolders });
});

// POST - Create a new folder
export const POST = apiHandler(async (request: Request) => {
    const session = await requireApiSession(request);

    const body = await request.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const color =
        typeof body.color === "string" ? body.color.trim() : "142 36% 45%"; // default green

    if (!name) {
        throw new AppError(
            ErrorCode.INVALID_INPUT,
            "Folder name is required",
            400,
            { field: "name" },
        );
    }

    // Check name uniqueness per user
    const [existing] = await db
        .select()
        .from(folders)
        .where(and(eq(folders.userId, session.user.id), eq(folders.name, name)))
        .limit(1);

    if (existing) {
        throw new AppError(
            ErrorCode.INVALID_INPUT,
            "A folder with this name already exists",
            400,
            { field: "name" },
        );
    }

    const [created] = await db
        .insert(folders)
        .values({
            userId: session.user.id,
            name,
            color,
        })
        .returning({
            id: folders.id,
            name: folders.name,
            color: folders.color,
        });

    return NextResponse.json({ folder: created });
});
