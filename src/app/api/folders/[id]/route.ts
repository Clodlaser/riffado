import { and, eq, isNull, ne } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { folders } from "@/db/schema";
import { requireApiSession } from "@/lib/auth-server";
import { AppError, apiHandler, ErrorCode } from "@/lib/errors";

type IdContext = { params: Promise<{ id: string }> };

async function isDescendant(
    userId: string,
    parentIdToCheck: string,
    targetFolderId: string,
): Promise<boolean> {
    let currentId = parentIdToCheck;
    while (currentId) {
        if (currentId === targetFolderId) {
            return true;
        }
        const [folder] = await db
            .select({ parentId: folders.parentId })
            .from(folders)
            .where(and(eq(folders.id, currentId), eq(folders.userId, userId)))
            .limit(1);
        if (!folder?.parentId) {
            break;
        }
        currentId = folder.parentId;
    }
    return false;
}

// PATCH - Update folder details (name, color, parentId)
export const PATCH = apiHandler<IdContext>(async (request, context) => {
    const session = await requireApiSession(request);
    const { id } = await (context as IdContext).params;

    const body = await request.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() : undefined;
    const color =
        typeof body.color === "string" ? body.color.trim() : undefined;
    const parentId =
        body.parentId === null
            ? null
            : typeof body.parentId === "string" && body.parentId.trim()
              ? body.parentId.trim()
              : undefined;

    const [existing] = await db
        .select()
        .from(folders)
        .where(and(eq(folders.id, id), eq(folders.userId, session.user.id)))
        .limit(1);

    if (!existing) {
        throw new AppError(ErrorCode.NOT_FOUND, "Folder not found", 404);
    }

    const updateFields: Record<string, unknown> = {
        updatedAt: new Date(),
    };

    // Validate parentId if it's being updated
    if (parentId !== undefined) {
        if (parentId === id) {
            throw new AppError(
                ErrorCode.INVALID_INPUT,
                "A folder cannot be its own parent",
                400,
                { field: "parentId" },
            );
        }

        if (parentId !== null) {
            // Verify parent folder exists and belongs to the user
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

            // Verify no circular dependency (parent is not a descendant of current folder)
            const circular = await isDescendant(session.user.id, parentId, id);
            if (circular) {
                throw new AppError(
                    ErrorCode.INVALID_INPUT,
                    "Circular folder dependency detected (cannot set parent to a child folder)",
                    400,
                    { field: "parentId" },
                );
            }
        }
        updateFields.parentId = parentId;
    }

    const targetParentId =
        parentId !== undefined ? parentId : existing.parentId;

    if (name !== undefined) {
        if (!name) {
            throw new AppError(
                ErrorCode.INVALID_INPUT,
                "Folder name cannot be empty",
                400,
                { field: "name" },
            );
        }
        updateFields.name = name;
    }

    const targetName = name !== undefined ? name : existing.name;

    // Validate name uniqueness under the target parent folder
    if (name !== undefined || parentId !== undefined) {
        const [duplicate] = await db
            .select()
            .from(folders)
            .where(
                and(
                    eq(folders.userId, session.user.id),
                    eq(folders.name, targetName),
                    targetParentId === null
                        ? isNull(folders.parentId)
                        : eq(folders.parentId, targetParentId),
                    ne(folders.id, id),
                ),
            )
            .limit(1);

        if (duplicate) {
            throw new AppError(
                ErrorCode.INVALID_INPUT,
                "A folder with this name already exists at this level",
                400,
                { field: "name" },
            );
        }
    }

    if (color !== undefined) {
        updateFields.color = color;
    }

    await db
        .update(folders)
        .set(updateFields)
        .where(and(eq(folders.id, id), eq(folders.userId, session.user.id)));

    return NextResponse.json({ success: true });
});

// DELETE - Delete a folder
export const DELETE = apiHandler<IdContext>(async (request, context) => {
    const session = await requireApiSession(request);
    const { id } = await (context as IdContext).params;

    const [existing] = await db
        .select()
        .from(folders)
        .where(and(eq(folders.id, id), eq(folders.userId, session.user.id)))
        .limit(1);

    if (!existing) {
        throw new AppError(ErrorCode.NOT_FOUND, "Folder not found", 404);
    }

    await db
        .delete(folders)
        .where(and(eq(folders.id, id), eq(folders.userId, session.user.id)));

    return NextResponse.json({ success: true });
});
