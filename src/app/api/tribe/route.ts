import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tribe, tribeMembers, user, prediction } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";

// GET - Get current user's tribe and members with predictions
export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Find user's tribe
        const [userTribe] = await db
            .select({
                tribeId: tribeMembers.tribeId,
                tribeCode: tribe.code,
                tribeCreatedAt: tribe.createdAt,
            })
            .from(tribeMembers)
            .innerJoin(tribe, eq(tribe.id, tribeMembers.tribeId))
            .where(eq(tribeMembers.userId, session.user.id))
            .limit(1);

        if (!userTribe) {
            return NextResponse.json({ error: "User is not in any tribe" }, { status: 404 });
        }

        // Get all members of the tribe
        const members = await db
            .select({
                userId: tribeMembers.userId,
                name: user.name,
                email: user.email,
                points: user.points,
            })
            .from(tribeMembers)
            .innerJoin(user, eq(user.id, tribeMembers.userId))
            .where(eq(tribeMembers.tribeId, userTribe.tribeId));

        const userIds = members.map((m) => m.userId);
        if (userIds.length === 0) {
            return NextResponse.json({ 
                tribe: { id: userTribe.tribeId, code: userTribe.tribeCode, createdAt: userTribe.tribeCreatedAt }, 
                members: [] 
            });
        }

        // Get latest predictions for each member (only locked predictions)
        const preds = await db
            .select()
            .from(prediction)
            .where(inArray(prediction.userId, userIds))
            .orderBy(desc(prediction.createdAt));

        const predMap = new Map();
        for (const p of preds) {
            if (!predMap.has(p.userId)) {
                // Only include predictions that are locked
                predMap.set(p.userId, p.locked ? p : null);
            }
        }

        const result = members.map((m) => ({
            userId: m.userId,
            name: m.name,
            email: m.email,
            points: m.points,
            prediction: predMap.get(m.userId) ?? null,
        }));

        return NextResponse.json({ 
            tribe: { 
                id: userTribe.tribeId, 
                code: userTribe.tribeCode, 
                createdAt: userTribe.tribeCreatedAt 
            }, 
            members: result 
        });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { tribeId } = await request.json();

        const [tribeInfo] = await db
        .select()
        .from(tribe)
        .where(eq(tribe.id, tribeId));

        if (!tribeInfo) {
            return NextResponse.json({ error: "Invalid tribe ID" }, { status: 400 });
        }

        const members = await db
        .select({
            userId: tribeMembers.userId,
            name: user.name,
            email: user.email,
            points: user.points,
        })
        .from(tribeMembers)
        .innerJoin(user, eq(user.id, tribeMembers.userId))
        .where(eq(tribeMembers.tribeId, tribeId));

        const userIds = members.map((m) => m.userId);
        if (userIds.length === 0) {
            return NextResponse.json({ tribe: tribeInfo, members: [] });
        }

        const preds = await db
        .select()
        .from(prediction)
        .where(inArray(prediction.userId, userIds))
        .orderBy(desc(prediction.createdAt));

        const predMap = new Map();
        for (const p of preds) {
            if (!predMap.has(p.userId)) {
                predMap.set(p.userId, p);
            }
        }

        const result = members.map((m) => ({
            use3diction: predMap.get(m.userId) ?? null,
        }));

        return NextResponse.json({ tribe: tribeInfo, members: result });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}
