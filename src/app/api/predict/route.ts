import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { prediction } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function POST(request: NextRequest) {
    try {
        const { userId, AAPL, MSFT, GOOGL, AAPLPrice, MSFTPrice, GOOGLPrice } = await request.json();

        // Validate required fields
        if (!userId) {
            return NextResponse.json({ 
                error: "Missing required field: userId" 
            }, { status: 400 });
        }

        // Check if at least one prediction is made
        const hasPredictions = AAPL !== null || MSFT !== null || GOOGL !== null;
        if (!hasPredictions) {
            return NextResponse.json({ 
                error: "At least one stock prediction is required" 
            }, { status: 400 });
        }

        // Validate that prices are provided for predicted stocks
        if ((AAPL !== null && AAPLPrice === undefined) || 
            (MSFT !== null && MSFTPrice === undefined) || 
            (GOOGL !== null && GOOGLPrice === undefined)) {
            return NextResponse.json({ 
                error: "Stock prices are required for all predicted stocks" 
            }, { status: 400 });
        }

        // Convert prices to integers by removing decimal point for maximum precision
        // Example: 271.1234123423456 becomes 271123412342345600
        const convertPriceToInteger = (price: number) => {
            return Math.round(price * 1000000000000000); // Multiply by 10^15 to preserve 15 decimal places
        };

        const aaplPrice = AAPLPrice !== undefined ? convertPriceToInteger(AAPLPrice) : null;
        const msftPrice = MSFTPrice !== undefined ? convertPriceToInteger(MSFTPrice) : null;
        const googlPrice = GOOGLPrice !== undefined ? convertPriceToInteger(GOOGLPrice) : null;

        const [latest] = await db
        .select()
        .from(prediction)
        .where(eq(prediction.userId, userId))
        .orderBy(desc(prediction.createdAt))
        .limit(1);

        if (!latest || latest.locked) {
            await db.insert(prediction).values({
                userId,
                AAPL,
                MSFT,
                GOOGL,
                AAPLPrice: aaplPrice,
                MSFTPrice: msftPrice,
                GOOGLPrice: googlPrice,
                date: new Date(),
                locked: false,
            });
            return NextResponse.json({ 
                message: "created",
                prices: { AAPLPrice, MSFTPrice, GOOGLPrice }
            }, { status: 201 });
        }

        await db
        .update(prediction)
        .set({
            AAPL,
            MSFT,
            GOOGL,
            AAPLPrice: aaplPrice,
            MSFTPrice: msftPrice,
            GOOGLPrice: googlPrice,
            date: new Date(),
            locked: false,
        })
        .where(eq(prediction.id, latest.id));

        return NextResponse.json({ 
            message: "updated",
            prices: { AAPLPrice, MSFTPrice, GOOGLPrice }
        }, { status: 200 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}
