import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tribe, tribeMembers } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
    try {
        const { userId, code } = await request.json();

        const [foundTribe] = await db
        .select()
        .from(tribe)
        .where(eq(tribe.code, code));

        if (!foundTribe) {
            return NextResponse.json(
                { error: "Invalid tribe code" },
                { status: 400 }
            );
        }

        await db.insert(tribeMembers).values({
            userId,
            tribeId: foundTribe.id,
        });

        return NextResponse.json(
            { message: "Joined tribe successfully" },
            { status: 200 }
        );
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Failed to join tribe" },
            { status: 500 }
        );
    }
}
