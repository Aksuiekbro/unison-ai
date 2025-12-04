export default function Loading() {
  return (
    <div className="flex-1 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="h-8 bg-gray-200 rounded animate-pulse mb-8 w-48"></div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Filters Sidebar Skeleton */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg border">
              <div className="h-6 bg-gray-200 rounded animate-pulse mb-6 w-24"></div>
              <div className="space-y-6">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                    <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
                  </div>
                ))}
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Job Results Skeleton */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
              <div className="h-10 bg-gray-200 rounded animate-pulse w-48"></div>
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white p-6 rounded-lg border">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="h-6 bg-gray-200 rounded animate-pulse mb-2 w-64"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse mb-4 w-96"></div>
                      <div className="h-16 bg-gray-100 rounded animate-pulse mb-4"></div>
                      <div className="flex gap-2">
                        <div className="h-6 bg-gray-200 rounded animate-pulse w-16"></div>
                        <div className="h-6 bg-gray-200 rounded animate-pulse w-20"></div>
                        <div className="h-6 bg-gray-200 rounded animate-pulse w-24"></div>
                      </div>
                    </div>
                    <div className="ml-6 text-center">
                      <div className="h-24 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg mb-2 w-28"></div>
                      <div className="h-10 bg-gray-200 rounded animate-pulse w-28"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
