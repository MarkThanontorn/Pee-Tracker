import type { ReactNode, SVGProps } from 'react';
import type { DrinkType } from '../time';

type P = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 22, children, ...rest }: P & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const DropIcon = (p: P) => (
  <Svg {...p}>
    <path d="M12 3.5s-6 6.4-6 10.9a6 6 0 0 0 12 0C18 9.9 12 3.5 12 3.5z" />
    <path d="M9.2 15a3 3 0 0 0 2.6 2.6" />
  </Svg>
);

export const CoffeeIcon = (p: P) => (
  <Svg {...p}>
    <path d="M4.5 9.5h11v4.5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z" />
    <path d="M15.5 10.5h1.3a2.6 2.6 0 0 1 0 5.2h-1.6" />
    <path d="M8 3.5c-.6.8-.6 1.7 0 2.5M11.5 3.5c-.6.8-.6 1.7 0 2.5" />
  </Svg>
);

export const WineIcon = (p: P) => (
  <Svg {...p}>
    <path d="M7.5 3.5h9l-.6 5.2a3.9 3.9 0 0 1-7.8 0z" />
    <path d="M8 8h8" />
    <path d="M12 12.6v7.4M8.5 20.5h7" />
  </Svg>
);

export const GlassIcon = (p: P) => (
  <Svg {...p}>
    <path d="M6 3.5h12l-1.6 16a1 1 0 0 1-1 .9H8.6a1 1 0 0 1-1-.9z" />
    <path d="M6.8 10c1.7-.8 3.5-.8 5.2 0s3.5.8 5.2 0" />
  </Svg>
);

export const ChartIcon = (p: P) => (
  <Svg {...p}>
    <path d="M4 4v16h16" />
    <path d="M8 15l3.2-4 3 2.4L19 7.5" />
  </Svg>
);

export const ListIcon = (p: P) => (
  <Svg {...p}>
    <path d="M9 6.5h11M9 12h11M9 17.5h11" />
    <circle cx="4.5" cy="6.5" r=".6" fill="currentColor" />
    <circle cx="4.5" cy="12" r=".6" fill="currentColor" />
    <circle cx="4.5" cy="17.5" r=".6" fill="currentColor" />
  </Svg>
);

export const SlidersIcon = (p: P) => (
  <Svg {...p}>
    <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
    <circle cx="15" cy="7" r="2" />
    <circle cx="9" cy="17" r="2" />
  </Svg>
);

export const MoonIcon = (p: P) => (
  <Svg {...p}>
    <path d="M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5a7.5 7.5 0 1 0 10 10z" />
  </Svg>
);

export const SunIcon = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
  </Svg>
);

export const ClockIcon = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Svg>
);

export const PlusIcon = (p: P) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const ChevronLeft = (p: P) => (
  <Svg {...p}>
    <path d="M14.5 6l-6 6 6 6" />
  </Svg>
);

export const ChevronRight = (p: P) => (
  <Svg {...p}>
    <path d="M9.5 6l6 6-6 6" />
  </Svg>
);

export const AlertIcon = (p: P) => (
  <Svg {...p}>
    <path d="M12 4l9 15.5H3z" />
    <path d="M12 10v4M12 16.8v.2" />
  </Svg>
);

export const InfoIcon = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5M12 8v.2" />
  </Svg>
);

export const CheckIcon = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M8.5 12.2l2.4 2.3 4.6-4.8" />
  </Svg>
);

export const DRINK_ICON: Record<DrinkType, (p: P) => JSX.Element> = {
  coffee: CoffeeIcon,
  alcohol: WineIcon,
  water: GlassIcon,
};
