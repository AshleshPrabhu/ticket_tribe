import { NextResponse } from "next/server";
import { db } from "@/db";
import { prediction } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: Request) {
    // if (request.headers.get("x-cron-secret") !== process.env.CRON_SECRET) {
    //     return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    // }

    const today = new Date().toISOString().slice(0, 10);

    const todayDate = new Date(today);

    await db
    .update(prediction)
    .set({ locked: true })
    .where(
        eq(prediction.locked, false)
    );

    return NextResponse.json({
        success: true,
        message: "Predictions locked for today",
    });
}
