export function BoardSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto p-6">
      {Array.from({ length: 4 }).map((_, col) => (
        <div key={col} className="flex w-72 shrink-0 flex-col gap-2">
          <div className="h-6 w-24 animate-pulse rounded bg-muted" />
          {Array.from({ length: 3 }).map((_, card) => (
            <div
              key={card}
              className="h-20 animate-pulse rounded-lg bg-muted"
              style={{ animationDelay: `${(col + card) * 80}ms` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
