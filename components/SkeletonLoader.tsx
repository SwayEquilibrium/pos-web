'use client'

interface SkeletonProps {
  className?: string
  width?: string
  height?: string
}

export function Skeleton({ className = '', width, height }: SkeletonProps) {
  const style = {
    width: width || '100%',
    height: height || '1rem'
  }

  return (
    <div 
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      style={style}
    />
  )
}

// Common skeleton patterns
export function CardSkeleton() {
  return (
    <div className="border rounded-lg p-6 space-y-4">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton height="1rem" width="60%" />
          <Skeleton height="0.75rem" width="40%" />
        </div>
      </div>
      <Skeleton height="4rem" />
      <div className="flex space-x-2">
        <Skeleton height="2rem" width="5rem" />
        <Skeleton height="2rem" width="5rem" />
      </div>
    </div>
  )
}

export function TableRowSkeleton() {
  return (
    <tr className="border-b">
      <td className="p-4"><Skeleton height="1rem" width="80%" /></td>
      <td className="p-4"><Skeleton height="1rem" width="60%" /></td>
      <td className="p-4"><Skeleton height="1rem" width="40%" /></td>
      <td className="p-4"><Skeleton height="2rem" width="6rem" /></td>
    </tr>
  )
}

export function NavigationSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-3">
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton height="1rem" width={`${60 + (i * 10)}%`} />
        </div>
      ))}
    </div>
  )
}

export function PaymentMethodSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="border rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-3">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton height="1.25rem" width="70%" />
          </div>
          <Skeleton height="0.875rem" width="90%" className="mb-2" />
          <div className="flex justify-between items-center">
            <Skeleton height="1.5rem" width="4rem" />
            <div className="flex space-x-2">
              <Skeleton height="2rem" width="4rem" />
              <Skeleton height="2rem" width="4rem" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function ModuleSkeleton() {
  return (
    <div className="space-y-8">
      {[...Array(3)].map((categoryIndex) => (
        <div key={categoryIndex} className="space-y-4">
          <div className="border-l-4 border-gray-300 pl-4">
            <Skeleton height="1.5rem" width="30%" className="mb-2" />
            <Skeleton height="1rem" width="60%" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, moduleIndex) => (
              <div key={moduleIndex} className="border rounded-lg p-6">
                <div className="flex items-start justify-between mb-3">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                </div>
                <Skeleton height="1.25rem" width="80%" className="mb-2" />
                <Skeleton height="0.875rem" width="100%" className="mb-4" />
                <Skeleton height="2rem" width="100%" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
