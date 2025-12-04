export default function Loading() {
  return (
    <div className="flex-1 p-8">
      <div className="max-w-3xl">
        <div className="h-8 bg-gray-200 rounded animate-pulse mb-6 w-32"></div>
        <div className="space-y-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg border">
              <div className="h-6 bg-gray-200 rounded animate-pulse mb-2 w-40"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse mb-4 w-64"></div>
              <div className="h-10 bg-gray-200 rounded animate-pulse w-32"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
