interface ThinkingLoaderProps {
  width?: number;
  height?: number;
}

// Generic spinner substitute for the app's branded ThinkingLoader.
export const ThinkingLoader = ({width = 93, height = 150}: ThinkingLoaderProps) => (
  <div className="flex items-center justify-center" style={{width, height}}>
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-[#7F4EAD]" />
  </div>
);

export default ThinkingLoader;
