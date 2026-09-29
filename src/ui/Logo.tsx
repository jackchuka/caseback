import { useId } from 'react';

// The mark from public/favicon.svg without its dark disc: a screw-down caseback ring around a spoked wheel.
const TEETH = 12;
const ROOT = 11;
const TIP = 15;
const at = (r: number, t: number) => `${(32 + r * Math.sin(t)).toFixed(2)} ${(32 - r * Math.cos(t)).toFixed(2)}`;
const GEAR = `${Array.from({ length: TEETH }, (_, i) => {
  const a = (i * 2 * Math.PI) / TEETH;
  const w = Math.PI / TEETH;
  return `${i ? 'L' : 'M'}${at(ROOT, a - w * 0.55)}L${at(TIP, a - w * 0.32)}L${at(TIP, a + w * 0.32)}L${at(ROOT, a + w * 0.55)}A${ROOT} ${ROOT} 0 0 1 ${at(ROOT, a + w * 1.45)}`;
}).join('')}ZM32 24a8 8 0 1 0 0 16a8 8 0 1 0 0-16Z`;

export function Logo({ size = 20 }: { size?: number }) {
  const mask = useId();
  return (
    <svg className="logo" viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <mask id={mask}>
        <rect width="64" height="64" fill="#fff" />
        {[30, 90, 150, 210, 270, 330].map((deg) => (
          <rect key={deg} x="29.5" y="1" width="5" height="7.5" rx="1" transform={`rotate(${deg} 32 32)`} />
        ))}
      </mask>
      <g fill="currentColor">
        <circle cx="32" cy="32" r="24.5" fill="none" stroke="currentColor" strokeWidth="6" mask={`url(#${mask})`} />
        <path fillRule="evenodd" d={GEAR} />
        {[0, 72, 144, 216, 288].map((deg) => (
          <rect key={deg} x="31" y="23" width="2" height="9" transform={`rotate(${deg} 32 32)`} />
        ))}
        <circle cx="32" cy="32" r="3" />
      </g>
    </svg>
  );
}
