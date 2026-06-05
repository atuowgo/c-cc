import { Minus, Square, X } from 'lucide-react'
import { cn } from '@renderer/lib/utils'

export default function TitleBar(): React.JSX.Element {
  const isMac = navigator.platform.toLowerCase().includes('mac')

  return (
    <div
      className={cn(
        'flex items-center h-8 bg-[#161b22] border-b border-[#30363d] select-none flex-shrink-0',
        '[-webkit-app-region:drag]'
      )}
    >
      {/* macOS traffic light spacing */}
      {isMac && <div className="w-[70px]" />}

      {/* Logo + Name */}
      <div className="flex items-center gap-2 px-3 flex-1">
        <div className="w-4 h-4 rounded-sm bg-[#D4774C] flex items-center justify-center">
          <span className="text-[10px] font-bold text-white">C</span>
        </div>
        <span className="text-xs text-gray-400 font-medium">cc-bot</span>
      </div>

      {/* Window Controls */}
      {!isMac && (
        <div className="flex [-webkit-app-region:no-drag]">
          <button
            onClick={() => window.claudeAPI.window.minimize()}
            className="w-10 h-8 flex items-center justify-center hover:bg-[#30363d] text-gray-400 hover:text-gray-200 transition-colors"
          >
            <Minus size={14} />
          </button>
          <button
            onClick={() => window.claudeAPI.window.maximize()}
            className="w-10 h-8 flex items-center justify-center hover:bg-[#30363d] text-gray-400 hover:text-gray-200 transition-colors"
          >
            <Square size={12} />
          </button>
          <button
            onClick={() => window.claudeAPI.window.close()}
            className="w-10 h-8 flex items-center justify-center hover:bg-red-600 text-gray-400 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  )
}