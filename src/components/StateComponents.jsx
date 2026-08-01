export function LoadingState({ title = "Yükleniyor...", desc, dosyaAdi }) {
  return (
    <div className="loading-state fade-in">
      <div className="spinner"></div>
      <h4 className="loading-title">{title}</h4>
      {(desc || dosyaAdi) && (
        <p className="loading-desc">
          {desc} {dosyaAdi && <span className="highlight-text">{dosyaAdi}</span>}
        </p>
      )}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="error-alert fade-in">
      <div style={{ flex: 1 }}>
        <strong>Hata:</strong> {message}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            background: "transparent",
            border: "1px solid #fca5a5",
            color: "#991b1b",
            padding: "6px 14px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: 600,
            whiteSpace: "nowrap",
            fontFamily: "inherit",
          }}
        >
          Tekrar Dene
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, desc, actionLabel, onAction }) {
  return (
    <div className="glass-card text-center">
      <h3 className="empty-state-title">{title}</h3>
      {desc && <p className="empty-state-desc">{desc}</p>}
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn-primary">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
