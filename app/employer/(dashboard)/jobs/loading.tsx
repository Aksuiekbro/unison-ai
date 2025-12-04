export default function Loading() {
  return (
    <div className="flex-1 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="h-8 bg-gray-200 rounded animate-pulse w-32"></div>
          <div className="h-10 bg-gray-200 rounded animate-pulse w-36"></div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg border">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="h-6 bg-gray-200 rounded animate-pulse mb-2 w-56"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-40"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded animate-pulse w-20"></div>
              </div>
              <div className="flex gap-2">
                <div className="h-6 bg-gray-200 rounded animate-pulse w-16"></div>
                <div className="h-6 bg-gray-200 rounded animate-pulse w-24"></div>
                <div className="h-6 bg-gray-200 rounded animate-pulse w-20"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
