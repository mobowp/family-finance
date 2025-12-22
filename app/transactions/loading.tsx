export default function TransactionsLoading() {
  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <div className="h-9 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          <div className="h-5 w-64 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          <div className="h-10 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        
        <div className="border rounded-lg overflow-hidden">
          <div className="h-14 bg-slate-100 dark:bg-slate-900 border-b" />
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-16 border-b last:border-0 bg-white dark:bg-slate-950 flex items-center px-6 gap-4">
              <div className="h-4 w-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
              <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
              <div className="h-4 flex-1 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
              <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
              <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
