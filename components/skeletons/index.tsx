export function OrderSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="space-y-3">
        <div className="h-10 w-48 rounded-lg bg-slate-800" />
        <div className="h-5 w-96 rounded-lg bg-slate-800" />
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="surface-glass rounded-2xl border border-slate-700/50 p-6">
            <div className="h-4 w-24 rounded bg-slate-700" />
            <div className="mt-3 h-8 w-20 rounded bg-slate-700" />
          </div>
        ))}
      </div>

      {/* Location Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="surface-glass rounded-2xl border border-slate-700/50 p-6">
            <div className="h-6 w-32 rounded bg-slate-700" />
            <div className="mt-3 h-4 w-full rounded bg-slate-700" />
            <div className="mt-2 h-4 w-3/4 rounded bg-slate-700" />
          </div>
        ))}
      </div>

      {/* Package Details */}
      <div className="surface-glass rounded-2xl border border-slate-700/50 p-6">
        <div className="h-6 w-40 rounded bg-slate-700" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i}>
              <div className="h-4 w-24 rounded bg-slate-700" />
              <div className="mt-2 h-4 w-32 rounded bg-slate-700" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DriverSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="surface-glass rounded-2xl border border-slate-700/50 p-8">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-2xl bg-slate-700" />
          <div className="flex-1">
            <div className="h-8 w-32 rounded bg-slate-700" />
            <div className="mt-2 h-4 w-24 rounded bg-slate-700" />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="surface-glass rounded-2xl border border-slate-700/50 p-6">
            <div className="h-4 w-32 rounded bg-slate-700" />
            <div className="mt-3 h-8 w-20 rounded bg-slate-700" />
          </div>
        ))}
      </div>

      {/* Details */}
      <div className="surface-glass rounded-2xl border border-slate-700/50 p-6">
        <div className="h-6 w-40 rounded bg-slate-700" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-4 w-full rounded bg-slate-700" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Header */}
      <div className="h-10 w-full rounded-lg bg-slate-800" />

      {/* Rows */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="h-12 flex-1 rounded-lg bg-slate-800" />
          <div className="h-12 w-32 rounded-lg bg-slate-800" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="surface-glass rounded-2xl border border-slate-700/50 p-6 animate-pulse">
      <div className="h-6 w-40 rounded bg-slate-700" />
      <div className="mt-4 space-y-3">
        <div className="h-4 w-full rounded bg-slate-700" />
        <div className="h-4 w-3/4 rounded bg-slate-700" />
        <div className="h-4 w-1/2 rounded bg-slate-700" />
      </div>
    </div>
  );
}
