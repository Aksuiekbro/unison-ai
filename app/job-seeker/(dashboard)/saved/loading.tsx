export default function Loading() {
  return (
    <div className="flex-1 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="h-8 bg-gray-200 rounded animate-pulse mb-6 w-48"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg border">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="h-6 bg-gray-200 rounded animate-pulse mb-2 w-48"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                </div>
                <div className="h-8 bg-gray-200 rounded animate-pulse w-20"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
