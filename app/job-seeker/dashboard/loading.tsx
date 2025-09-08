export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar Skeleton */}
        <div className="w-64 bg-white shadow-sm border-r">
          <div className="p-6">
            <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <nav className="px-4 space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center px-4 py-3 rounded-lg">
                <div className="w-5 h-5 bg-gray-200 rounded mr-3 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse flex-1"></div>
              </div>
            ))}
          </nav>
        </div>

        {/* Main Content Skeleton */}
        <div className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            <div className="h-8 bg-gray-200 rounded animate-pulse mb-8"></div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Application Status Card */}
                <div className="bg-white p-6 rounded-lg border">
                  <div className="h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-4 w-3/4"></div>
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3"></div>
                        </div>
                        <div className="w-20 h-6 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Profile Progress Card */}
                <div className="bg-white p-6 rounded-lg border">
                  <div className="h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-4 w-3/4"></div>
                  <div className="space-y-4">
                    <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg border">
                  <div className="h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-4 w-3/4"></div>
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="p-4 border rounded-lg">
                        <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse mb-2 w-1/2"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse mb-3 w-2/3"></div>
                        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
