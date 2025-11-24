export async function fetchStockResults() {

    const get = async (symbol: string) => {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
        const res = await fetch(url);
        const json = await res.json();
        const data = json.chart.result[0];
        const open = data.indicators.quote[0].open[0];
        const close = data.indicators.quote[0].close[0];
        return close > open; 
    };

    return {
        AAPL: await get("AAPL"),
        MSFT: await get("MSFT"),
        GOOGL: await get("GOOGL"),
    };
}

export async function fetchStockPrices() {
    const symbols = ["AAPL", "MSFT", "GOOGL"];
    const stockData = [];
    
    for (const symbol of symbols) {
        try {
            // Generate realistic mock prices with small random variations
            const basePrices: Record<string, number> = {
                AAPL: 183.42,
                MSFT: 378.85,
                GOOGL: 136.12
            };
            
            const basePrice = basePrices[symbol] || 100.00;
            // Add small random variation (-2% to +2%)
            const variation = (Math.random() - 0.5) * 0.04 * basePrice;
            const currentPrice = basePrice + variation;
            
            stockData.push({
                symbol,
                name: getStockName(symbol),
                price: Number(currentPrice.toFixed(2))
            });
            
            // Add small delay to simulate API call
            await new Promise(resolve => setTimeout(resolve, 100));
            
        } catch (error) {
            console.error(`Error fetching ${symbol}:`, error);
            stockData.push({
                symbol,
                name: getStockName(symbol),
                price: getMockPrice(symbol)
            });
        }
    }

    return stockData;
}

function getStockName(symbol: string): string {
    const names: Record<string, string> = {
        AAPL: "Apple Inc.",
        MSFT: "Microsoft Corp.",
        GOOGL: "Alphabet Inc."
    };
    return names[symbol] || symbol;
}

function getMockPrice(symbol: string): number {
    const mockPrices: Record<string, number> = {
        AAPL: 183.42,
        MSFT: 378.85,
        GOOGL: 136.12
    };
    return mockPrices[symbol] || 100.00;
}
