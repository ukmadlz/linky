export default function PublicPageLoading() {
  return (
    <div className="bio-page" style={{ backgroundColor: "#f7f5f4" }}>
      <div className="flex animate-pulse flex-col items-center gap-4 pt-8">
        {/* Avatar skeleton */}
        <div className="h-24 w-24 rounded-full bg-slate-200" />
        {/* Name skeleton */}
        <div className="h-6 w-40 rounded bg-slate-200" />
        {/* Bio skeleton */}
        <div className="h-4 w-56 rounded bg-slate-200" />
        {/* Block skeletons */}
        <div className="mt-4 w-full space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 w-full rounded-xl bg-slate-200" />
          ))}
        </div>
      </div>
    </div>
  );
}
