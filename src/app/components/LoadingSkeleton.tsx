export function LoadingSkeleton() {
  return (
    <div className="mx-auto mt-8 w-full max-w-6xl animate-pulse space-y-6 px-6 lg:px-10">
      <div className="mb-8 space-y-3">
        <div className="h-8 w-1/3 rounded-xl bg-[#DCE6F1]" />
        <div className="h-4 w-1/2 rounded-xl bg-[#E9EFF6]" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="rounded-[24px] border border-[#D6DEE8] bg-white p-5 shadow-md">
            <div className="mb-4 flex gap-2">
              <div className="h-5 w-16 rounded-full bg-[#EEF3F8]" />
              <div className="h-5 w-16 rounded-full bg-[#EEF3F8]" />
            </div>
            <div className="mb-3 h-5 w-3/4 rounded-xl bg-[#DCE6F1]" />
            <div className="mb-2 h-4 w-full rounded-xl bg-[#EEF3F8]" />
            <div className="mb-6 h-4 w-5/6 rounded-xl bg-[#EEF3F8]" />
            <div className="mt-auto flex items-center justify-between border-t border-[#EEF3F8] pt-4">
              <div className="h-4 w-20 rounded-xl bg-[#EEF3F8]" />
              <div className="h-4 w-24 rounded-xl bg-[#EEF3F8]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
