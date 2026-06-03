// EmptyState.jsx — 共享的空状态插画卡片
import React from 'react';

function EmptyState({ src, title, subtitle, theme }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%', minHeight: 280,
      padding: '32px 20px', gap: 4, textAlign: 'center',
    }}>
      <img src={src} width={200} height={200} alt=""
        style={{ objectFit: 'contain', userSelect: 'none' }} />
      <div style={{ fontSize: 15, fontWeight: 600, color: theme.text, marginTop: 12 }}>
        {title}
      </div>
      <div style={{ fontSize: 13, color: theme.muted, marginTop: 2 }}>
        {subtitle}
      </div>
    </div>
  );
}

export { EmptyState };
