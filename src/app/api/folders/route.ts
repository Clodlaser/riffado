import { and, eq, isNull } from "drizzle-orm";
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
            parentId: folders.parentId,
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
    const parentId =
        typeof body.parentId === "string" && body.parentId.trim()
            ? body.parentId.trim()
            : null;

    if (!name) {
        throw new AppError(
            ErrorCode.INVALID_INPUT,
            "Folder name is required",
            400,
            { field: "name" },
        );
    }

    if (parentId) {
        const [parent] = await db
            .select()
            .from(folders)
            .where(
                and(
                    eq(folders.id, parentId),
                    eq(folders.userId, session.user.id),
                ),
            )
            .limit(1);
        if (!parent) {
            throw new AppError(
                ErrorCode.INVALID_INPUT,
                "Parent folder not found",
                400,
                { field: "parentId" },
            );
        }
    }

    // Check name uniqueness under the same parent
    const [existing] = await db
        .select()
        .from(folders)
        .where(
            and(
                eq(folders.userId, session.user.id),
                eq(folders.name, name),
                parentId === null
                    ? isNull(folders.parentId)
                    : eq(folders.parentId, parentId),
            ),
        )
        .limit(1);

    if (existing) {
        throw new AppError(
            ErrorCode.INVALID_INPUT,
            "A folder with this name already exists at this level",
            400,
            { field: "name" },
        );
    }

    const [created] = await db
        .insert(folders)
        .values({
            userId: session.user.id,
            parentId,
            name,
            color,
        })
        .returning({
            id: folders.id,
            name: folders.name,
            color: folders.color,
            parentId: folders.parentId,
        });

    return NextResponse.json({ folder: created });
});
