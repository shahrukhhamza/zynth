import { useTheme } from '../contexts/ThemeContext';

function LoadingSkeleton() {
  const theme = useTheme();
  const skeletonStyle = { backgroundColor: theme.border };

  return (
    <div className="rounded-lg border p-4 animate-pulse" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="h-6 w-16 rounded" style={skeletonStyle}></div>
        <div className="h-6 w-20 rounded" style={skeletonStyle}></div>
        <div className="h-6 w-24 rounded" style={skeletonStyle}></div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <div className="h-6 rounded mb-2 w-3/4" style={skeletonStyle}></div>
          <div className="h-6 rounded mb-3 w-1/2" style={skeletonStyle}></div>
          
          <div className="h-4 rounded mb-2 w-full" style={skeletonStyle}></div>
          <div className="h-4 rounded mb-3 w-5/6" style={skeletonStyle}></div>

          <div className="flex gap-2">
            <div className="h-6 w-16 rounded-full" style={skeletonStyle}></div>
            <div className="h-6 w-20 rounded-full" style={skeletonStyle}></div>
            <div className="h-6 w-16 rounded-full" style={skeletonStyle}></div>
          </div>
        </div>

        <div className="w-32 h-32 rounded-lg flex-shrink-0" style={skeletonStyle}></div>
      </div>

      <div className="mt-3 pt-3 border-t" style={{ borderColor: theme.border }}>
        <div className="flex justify-between">
          <div className="h-4 w-24 rounded" style={skeletonStyle}></div>
          <div className="h-4 w-32 rounded" style={skeletonStyle}></div>
        </div>
      </div>
    </div>
  );
}

export default LoadingSkeleton;
