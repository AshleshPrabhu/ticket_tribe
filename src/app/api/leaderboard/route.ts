import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
    const users = await db
        .select({
            id: user.id,
            name: user.name,
            points: user.points,
        })
        .from(user)
        .orderBy(desc(user.points));

    return NextResponse.json({
        leaderboard: users,
    });
}
