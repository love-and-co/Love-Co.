import React from 'react';

export default function AdminWorkspaceSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE6DF]">
        <div className="space-y-2">
          <div className="h-3 w-28 rounded bg-[#EAE6DF]" />
          <div className="h-7 w-56 rounded bg-[#E8E3EE]" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-28 rounded-xl bg-[#EAE6DF]" />
          <div className="h-9 w-36 rounded-xl bg-[#E8E3EE]" />
        </div>
      </div>

      {/* KPI cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((idx) => (
          <div
            key={idx}
            className="bg-white border border-[#EAE6DF] rounded-2xl p-5 space-y-3"
          >
            <div className="h-3 w-24 rounded bg-[#EAE6DF]" />
            <div className="h-7 w-20 rounded bg-[#E8E3EE]" />
            <div className="h-2.5 w-32 rounded bg-[#FAF9F8]" />
          </div>
        ))}
      </div>

      {/* Main table/panel skeleton */}
      <div className="bg-white border border-[#EAE6DF] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#EAE6DF] flex items-center justify-between">
          <div className="h-4 w-40 rounded bg-[#EAE6DF]" />
          <div className="h-8 w-52 rounded-lg bg-[#FAF9F8] border border-[#EAE6DF]" />
        </div>
        <div className="divide-y divide-[#EAE6DF]">
          {[0, 1, 2, 3, 4].map((row) => (
            <div key={row} className="px-6 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="h-10 w-10 rounded-xl bg-[#FAF9F8] border border-[#EAE6DF]" />
                <div className="space-y-2 flex-1 max-w-xs">
                  <div className="h-3.5 w-3/4 rounded bg-[#EAE6DF]" />
                  <div className="h-2.5 w-1/2 rounded bg-[#FAF9F8]" />
                </div>
              </div>
              <div className="h-6 w-20 rounded-full bg-[#E8E3EE]" />
              <div className="h-4 w-16 rounded bg-[#EAE6DF]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

