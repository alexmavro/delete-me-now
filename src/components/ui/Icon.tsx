// Inline stroke icons. currentColor + 24-grid so they scale and theme; no icon-font dependency.
import { SVGProps } from 'react';

export type IconName =
  | 'overview' | 'list' | 'check' | 'send' | 'clock' | 'alert' | 'filter'
  | 'search' | 'plus' | 'chevronDown' | 'settings' | 'bell' | 'sun' | 'moon'
  | 'user' | 'trash' | 'x' | 'shield' | 'command' | 'arrowRight' | 'download';

const PATHS: Record<IconName, JSX.Element> = {
  overview: <><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></>,
  list: <path d="M3 6h18M3 12h18M3 18h12"/>,
  check: <path d="M20 6 9 17l-5-5"/>,
  send: <path d="m22 2-7 20-4-9-9-4Z"/>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  alert: <><path d="m21.7 16.4-8-13.6a2 2 0 0 0-3.4 0l-8 13.6A2 2 0 0 0 4 19h16a2 2 0 0 0 1.7-2.6Z"/><path d="M12 10v3M12 17h.01"/></>,
  filter: <path d="M3 6h18M7 12h10M11 18h2"/>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></>,
  plus: <path d="M12 5v14M5 12h14"/>,
  chevronDown: <path d="m6 9 6 6 6-6"/>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></>,
  bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a2 2 0 0 0 3.4 0"/></>,
  sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>,
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
  trash: <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>,
  x: <path d="M18 6 6 18M6 6l12 12"/>,
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>,
  command: <path d="M15 6a3 3 0 1 1 3 3h-3V6ZM9 6a3 3 0 1 0-3 3h3V6Zm0 12a3 3 0 1 0 3-3H9v3Zm6 0a3 3 0 1 0-3-3v3h3Z"/>,
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6"/>,
  download: <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14"/>,
};

interface Props extends SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 16, ...rest }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
