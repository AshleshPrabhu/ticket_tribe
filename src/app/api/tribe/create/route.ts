import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tribe, tribeMembers } from "@/db/schema";
import crypto from "crypto";

export async function POST(request: NextRequest) {
    try {
        const { userId } = await request.json();
        const code = crypto.randomBytes(3).toString("hex");
        const [createdTribe] = await db
        .insert(tribe)
        .values({ code })
        .returning();

        await db.insert(tribeMembers).values({
            userId,
            tribeId: createdTribe.id,
        });

        return NextResponse.json({
            status: "success",
            tribeId: createdTribe.id,
            code,
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "failed" }, { status: 500 });
    }
}
