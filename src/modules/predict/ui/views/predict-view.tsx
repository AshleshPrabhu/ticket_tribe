"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowUp, ArrowDown, Clock, RefreshCw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

/* Types */
type Ticker = {
  symbol: string;
  name: string;
  price: number;
};

type PredictionType = "UP" | "DOWN" | null;



/* Component */
export default function PredictView() {
  const { data: session } = authClient.useSession();
  
  const [stocks, setStocks] = useState<Ticker[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [locked, setLocked] = useState(false);

  const [predictions, setPredictions] = useState<
    Record<string, PredictionType>
  >({
    AAPL: null,
    MSFT: null,
    GOOGL: null,
  });

  // Fetch initial data on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchUserPredictions(),
        refreshPrices(),
      ]);
      setIsLoading(false);
    };

    fetchInitialData();
  }, []);

  const fetchUserPredictions = async () => {
    try {
      const response = await fetch('/api/user/predict');
      if (response.ok) {
        const data = await response.json();
        const formattedPredictions: Record<string, PredictionType> = {};
        
        setLocked(data.locked || false);
        
        Object.entries(data).forEach(([symbol, prediction]) => {
          if (symbol !== 'locked') {
            formattedPredictions[symbol] = prediction === null ? null : prediction ? "UP" : "DOWN";
          }
        });
        
        setPredictions(formattedPredictions);
      }
    } catch (error) {
      console.error('Error fetching user predictions:', error);
    }
  };
  const refreshPrices = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/stock');
      if (response.ok) {
        const data = await response.json();
        console.log("Data",data);
        if (data.success && data.data) {
          const stocksArray: Ticker[] = [
            {
              symbol: 'AAPL',
              name: 'Apple Inc.',
              price: data.data.AAPL || 0 // Keep full precision for accurate comparisons
            },
            {
              symbol: 'MSFT', 
              name: 'Microsoft Corp.',
              price: data.data.MSFT || 0 // Keep full precision for accurate comparisons
            },
            {
              symbol: 'GOOGL',
              name: 'Alphabet Inc.',
              price: data.data.GOOGL || 0 // Keep full precision for accurate comparisons
            }
          ];
          
          setStocks(stocksArray);
          
          // Show success message if all prices loaded
          if (data.meta.successful === 3) {
            toast.success('Stock prices updated successfully!');
          } else if (data.meta.successful > 0) {
            toast.warning(`Updated ${data.meta.successful}/3 stock prices`);
          } else {
            toast.error('Failed to fetch stock prices');
          }
        } else {
          throw new Error('Invalid API response format');
        }
      } else {
        throw new Error(`API request failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching stock prices:', error);
      toast.error('Failed to refresh stock prices. Please try again.');
      
      // Fallback to prevent empty state
      if (stocks.length === 0) {
        setStocks([
          { symbol: 'AAPL', name: 'Apple Inc.', price: 0 },
          { symbol: 'MSFT', name: 'Microsoft Corp.', price: 0 },
          { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 0 }
        ]);
      }
    } finally {
      setIsRefreshing(false);
    }
  };


  const togglePick = (symbol: string, pick: "UP" | "DOWN") => {
    if (locked) return;
    setPredictions((prev) => {
      const newPrediction = prev[symbol] === pick ? null : pick;
      setHasChanges(true);
      return {
        ...prev,
        [symbol]: newPrediction,
      };
    });
  };

  const savePredictions = async () => {
    setIsSaving(true);
    try {
      if (!session?.user?.id) {
        console.error('User not authenticated');
        toast.error('Please log in to save predictions');
        return;
      }

      // Allow partial predictions - users can skip stocks
      const predictionValues = Object.values(predictions);
      const hasSomePredictions = predictionValues.some(prediction => prediction !== null);
      
      if (!hasSomePredictions) {
        toast.error('Please make at least one prediction before saving');
        setIsSaving(false);
        return;
      }

      // Get current stock prices
      const aaplStock = stocks.find(s => s.symbol === 'AAPL');
      const msftStock = stocks.find(s => s.symbol === 'MSFT');
      const googlStock = stocks.find(s => s.symbol === 'GOOGL');

      // Check if required stock prices are loaded for predicted stocks
      if ((predictions.AAPL !== null && !aaplStock) ||
          (predictions.MSFT !== null && !msftStock) ||
          (predictions.GOOGL !== null && !googlStock)) {
        toast.error('Stock prices not loaded for predicted stocks. Please refresh and try again.');
        setIsSaving(false);
        return;
      }

      const predictionsToSave = {
        userId: session.user.id,
        AAPL: predictions.AAPL === "UP" ? true : predictions.AAPL === "DOWN" ? false : null,
        MSFT: predictions.MSFT === "UP" ? true : predictions.MSFT === "DOWN" ? false : null,
        GOOGL: predictions.GOOGL === "UP" ? true : predictions.GOOGL === "DOWN" ? false : null,
        // Only include prices for stocks that have predictions
        ...(predictions.AAPL !== null && aaplStock && { AAPLPrice: aaplStock.price }),
        ...(predictions.MSFT !== null && msftStock && { MSFTPrice: msftStock.price }),
        ...(predictions.GOOGL !== null && googlStock && { GOOGLPrice: googlStock.price }),
      };

      console.log('Saving predictions with prices:', predictionsToSave);

      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(predictionsToSave),
      });

      if (response.ok) {
        const data = await response.json();
        setHasChanges(false);
        
        const predictedStocks = [];
        if (predictions.AAPL !== null && aaplStock) predictedStocks.push(`AAPL $${aaplStock.price}`);
        if (predictions.MSFT !== null && msftStock) predictedStocks.push(`MSFT $${msftStock.price}`);
        if (predictions.GOOGL !== null && googlStock) predictedStocks.push(`GOOGL $${googlStock.price}`);
        
        toast.success(`Predictions saved for: ${predictedStocks.join(', ')}`);
      } else {
        const errorData = await response.json();
        console.error('Failed to save predictions:', errorData);
        toast.error(errorData.error || 'Failed to save predictions. Please try again.');
      }
    } catch (error) {
      console.error('Error saving predictions:', error);
      toast.error('An error occurred while saving predictions.');
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading stock prices...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold">Daily Predictions</h1>
          <p className="text-sm text-neutral-500 max-w-xl">
            Predict whether the 3 tech stocks will close higher or lower.
            Predictions lock at <strong>7:00 PM IST</strong>.
          </p>
        </div>
        
        <Button
          onClick={refreshPrices}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Prices
        </Button>
      </div>

      {/* Info banner */}
      {!locked ? (
        <div className="mt-4 text-xs md:text-sm p-3 rounded-md bg-blue-50 border border-blue-300 text-blue-700">
          Predictions are hidden from your tribe until lock. You can edit anytime before <strong>7 PM IST</strong>.
        </div>
      ) : (
        <div className="mt-4 text-xs md:text-sm p-3 rounded-md bg-green-50 border border-green-300 text-green-700">
          Predictions are now locked and visible to your tribe.
        </div>
      )}

      

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mt-6">
        {stocks.map((s) => {
          const pick = predictions[s.symbol];

          return (
            <div
              key={s.symbol}
              className="rounded-xl border border-neutral-200 bg-white shadow-sm p-5 flex flex-col justify-between"
            >
              {/* Title */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2 text-neutral-600 text-sm">
                  <span className="font-semibold">{s.symbol}</span>
                  <span className="text-neutral-400">• {s.name}</span>
                </div>

                {/* Price */}
                <div className="mt-2">
                  <div className="text-2xl font-bold">${s.price.toFixed(2)}</div>
                  <div className="text-xs text-neutral-400">
                    Reference locks at 7 PM IST
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="mt-4 flex gap-3">
                {/* HIGHER */}
                <button
                  onClick={() => togglePick(s.symbol, "UP")}
                  disabled={locked}
                  className={`
                    flex-1 py-2 rounded-lg border text-sm font-medium flex items-center justify-center gap-1
                    ${pick === "UP"
                      ? "bg-green-600 text-white border-green-600"
                      : "border-green-300 text-green-700 hover:bg-green-50"
                    }
                    ${locked ? "opacity-60 cursor-not-allowed" : ""}
                  `}
                >
                  <ArrowUp className="w-4 h-4" />
                  HIGHER
                </button>

                {/* LOWER */}
                <button
                  onClick={() => togglePick(s.symbol, "DOWN")}
                  disabled={locked}
                  className={`
                    flex-1 py-2 rounded-lg border text-sm font-medium flex items-center justify-center gap-1
                    ${pick === "DOWN"
                      ? "bg-red-600 text-white border-red-600"
                      : "border-red-300 text-red-700 hover:bg-red-50"
                    }
                    ${locked ? "opacity-60 cursor-not-allowed" : ""}
                  `}
                >
                  <ArrowDown className="w-4 h-4" />
                  LOWER
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-3">
        <p className="text-sm text-neutral-500">
          Auto-scoring at 2:30 AM IST after US market close.
        </p>

        <div className="flex gap-3">
          {hasChanges && !locked && (
            <Button
              onClick={savePredictions}
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Predictions'}
            </Button>
          )}
          
        </div>
      </div>
    </div>
  );
}
