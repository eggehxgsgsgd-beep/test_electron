// themes.js — 主题定义与设计常量(FD_THEMES + 标签颜色 / 计划日期辅助)
const FD_THEMES = {
  clarity: {
    name: '清透', id: 'clarity',
    font: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif',
    mono: '"SF Mono", "Cascadia Mono", Consolas, monospace',
    bg: '#ffffff', side: '#f7f7f6', elev: '#ffffff',
    text: '#18181b', sub: '#71717a', muted: '#a1a1aa',
    accent: '#3b82f6', accentH: '#2563eb',
    accentBg: 'rgba(59,130,246,0.07)', accentGlow: 'rgba(59,130,246,0.14)',
    border: '#e4e4e7', borderL: '#f4f4f5', hov: '#f4f4f5',
    flag: '#eab308', flagBg: 'rgba(234,179,8,0.08)',
    done: '#c0c0bb', err: '#ef4444', errBg: 'rgba(239,68,68,0.06)',
    ok: '#22c55e', okBg: 'rgba(34,197,94,0.07)',
    tags: { '工作': '#3b82f6', '开发': '#10b981', '设计': '#ec4899', '个人': '#8b5cf6' },
    winShadow: '0 0 0 .5px rgba(0,0,0,.08), 0 20px 50px rgba(0,0,0,.12)',
    deskBg: 'linear-gradient(140deg, #e5e3de 0%, #d5d2cc 50%, #e0ddd8 100%)',
  },
  dusk: {
    name: '暮色', id: 'dusk',
    font: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif',
    mono: '"SF Mono", "Cascadia Mono", Consolas, monospace',
    bg: '#111114', side: '#18181e', elev: '#1c1c24',
    text: '#dddde4', sub: '#7e7e9a', muted: '#4a4a5e',
    accent: '#f59e0b', accentH: '#d97706',
    accentBg: 'rgba(245,158,11,0.09)', accentGlow: 'rgba(245,158,11,0.18)',
    border: '#28283a', borderL: '#1e1e2a', hov: '#20202c',
    flag: '#eab308', flagBg: 'rgba(234,179,8,0.10)',
    done: '#3e3e4c', err: '#f87171', errBg: 'rgba(248,113,113,0.08)',
    ok: '#4ade80', okBg: 'rgba(74,222,128,0.08)',
    tags: { '工作': '#60a5fa', '开发': '#34d399', '设计': '#f472b6', '个人': '#a78bfa' },
    winShadow: '0 0 0 .5px rgba(255,255,255,.04), 0 20px 50px rgba(0,0,0,.45)',
    deskBg: 'linear-gradient(140deg, #08080c 0%, #0c0c18 50%, #080810 100%)',
  },
  sage: {
    name: '青苔', id: 'sage',
    font: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif',
    mono: '"SF Mono", "Cascadia Mono", Consolas, monospace',
    bg: '#f7f9f4', side: '#edf2e7', elev: '#f7f9f4',
    text: '#1a2e1a', sub: '#4d6a4d', muted: '#8aaa8a',
    accent: '#2d8a4e', accentH: '#1d7a3e',
    accentBg: 'rgba(45,138,78,0.07)', accentGlow: 'rgba(45,138,78,0.14)',
    border: '#d2ddc8', borderL: '#e2ebd8', hov: '#e4ece0',
    flag: '#eab308', flagBg: 'rgba(234,179,8,0.08)',
    done: '#a0b89a', err: '#dc2626', errBg: 'rgba(220,38,38,0.06)',
    ok: '#16a34a', okBg: 'rgba(22,163,74,0.07)',
    tags: { '工作': '#2563eb', '开发': '#059669', '设计': '#db2777', '个人': '#7c3aed' },
    winShadow: '0 0 0 .5px rgba(0,0,0,.06), 0 20px 50px rgba(0,0,0,.09)',
    deskBg: 'linear-gradient(140deg, #c4d4b8 0%, #b4c8a8 50%, #c0d0b4 100%)',
  },
};

const DEFAULT_TAGS = [
  { name: '工作', color: '#3b82f6' },
  { name: '开发', color: '#10b981' },
  { name: '设计', color: '#ec4899' },
  { name: '个人', color: '#8b5cf6' },
];
const QUICK_PLANS = [
  { value: 'today', label: '今天' },
  { value: 'tomorrow', label: '明天' },
  { value: 'thisWeek', label: '本周' },
];

/* Helper: format planDate for display */
function formatPlanDate(val) {
  if (!val) return null;
  const quick = QUICK_PLANS.find(p => p.value === val);
  if (quick) return quick.label;
  // ISO date string → readable
  try {
    const d = new Date(val + 'T00:00:00');
    if (isNaN(d)) return val;
    const now = new Date(); now.setHours(0,0,0,0);
    const diff = Math.round((d - now) / 86400000);
    if (diff === 0) return '今天';
    if (diff === 1) return '明天';
    if (diff === -1) return '昨天';
    return `${d.getMonth()+1}月${d.getDate()}日`;
  } catch { return val; }
}

/* Helper: build tag color map from settings tags */
function buildTagColors(tags) {
  const map = {};
  (tags || DEFAULT_TAGS).forEach(t => { map[t.name] = t.color; });
  return map;
}

export { FD_THEMES, DEFAULT_TAGS, QUICK_PLANS, formatPlanDate, buildTagColors };
