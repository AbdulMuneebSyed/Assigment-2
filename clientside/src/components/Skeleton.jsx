import React from "react";

// Base skeleton component with shimmer animation
const Skeleton = ({ className = "", ...props }) => {
  return (
    <div
      className={`animate-pulse bg-gray-200 ${className}`}
      {...props}
    />
  );
};

// Video card skeleton
export const VideoCardSkeleton = () => {
  return (
    <div className="video-card-brutal">
      {/* Thumbnail skeleton */}
      <div className="relative video-card-brutal-thumbnail flex items-center justify-center bg-gray-200 animate-pulse">
        <div className="w-10 h-10 bg-gray-300 rounded" />
        {/* Status badge skeleton */}
        <div className="absolute top-2 right-2">
          <Skeleton className="w-16 h-6 border-2 border-gray-300" />
        </div>
        {/* Duration skeleton */}
        <div className="absolute bottom-2 right-2">
          <Skeleton className="w-12 h-6 bg-gray-400" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="video-card-brutal-content">
        {/* Title */}
        <Skeleton className="h-6 w-3/4 mb-2" />
        
        {/* Uploader */}
        <div className="flex items-center gap-1 mb-2">
          <Skeleton className="w-4 h-4 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>

        {/* Original name */}
        <Skeleton className="h-4 w-full mb-3" />

        {/* Meta info */}
        <div className="flex items-center gap-4 mb-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>

        {/* Confidence bar */}
        <div className="mb-3">
          <div className="flex justify-between mb-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-8" />
          </div>
          <Skeleton className="h-2 w-full border-2 border-gray-300" />
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <Skeleton className="flex-1 h-9 border-3 border-gray-300" />
          <Skeleton className="w-10 h-9 border-3 border-gray-300" />
        </div>
      </div>
    </div>
  );
};

// Grid of video card skeletons
export const VideoGridSkeleton = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <VideoCardSkeleton key={index} />
      ))}
    </div>
  );
};

// Table row skeleton
export const TableRowSkeleton = ({ columns = 5 }) => {
  return (
    <tr className="border-b-3 border-brutal-black">
      {Array.from({ length: columns }).map((_, index) => (
        <td key={index} className="p-4">
          <Skeleton className="h-5 w-full" />
        </td>
      ))}
    </tr>
  );
};

// Table skeleton
export const TableSkeleton = ({ rows = 5, columns = 5 }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-3 border-brutal-black">
        <thead>
          <tr className="bg-brutal-yellow border-b-3 border-brutal-black">
            {Array.from({ length: columns }).map((_, index) => (
              <th key={index} className="p-4 text-left">
                <Skeleton className="h-5 w-24 bg-yellow-300" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, index) => (
            <TableRowSkeleton key={index} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Stats card skeleton
export const StatsCardSkeleton = () => {
  return (
    <div className="card-brutal p-6">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="w-12 h-12 rounded" />
        <Skeleton className="w-16 h-6" />
      </div>
      <Skeleton className="h-8 w-20 mb-2" />
      <Skeleton className="h-4 w-32" />
    </div>
  );
};

// Stats grid skeleton
export const StatsGridSkeleton = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <StatsCardSkeleton key={index} />
      ))}
    </div>
  );
};

// Page header skeleton
export const PageHeaderSkeleton = () => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <Skeleton className="h-9 w-48 mb-2" />
        <Skeleton className="h-5 w-64" />
      </div>
      <Skeleton className="h-12 w-36 border-3 border-gray-300" />
    </div>
  );
};

// Tabs skeleton
export const TabsSkeleton = ({ count = 4 }) => {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} className="h-10 w-28 border-3 border-gray-300" />
      ))}
    </div>
  );
};

// Full page skeleton for Library
export const LibraryPageSkeleton = () => {
  return (
    <>
      <TabsSkeleton count={5} />
      <div className="card-brutal mb-6 p-4">
        <Skeleton className="h-12 w-full mb-4" />
        <div className="flex gap-4">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-44" />
        </div>
      </div>
      <VideoGridSkeleton count={8} />
    </>
  );
};

// Dashboard page skeleton
export const DashboardPageSkeleton = () => {
  return (
    <>
      {/* Header skeleton */}
      <div className="mb-8">
        <Skeleton className="h-9 w-64 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card-brutal">
            <div className="flex items-start justify-between">
              <div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="w-12 h-12 border-3 border-gray-300" />
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="card-brutal">
            <div className="flex items-center gap-4">
              <Skeleton className="w-16 h-16 border-4 border-gray-300" />
              <div>
                <Skeleton className="h-6 w-40 mb-2" />
                <Skeleton className="h-4 w-56" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent videos skeleton */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-24 border-3 border-gray-300" />
        </div>
        <VideoGridSkeleton count={4} />
      </div>
    </>
  );
};

// Admin page skeleton
export const AdminPageSkeleton = () => {
  return (
    <>
      {/* Header skeleton */}
      <div className="mb-8">
        <Skeleton className="h-9 w-48 mb-2" />
        <Skeleton className="h-5 w-64" />
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card-brutal">
            <div className="flex items-start justify-between">
              <div>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-7 w-14" />
              </div>
              <Skeleton className="w-10 h-10 border-3 border-gray-300" />
            </div>
          </div>
        ))}
      </div>

      {/* Video stats skeleton */}
      <div className="card-brutal mb-8">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 border-3 border-gray-300 text-center">
              <Skeleton className="h-8 w-12 mx-auto mb-2" />
              <Skeleton className="h-4 w-16 mx-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* User management skeleton */}
      <div className="card-brutal">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <Skeleton className="h-6 w-40" />
          <div className="flex gap-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <TableSkeleton rows={5} columns={6} />
      </div>
    </>
  );
};

export default Skeleton;
