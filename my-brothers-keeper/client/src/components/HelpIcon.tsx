import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";
import { ReactNode } from "react";

interface HelpIconProps {
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
}

export function HelpIcon({ children, side = "top", className = "" }: HelpIconProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={`inline-flex items-center justify-center rounded-full p-0.5 text-gray-400 hover:text-teal-500 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${className}`}
          aria-label="Help"
        >
          <HelpCircle className="size-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side={side}
        className="max-w-sm bg-gray-900 text-white border-gray-700 p-3 rounded-lg shadow-lg"
        sideOffset={5}
      >
        <div className="text-sm leading-relaxed">{children}</div>
      </TooltipContent>
    </Tooltip>
  );
}
