import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { prediction } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        const preds = await db
        .select()
        .from(prediction)
        .where(eq(prediction.userId, userId))
        .orderBy(desc(prediction.date))
        .limit(1);

        // Check if predictions are locked (7 PM IST = 1:30 PM UTC)
        const now = new Date();
        const todayIST = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
        const lockTimeIST = new Date(todayIST);
        lockTimeIST.setHours(19, 0, 0, 0); // 7 PM IST
        
        const isLocked = todayIST >= lockTimeIST;

        if (preds.length === 0) {
            return NextResponse.json({
                AAPL: null,
                MSFT: null,
                GOOGL: null,
                locked: isLocked,
            });
        }

        const { AAPL, MSFT, GOOGL } = preds[0];

        return NextResponse.json({ AAPL, MSFT, GOOGL, locked: preds[0].locked });
    } catch (error) {
        console.error("Error fetching predictions:", error);
        return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
        );
    }
}
