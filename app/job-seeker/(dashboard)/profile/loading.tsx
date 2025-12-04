export default function Loading() {
  return (
    <div className="flex-1 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="h-8 bg-gray-200 rounded animate-pulse w-48"></div>
          <div className="h-10 bg-gray-200 rounded animate-pulse w-32"></div>
        </div>

        {/* Profile Card Skeleton */}
        <div className="bg-white p-6 rounded-lg border mb-8">
          <div className="h-6 bg-gray-200 rounded animate-pulse mb-4 w-40"></div>
          <div className="space-y-6">
            <div>
              <div className="h-7 bg-gray-200 rounded animate-pulse mb-2 w-60"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-40"></div>
            </div>
            
            <div>
              <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-20"></div>
              <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>

            <div>
              <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-24"></div>
              <div className="flex flex-wrap gap-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-6 bg-gray-200 rounded animate-pulse w-16"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
