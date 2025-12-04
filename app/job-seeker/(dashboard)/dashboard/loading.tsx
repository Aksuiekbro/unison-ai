export default function Loading() {
  return (
    <div className="flex-1 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="h-8 bg-gray-200 rounded animate-pulse mb-8 w-64"></div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Application Status Card */}
            <div className="bg-white p-6 rounded-lg border">
              <div className="h-6 bg-gray-200 rounded animate-pulse mb-2 w-48"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse mb-4 w-3/4"></div>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-40"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-24"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
                    </div>
                    <div className="w-20 h-6 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Profile Progress Card */}
            <div className="bg-white p-6 rounded-lg border">
              <div className="h-6 bg-gray-200 rounded animate-pulse mb-2 w-40"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse mb-4 w-3/4"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border">
              <div className="h-6 bg-gray-200 rounded animate-pulse mb-2 w-32"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse mb-4 w-3/4"></div>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-4 border rounded-lg">
                    <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-32"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse mb-2 w-24"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse mb-3 w-40"></div>
                    <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
