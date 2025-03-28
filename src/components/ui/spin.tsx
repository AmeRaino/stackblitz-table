import React from "react";
import type { SVGProps } from "react";

function DuoIconsAppDots(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        fill="currentColor"
        d="M7 11.5c-3.464 0-5.63-3.75-3.897-6.75A4.5 4.5 0 0 1 7 2.5c3.464 0 5.63 3.75 3.897 6.75A4.5 4.5 0 0 1 7 11.5"
        className="duoicon-primary-layer"
      ></path>
      <path
        fill="currentColor"
        d="M17 21.5c-3.464 0-5.63-3.75-3.897-6.75A4.5 4.5 0 0 1 17 12.5c3.464 0 5.63 3.75 3.897 6.75A4.5 4.5 0 0 1 17 21.5m0-10c-3.464 0-5.63-3.75-3.897-6.75A4.5 4.5 0 0 1 17 2.5c3.464 0 5.63 3.75 3.897 6.75A4.5 4.5 0 0 1 17 11.5m-10 10c-3.464 0-5.63-3.75-3.897-6.75A4.5 4.5 0 0 1 7 12.5c3.464 0 5.63 3.75 3.897 6.75A4.5 4.5 0 0 1 7 21.5"
        className="duoicon-secondary-layer"
        opacity={0.3}
      ></path>
    </svg>
  );
}

interface SpinProps {
  children: React.ReactNode;
  spinning?: boolean;
}

export const Spin = ({ children, spinning = true }: SpinProps) => {
  return (
    <div className="relative">
      <div>{children}</div>
      {spinning && (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-white/70">
          <DuoIconsAppDots className="animate-spin text-primary h-8 w-8 opacity-50" />
        </div>
      )}
    </div>
  );
};
