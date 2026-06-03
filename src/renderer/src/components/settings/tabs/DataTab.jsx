// DataTab.jsx — 数据导出(自包含,走本地 window.focusDo.exportData)
import React from 'react';

function DataTab({ theme }) {
  const [busy, setBusy] = React.useState(false);
  const [lastPath, setLastPath] = React.useState(null);

  const onExport = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await window.focusDo.exportData();
      if (result.ok) {
        setLastPath(result.path);
      } else if ('error' in result && result.error) {
        window.alert(`FocusDo 出错：${result.error}`);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 700, color: theme.text, marginBottom: 16 }}>数据</div>

      <div onClick={onExport}
        onMouseEnter={e => !busy && (e.currentTarget.style.background = theme.hov)}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        style={{
          padding: '12px 14px', borderRadius: 8, marginBottom: 8,
          border: `1px solid ${theme.borderL}`,
          cursor: busy ? 'progress' : 'pointer',
          opacity: busy ? 0.6 : 1,
          transition: 'background 0.12s',
        }}>
        <div style={{ fontSize: 13.5, fontWeight: 500, color: theme.text }}>
          {busy ? '正在导出…' : '导出为 JSON'}
        </div>
        <div style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>
          导出全部任务、Insights、专注记录和设置到一个 .json 文件
        </div>
      </div>

      {lastPath && (
        <div style={{
          padding: '10px 14px', borderRadius: 8,
          background: theme.accentBg, color: theme.accent,
          fontSize: 12, lineHeight: 1.6, marginBottom: 8, wordBreak: 'break-all',
        }}>
          上次导出至：{lastPath}
        </div>
      )}

      <div style={{
        padding: '12px 14px', borderRadius: 8,
        border: `1px dashed ${theme.borderL}`, background: theme.hov,
        fontSize: 12, color: theme.muted, lineHeight: 1.6,
      }}>
        导入与备份功能尚未上线。数据保存在用户目录下的 <code>focusdo.sqlite</code>。
      </div>
    </div>
  );
}

export { DataTab };
