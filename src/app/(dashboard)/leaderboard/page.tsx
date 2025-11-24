"use client";

import React, { useEffect, useState, useRef } from "react";

type Member = { id: number; name: string; points: number; color?: string };

export default function LeaderboardPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const evtRef = useRef<EventSource | null>(null);

  const initials = (n: string) =>
    n
      .split(" ")
      .map((x) => x[0])
      .join("")
      .toUpperCase();

  async function fetchMembers() {
    setLoading(true);
    try {
      const res = await fetch("/api/leaderboard");
      const json = await res.json();
      const list: Member[] = json.leaderboard || [];
      // API already returns sorted by points desc, no need to sort again
      setMembers(list);
    } catch (e) {
      console.error("fetch members failed", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMembers();

    // EventSource streaming not implemented yet
    // Remove this section for now
  }, []);

  const filtered = members.filter((m) =>
    m.name.toLowerCase().includes(query.toLowerCase())
  );

  const TOP3 = members.slice(0, 3);

  function exportCSV() {
    const rows = [["Rank", "Name", "Points"]].concat(
      members.map((m, i) => [String(i + 1), m.name, String(m.points)])
    );
    const csv = rows
      .map((r) =>
        r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leaderboard.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">
              Leaderboard
            </h1>
            <p className="text-sm text-neutral-600">
              Real-time rankings — auto updated.
            </p>
            {lastUpdated && (
              <div className="text-xs text-neutral-400 mt-1">
                Last update: {lastUpdated}
              </div>
            )}
          </div>

          <div className="flex items-center flex-wrap gap-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search users..."
              className="border px-3 py-2 rounded-md text-sm bg-white w-full sm:w-auto"
            />
            <button
              onClick={exportCSV}
              className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm"
            >
              Export CSV
            </button>
            <button
              onClick={fetchMembers}
              className="border px-3 py-2 rounded-md text-sm"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* LAYOUT FIX: Mobile-first */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* LEFT — TABLE */}
          <div className="bg-white border rounded-lg shadow-sm overflow-hidden">

            <div className="px-4 py-3 border-b font-medium text-sm text-neutral-700">
              Member Rankings
            </div>

            {/* Desktop Header */}
            <div className="hidden md:grid grid-cols-[50px_50px_1fr_80px] px-4 py-2 text-xs text-neutral-500 border-b">
              <div>#</div>
              <div>Profile</div>
              <div>Name</div>
              <div className="text-right">Points</div>
            </div>

            {/* Rows */}
            <div>
              {loading && (
                <div className="p-6 text-center text-neutral-500">Loading…</div>
              )}

              {!loading && filtered.length === 0 && (
                <div className="p-6 text-center text-neutral-500">
                  No members found.
                </div>
              )}

              {!loading &&
                filtered.map((m, i) => (
                  <div
                    key={m.id}
                    className="
                      grid grid-cols-[40px_40px_1fr_60px] 
                      sm:grid-cols-[50px_50px_1fr_80px]
                      items-center px-4 py-3 border-b last:border-none 
                      hover:bg-neutral-50 transition
                    "
                  >
                    <div className="text-sm font-medium">{members.indexOf(m) + 1}</div>

                    <div>
                      <div
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full text-white flex items-center justify-center font-semibold`}
                        style={{
                          background: `linear-gradient(135deg, ${
                            m.color || "#6b7280"
                          }, #374151)`
                        }}
                      >
                        {initials(m.name)}
                      </div>
                    </div>

                    <div className="overflow-hidden">
                      <div className="text-sm font-medium truncate">{m.name}</div>
                      <div className="text-xs text-neutral-500 truncate">
                        ID #{m.id}
                      </div>
                    </div>

                    <div className="text-right font-semibold text-neutral-900">
                      {m.points}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* RIGHT — PODIUM */}
<aside className="bg-white border rounded-lg shadow-sm p-4">

  {/* DESKTOP PODIUM (FULLY REDESIGNED) */}
  <div className="hidden lg:block">
    <h2 className="text-sm font-semibold text-neutral-800 mb-4">
      Top Performers
    </h2>

    <div className="flex items-end justify-between px-2 pt-2">

      {/* 2nd place */}
      <div className="flex flex-col items-center mb-4">
        <div className="text-xs text-neutral-500 mb-1">2</div>
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center font-semibold text-neutral-800 shadow"
          style={{
            background:
              "linear-gradient(135deg, #d2d3d5 0%, #b4b5b7 100%)"
          }}
        >
          {TOP3[1] ? initials(TOP3[1]?.name) : "—"}
        </div>
        <p className="mt-2 text-sm font-medium text-neutral-800 text-center w-28 truncate">
          {TOP3[1]?.name ?? "—"}
        </p>
        <p className="text-xs text-neutral-500">{TOP3[1]?.points ?? "--"} pts</p>
      </div>

      {/* 1st place (center spotlight) */}
      <div className="flex flex-col items-center">
        <div className="text-xs text-neutral-500 mb-1">1</div>

        <div className="relative">
          {/* glowing ring */}
          <div className="absolute inset-0 w-24 h-24 rounded-full bg-yellow-300 opacity-30 blur-xl"></div>

          {/* avatar */}
          <div
            className="relative w-24 h-24 rounded-full shadow-lg flex items-center justify-center font-bold text-neutral-900"
            style={{
              background:
                "linear-gradient(135deg, #f5d67b 0%, #e8b74e 100%)"
            }}
          >
            {TOP3[0] ? initials(TOP3[0]?.name) : "—"}
          </div>
        </div>

        <p className="mt-3 text-[15px] font-semibold text-neutral-900 text-center w-32 truncate">
          {TOP3[0]?.name ?? "—"}
        </p>
        <p className="text-sm text-neutral-700 font-medium">
          {TOP3[0]?.points ?? "--"} pts
        </p>
      </div>

      {/* 3rd place */}
      <div className="flex flex-col items-center mb-2">
        <div className="text-xs text-neutral-500 mb-1">3</div>
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center font-semibold text-white shadow"
          style={{
            background:
              "linear-gradient(135deg, #c8996c 0%, #8a633d 100%)"
          }}
        >
          {TOP3[2] ? initials(TOP3[2]?.name) : "—"}
        </div>
        <p className="mt-2 text-sm font-medium text-neutral-800 text-center w-24 truncate">
          {TOP3[2]?.name ?? "—"}
        </p>
        <p className="text-xs text-neutral-500">{TOP3[2]?.points ?? "--"} pts</p>
      </div>
    </div>
  </div>

  {/* MOBILE PODIUM (CLEANER + COMPACT) */}
  <div className="lg:hidden mt-4">
    <h2 className="text-sm font-semibold text-neutral-800 mb-3">Top 3</h2>

    <div className="grid grid-cols-3 gap-3 px-2 text-center">

      {[0, 1, 2].map((i) => (
        <div key={i} className="flex flex-col items-center">
          <div className="text-xs text-neutral-500">{i + 1}</div>

          <div
            className="w-12 h-12 rounded-full flex items-center justify-center font-semibold text-white mt-1 shadow"
            style={{
              background:
                i === 0
                  ? "linear-gradient(135deg, #f5d67b, #e8b74e)"
                  : i === 1
                  ? "linear-gradient(135deg, #d2d3d5, #b4b5b7)"
                  : "linear-gradient(135deg, #c8996c, #8a633d)"
            }}
          >
            {TOP3[i] ? initials(TOP3[i]?.name) : "—"}
          </div>

          <div className="mt-1 text-xs font-medium text-neutral-800 truncate max-w-[70px]">
            {TOP3[i]?.name ?? "—"}
          </div>

          <div className="text-[11px] text-neutral-500">
            {TOP3[i]?.points ?? "--"} pts
          </div>
        </div>
      ))}
    </div>
  </div>
</aside>

        </div>
      </div>
    </div>
  );
}
