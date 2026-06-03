// Icon.jsx — 内联 SVG 图标集
import React from 'react';

function FdIcon({ name, size = 16, color = 'currentColor', sw = 1.5 }) {
  const p = { fill: 'none', stroke: color, strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const box = '0 0 24 24';
  const icons = {
    plus: <svg width={size} height={size} viewBox={box}><line x1="12" y1="5" x2="12" y2="19" {...p} /><line x1="5" y1="12" x2="19" y2="12" {...p} /></svg>,
    x: <svg width={size} height={size} viewBox={box}><line x1="6" y1="6" x2="18" y2="18" {...p} /><line x1="18" y1="6" x2="6" y2="18" {...p} /></svg>,
    check: <svg width={size} height={size} viewBox={box}><polyline points="4,12 9,17 20,6" {...p} /></svg>,
    flag: <svg width={size} height={size} viewBox={box}><path d="M4 3v18" {...p} /><path d="M4 3l12 5-12 5" {...p} fill={color} fillOpacity={0.15} /></svg>,
    play: <svg width={size} height={size} viewBox={box}><polygon points="7,4 19,12 7,20" fill={color} stroke="none" /></svg>,
    pause: <svg width={size} height={size} viewBox={box}><rect x="6" y="4" width="3" height="16" rx="1" fill={color} stroke="none" /><rect x="15" y="4" width="3" height="16" rx="1" fill={color} stroke="none" /></svg>,
    reset: <svg width={size} height={size} viewBox={box}><path d="M3 12a9 9 0 0115.4-6.3M21 12a9 9 0 01-15.4 6.3" {...p} /><path d="M18.4 2.7v3h3M5.6 21.3v-3h-3" {...p} /></svg>,
    gear: <svg width={size} height={size} viewBox={box}><circle cx="12" cy="12" r="3" {...p} /><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42m12.72-12.72l1.42-1.42" {...p} /></svg>,
    archive: <svg width={size} height={size} viewBox={box}><rect x="2" y="3" width="20" height="4" rx="1" {...p} /><path d="M4 7v11a2 2 0 002 2h12a2 2 0 002-2V7" {...p} /><path d="M10 12h4" {...p} /></svg>,
    chart: <svg width={size} height={size} viewBox={box}><rect x="4" y="12" width="3" height="8" rx="1" fill={color} stroke="none" /><rect x="10.5" y="6" width="3" height="14" rx="1" fill={color} stroke="none" /><rect x="17" y="9" width="3" height="11" rx="1" fill={color} stroke="none" /></svg>,
    trash: <svg width={size} height={size} viewBox={box}><path d="M4 7h16M10 11v6m4-6v6M6 7V5a2 2 0 012-2h8a2 2 0 012 2v2M6 7v12a2 2 0 002 2h8a2 2 0 002-2V7" {...p} /></svg>,
    copy: <svg width={size} height={size} viewBox={box}><rect x="8" y="8" width="12" height="12" rx="2" {...p} /><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" {...p} /></svg>,
    chevDown: <svg width={size} height={size} viewBox={box}><polyline points="6,9 12,15 18,9" {...p} /></svg>,
    calendar: <svg width={size} height={size} viewBox={box}><rect x="3" y="4" width="18" height="18" rx="2" {...p} /><path d="M3 10h18M8 2v4m8-4v4" {...p} /></svg>,
    sun: <svg width={size} height={size} viewBox={box}><circle cx="12" cy="12" r="5" {...p} /><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42m12.72-12.72l1.42-1.42" {...p} /></svg>,
    list: <svg width={size} height={size} viewBox={box}><path d="M4 6h16M4 12h16M4 18h16" {...p} /></svg>,
    timer: <svg width={size} height={size} viewBox={box}><circle cx="12" cy="13" r="8" {...p} /><path d="M12 9v4l2.5 1.5M10 1h4" {...p} /></svg>,
    skipFwd: <svg width={size} height={size} viewBox={box}><polygon points="5,4 15,12 5,20" fill={color} stroke="none" /><line x1="19" y1="5" x2="19" y2="19" {...p} strokeWidth={2} /></svg>,
  };
  return icons[name] || null;
}

export { FdIcon };
