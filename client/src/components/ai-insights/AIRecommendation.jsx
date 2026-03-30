export default function AIRecommendation({ ai }) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 dark:bg-[#111827] dark:shadow-[0_12px_32px_rgba(0,0,0,0.28)] md:p-6">
      <div className="mb-4">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">AI Recommendation</p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Decision support, not noise.</p>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">Summary</p>
          <p className="mt-2 text-sm leading-6 text-gray-900 dark:text-white">{ai.summary}</p>
        </div>

        <div className="rounded-2xl bg-blue-50 px-4 py-4 dark:bg-blue-500/10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">Action</p>
          <p className="mt-2 text-sm leading-6 text-gray-900 dark:text-white">{ai.action}</p>
        </div>
      </div>
    </section>
  );
}