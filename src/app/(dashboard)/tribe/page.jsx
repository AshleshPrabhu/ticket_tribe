"use client";

import React, { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

/* ------------------------------------------
   Utils
------------------------------------------ */
function initials(name) {
  return name
    .split(" ")
    .map((s) => s[0]?.toUpperCase())
    .join("");
}

function Avatar({ name, color, size = 32 }) {
  const colors = [
    "#7c3aed", "#0ea5a4", "#fb923c", "#ef4444", "#06b6d4",
    "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6"
  ];
  
  const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const selectedColor = color || colors[colorIndex % colors.length];
  
  return (
    <div
      className="flex items-center justify-center rounded-full text-white font-semibold"
      style={{
        width: size,
        height: size,
        backgroundColor: selectedColor,
      }}
    >
      {initials(name)}
    </div>
  );
}

function PredictionBadge({ prediction, stock }) {
  // Only show predictions if they exist and are locked
  if (!prediction || !prediction.locked) {
    return <span className="text-xs text-gray-400">Not predicted</span>;
  }
  
  // Use uppercase stock symbol to match database structure
  const stockPrediction = prediction[stock.toUpperCase()];
  
  if (stockPrediction === null || stockPrediction === undefined) {
    return <span className="text-xs text-gray-400">Not predicted</span>;
  }
  
  const isHigher = stockPrediction === true;
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
      isHigher 
        ? 'bg-green-100 text-green-700' 
        : 'bg-red-100 text-red-700'
    }`}>
      {isHigher ? '📈 Higher' : '📉 Lower'}
    </span>
  );
}

/* ------------------------------------------
    Main Component
------------------------------------------ */
export default function TribePage() {
  const [tribeData, setTribeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const stocks = ['AAPL', 'MSFT', 'GOOGL'];

  useEffect(() => {
    fetchTribeData();
  }, []);

  const fetchTribeData = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/tribe', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTribeData(data);
      } else if (response.status === 404) {
        toast.error("You are not in any tribe. Please join a tribe first.");
      } else if (response.status === 401) {
        toast.error("Authentication failed. Please sign in again.");
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to fetch tribe data");
      }
    } catch (error) {
      console.error('Error fetching tribe data:', error);
      toast.error("Failed to load tribe data");
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = tribeData?.members?.filter((m) =>
    m.name?.toLowerCase().includes(query.toLowerCase())
  ) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your tribe...</p>
        </div>
      </div>
    );
  }

  if (!tribeData) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Tribe Found</h2>
          <p className="text-gray-600 mb-4">You are not in any tribe yet.</p>
          <button 
            onClick={() => window.location.href = '/onboarding'}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Join a Tribe
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* TOP BAR */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <div className="font-semibold text-neutral-900 text-[15px]">
                Tribe Predictions
              </div>
              <div className="text-xs text-neutral-500">
                Code: {tribeData.tribe.code} • {filteredMembers.length} members
              </div>
            </div>
          </div>

          <input
            placeholder="Search members…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="hidden sm:block border px-3 py-2 rounded-md text-sm bg-white w-64"
          />
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* PREDICTIONS GRID */}
        <div className="bg-white border rounded-xl shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Member Predictions</h2>
              <button
                onClick={fetchTribeData}
                className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50"
              >
                Refresh
              </button>
            </div>

            {/* Mobile search */}
            <input
              placeholder="Search members…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="sm:hidden w-full border px-3 py-2 rounded-md text-sm bg-white mb-4"
            />

            {filteredMembers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No members found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Header */}
                <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 pb-3 border-b border-gray-200">
                  <div className="font-medium text-sm text-gray-700">Member</div>
                  <div className="grid grid-cols-3 gap-4">
                    {stocks.map(stock => (
                      <div key={stock} className="text-center">
                        <div className="font-medium text-sm text-gray-700">{stock}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Member rows */}
                {filteredMembers.map((member) => (
                  <div 
                    key={member.userId} 
                    className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 py-4 border-b border-gray-100 last:border-b-0"
                  >
                    {/* Member info */}
                    <div className="flex items-center gap-3">
                      <Avatar name={member.name || 'Unknown'} size={40} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {member.name || 'Unknown User'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {member.points || 0} points
                        </div>
                      </div>
                    </div>

                    {/* Predictions */}
                    <div className="grid grid-cols-3 gap-4">
                      {stocks.map(stock => (
                        <div key={stock} className="text-center">
                          <PredictionBadge 
                            prediction={member.prediction} 
                            stock={stock}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            
          </div>
        </div>

        {/* TRIBE INFO SIDEBAR */}
        <div className="mt-6 bg-white border rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Tribe Information</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Tribe Code:</span>
              <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                {tribeData.tribe.code}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Members:</span>
              <span className="text-sm font-medium">{tribeData.members.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Created:</span>
              <span className="text-sm">
                {new Date(tribeData.tribe.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Active Predictions:</span>
              <span className="text-sm font-medium">
                {tribeData.members.filter(m => m.prediction && m.prediction.locked).length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
