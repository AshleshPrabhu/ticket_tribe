import { NextResponse } from "next/server";
import { db } from "@/db";
import { prediction, user } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function POST(_request: Request) {
    // if (request.headers.get("x-cron-secret") !== process.env.CRON_SECRET) {
    //     return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    // }

    try {
        // Get current stock prices from our stock API
        const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
        const stockResponse = await fetch(`${baseUrl}/api/stock`);
        
        if (!stockResponse.ok) {
            throw new Error('Failed to fetch current stock prices');
        }

        const stockData = await stockResponse.json();
        
        if (!stockData.success || !stockData.data) {
            throw new Error('Invalid stock data received');
        }

        // Convert current prices to integers for comparison with stored integer prices
        const convertPriceToInteger = (price: number) => {
            return Math.round(price * 1000000000000000); // Multiply by 10^15 to preserve 15 decimal places
        };

        const currentPrices = {
            AAPL: stockData.data.AAPL,
            MSFT: stockData.data.MSFT,
            GOOGL: stockData.data.GOOGL,
        };

        // Integer versions for comparison
        const currentPricesInteger = {
            AAPL: convertPriceToInteger(stockData.data.AAPL),
            MSFT: convertPriceToInteger(stockData.data.MSFT),
            GOOGL: convertPriceToInteger(stockData.data.GOOGL),
        };

        console.log('Current stock prices (decimal):', currentPrices);
        console.log('Current stock prices (integer):', currentPricesInteger);

        // Get all locked predictions from today (using date range to handle timestamps)
        const today = new Date().toISOString().slice(0, 10);
        const startOfDay = new Date(today + 'T00:00:00.000Z');
        const endOfDay = new Date(today + 'T23:59:59.999Z');

        const preds = await db
            .select()
            .from(prediction)
            .where(
                and(
                    sql`${prediction.date} >= ${startOfDay}`,
                    sql`${prediction.date} <= ${endOfDay}`,
                    eq(prediction.locked, true)
                )
            );

        console.log(`Processing ${preds.length} predictions for scoring`);

        let correctPredictions = 0;
        let totalPointsAwarded = 0;

        for (const p of preds) {
            let pointsToAdd = 0;
            let correctCount = 0;
            let wrongCount = 0;
            let totalPredictions = 0;
            const results = [];

            // Use stored integer prices directly for comparison
            const storedPricesInteger = {
                AAPL: p.AAPLPrice || 0,
                MSFT: p.MSFTPrice || 0,
                GOOGL: p.GOOGLPrice || 0,
            };

            // Also keep decimal versions for display purposes
            const convertIntegerToPrice = (intPrice: number) => {
                return intPrice / 1000000000000000; // Divide by 10^15 to restore decimal places
            };

            const storedPricesDecimal = {
                AAPL: p.AAPLPrice ? convertIntegerToPrice(p.AAPLPrice) : 0,
                MSFT: p.MSFTPrice ? convertIntegerToPrice(p.MSFTPrice) : 0,
                GOOGL: p.GOOGLPrice ? convertIntegerToPrice(p.GOOGLPrice) : 0,
            };

            // Check AAPL prediction
            if (p.AAPL !== null && currentPricesInteger.AAPL && storedPricesInteger.AAPL) {
                totalPredictions++;
                const predictedUp = p.AAPL === true;
                const actualUp = currentPricesInteger.AAPL > storedPricesInteger.AAPL;
                if (predictedUp === actualUp) {
                    pointsToAdd += 1; // +1 for correct
                    correctCount++;
                    results.push(`AAPL: ✓ +1 (predicted ${predictedUp ? 'UP' : 'DOWN'}, ${storedPricesDecimal.AAPL.toFixed(6)} → ${currentPrices.AAPL.toFixed(6)})`);
                } else {
                    pointsToAdd -= 1; // -1 for wrong
                    wrongCount++;
                    results.push(`AAPL: ✗ -1 (predicted ${predictedUp ? 'UP' : 'DOWN'}, ${storedPricesDecimal.AAPL.toFixed(6)} → ${currentPrices.AAPL.toFixed(6)})`);
                }
            } else if (p.AAPL !== null) {
                results.push(`AAPL: - (no price data)`);
            }

            // Check MSFT prediction
            if (p.MSFT !== null && currentPricesInteger.MSFT && storedPricesInteger.MSFT) {
                totalPredictions++;
                const predictedUp = p.MSFT === true;
                const actualUp = currentPricesInteger.MSFT > storedPricesInteger.MSFT;
                if (predictedUp === actualUp) {
                    pointsToAdd += 1; // +1 for correct
                    correctCount++;
                    results.push(`MSFT: ✓ +1 (predicted ${predictedUp ? 'UP' : 'DOWN'}, ${storedPricesDecimal.MSFT.toFixed(6)} → ${currentPrices.MSFT.toFixed(6)})`);
                } else {
                    pointsToAdd -= 1; // -1 for wrong
                    wrongCount++;
                    results.push(`MSFT: ✗ -1 (predicted ${predictedUp ? 'UP' : 'DOWN'}, ${storedPricesDecimal.MSFT.toFixed(6)} → ${currentPrices.MSFT.toFixed(6)})`);
                }
            } else if (p.MSFT !== null) {
                results.push(`MSFT: - (no price data)`);
            }

            // Check GOOGL prediction
            if (p.GOOGL !== null && currentPricesInteger.GOOGL && storedPricesInteger.GOOGL) {
                totalPredictions++;
                const predictedUp = p.GOOGL === true;
                const actualUp = currentPricesInteger.GOOGL > storedPricesInteger.GOOGL;
                if (predictedUp === actualUp) {
                    pointsToAdd += 1; // +1 for correct
                    correctCount++;
                    results.push(`GOOGL: ✓ +1 (predicted ${predictedUp ? 'UP' : 'DOWN'}, ${storedPricesDecimal.GOOGL.toFixed(6)} → ${currentPrices.GOOGL.toFixed(6)})`);
                } else {
                    pointsToAdd -= 1; // -1 for wrong
                    wrongCount++;
                    results.push(`GOOGL: ✗ -1 (predicted ${predictedUp ? 'UP' : 'DOWN'}, ${storedPricesDecimal.GOOGL.toFixed(6)} → ${currentPrices.GOOGL.toFixed(6)})`);
                }
            } else if (p.GOOGL !== null) {
                results.push(`GOOGL: - (no price data)`);
            }

            console.log(`User ${p.userId}: ${correctCount}✓ ${wrongCount}✗ (${pointsToAdd >= 0 ? '+' : ''}${pointsToAdd} points) - ${results.join(', ')}`);

            // Update user points (can be negative)
            if (pointsToAdd !== 0) {
                await db
                    .update(user)
                    .set({ points: sql`${user.points} + ${pointsToAdd}` })
                    .where(eq(user.id, p.userId));
                
                totalPointsAwarded += pointsToAdd;
            }

            // Mark prediction as processed
            await db
                .update(prediction)
                .set({ correct: correctCount === totalPredictions && totalPredictions > 0 })
                .where(eq(prediction.id, p.id));

            if (correctCount === totalPredictions && totalPredictions > 0) {
                correctPredictions++;
            }
        }

        // Create new prediction round for all users (with null values for next day)
        console.log('Creating new prediction round for all users...');
        
        // Get all users who have made predictions before (to create new rounds for them)
        const allUsers = await db
            .select({ userId: user.id })
            .from(user);

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowDate = new Date(tomorrow.toISOString().slice(0, 10));

        let newPredictionsCreated = 0;
        
        for (const userRecord of allUsers) {
            try {
                // Check if user already has a prediction for tomorrow
                const existingPrediction = await db
                    .select()
                    .from(prediction)
                    .where(
                        and(
                            eq(prediction.userId, userRecord.userId),
                            sql`${prediction.date} >= ${new Date(tomorrow.toISOString().slice(0, 10) + 'T00:00:00.000Z')}`,
                            sql`${prediction.date} <= ${new Date(tomorrow.toISOString().slice(0, 10) + 'T23:59:59.999Z')}`
                        )
                    )
                    .limit(1);

                // Only create if no prediction exists for tomorrow
                if (existingPrediction.length === 0) {
                    await db.insert(prediction).values({
                        userId: userRecord.userId,
                        AAPL: null,
                        MSFT: null,
                        GOOGL: null,
                        AAPLPrice: null,
                        MSFTPrice: null,
                        GOOGLPrice: null,
                        date: tomorrowDate,
                        locked: false,
                        correct: false,
                    });
                    newPredictionsCreated++;
                }
            } catch (error) {
                console.error(`Failed to create prediction for user ${userRecord.userId}:`, error);
            }
        }

        console.log(`Created ${newPredictionsCreated} new prediction rounds for tomorrow`);

        return NextResponse.json({
            success: true,
            processed: preds.length,
            perfectPredictions: correctPredictions,
            totalPointsAwarded,
            newPredictionsCreated,
            currentPrices,
            message: `Scores calculated: ${preds.length} predictions processed, ${correctPredictions} perfect scores, ${totalPointsAwarded >= 0 ? '+' : ''}${totalPointsAwarded} total points awarded. Created ${newPredictionsCreated} new prediction rounds.`,
        });

    } catch (error) {
        console.error('Error in score calculation:', error);
        return NextResponse.json({
            success: false,
            error: error,
            message: "Failed to calculate scores",
        }, { status: 500 });
    }
}
