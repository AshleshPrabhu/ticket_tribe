import { NextRequest, NextResponse } from "next/server";

const STOCKS = ['AAPL', 'MSFT', 'GOOGL'] as const;
const YAHOO_FINANCE_BASE_URL = 'https://query1.finance.yahoo.com/v8/finance/chart';

interface YahooFinanceResponse {
  chart: {
    result: Array<{
      indicators: {
        quote: Array<{
          close: number[];
        }>;
      };
    }>;
    error?: string;
  };
}

async function fetchStockPrice(symbol: string): Promise<number | null> {
  try {
    const response = await fetch(`${YAHOO_FINANCE_BASE_URL}/${symbol}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      next: { revalidate: 60 }, // Cache for 1 minute
    });

    if (!response.ok) {
      console.error(`Failed to fetch ${symbol}: ${response.status}`);
      return null;
    }

    const data: YahooFinanceResponse = await response.json();
    
    if (data.chart.error) {
      console.error(`Yahoo Finance API error for ${symbol}:`, data.chart.error);
      return null;
    }

    const result = data.chart.result[0];
    if (!result?.indicators?.quote?.[0]?.close) {
      console.error(`Invalid data structure for ${symbol}`);
      return null;
    }

    const closes = result.indicators.quote[0].close;
    const latestPrice = closes[closes.length - 1];
    
    // Return full precision for accurate comparisons, don't round here
    return typeof latestPrice === 'number' ? latestPrice : null;
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Fetch all stock prices in parallel
    const stockPromises = STOCKS.map(async (symbol) => {
      const price = await fetchStockPrice(symbol);
      return { symbol, price };
    });

    const stockResults = await Promise.all(stockPromises);
    
    // Build response object
    const stockPrices: Record<string, number | null> = {};
    let successCount = 0;
    
    for (const { symbol, price } of stockResults) {
      stockPrices[symbol] = price;
      if (price !== null) successCount++;
    }

    // Log results
    console.log(`Stock prices fetched: ${successCount}/${STOCKS.length} successful`);
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: stockPrices,
      meta: {
        total: STOCKS.length,
        successful: successCount,
        failed: STOCKS.length - successCount,
      }
    });

  } catch (error) {
    console.error('Stock API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch stock prices',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Support POST for backward compatibility
export async function POST(request: NextRequest) {
    return GET(request);
}
