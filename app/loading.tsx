import { CardSkeleton } from '@/components/skeletons';

export default function Loading() {
  return (
    <div className="bg-background px-3 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="w-full space-y-6">
        {/* Header Skeleton */}
        <div className="space-y-3 animate-pulse">
          <div className="h-10 w-48 rounded-md bg-muted" />
          <div className="h-5 w-96 rounded-md bg-muted" />
        </div>

        {/* Content Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>

        {/* Large Section */}
        <CardSkeleton />
      </div>
    </div>
  );
}
