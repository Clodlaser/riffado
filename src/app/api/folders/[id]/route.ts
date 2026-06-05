import { and, eq, ne } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { folders } from "@/db/schema";
import { requireApiSession } from "@/lib/auth-server";
import { AppError, apiHandler, ErrorCode } from "@/lib/errors";

type IdContext = { params: Promise<{ id: string }> };

// PATCH - Update folder details (name, color)
export const PATCH = apiHandler<IdContext>(async (request, context) => {
    const session = await requireApiSession(request);
    const { id } = await (context as IdContext).params;

    const body = await request.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() : undefined;
    const color =
        typeof body.color === "string" ? body.color.trim() : undefined;

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

    if (name !== undefined) {
        if (!name) {
            throw new AppError(
                ErrorCode.INVALID_INPUT,
                "Folder name cannot be empty",
                400,
                { field: "name" },
            );
        }

        // Validate uniqueness among other folders
        const [duplicate] = await db
            .select()
            .from(folders)
            .where(
                and(
                    eq(folders.userId, session.user.id),
                    eq(folders.name, name),
                    ne(folders.id, id),
                ),
            )
            .limit(1);

        if (duplicate) {
            throw new AppError(
                ErrorCode.INVALID_INPUT,
                "A folder with this name already exists",
                400,
                { field: "name" },
            );
        }

        updateFields.name = name;
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
