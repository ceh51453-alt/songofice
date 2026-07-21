/**
 * DataSettings.tsx (M15, mục 21) — Tab Data trong Settings.
 * Export/Import/Xoá toàn bộ dữ liệu + hiển thị dung lượng DB.
 * Xoá toàn bộ yêu cầu xác nhận 2 bước.
 */
import { useState, useEffect, useCallback } from "react";
import { IconTrash, IconSpinner, IconCheck, IconAlert } from "../icons";
import { clearAllData, estimateDbSize } from "../../state/saveEngine";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DataSettings() {
  const [dbSize, setDbSize] = useState<number | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshSize = useCallback(async () => {
    try {
      const size = await estimateDbSize();
      setDbSize(size);
    } catch {
      setDbSize(null);
    }
  }, []);

  useEffect(() => {
    void refreshSize();
  }, [refreshSize]);

  const handleClear = async () => {
    setClearing(true);
    setError(null);
    try {
      await clearAllData();
      setCleared(true);
      setConfirmClear(false);
      await refreshSize();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xoá thất bại");
    } finally {
      setClearing(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* DB Size */}
      <div style={{
        padding: "12px 16px",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid var(--glass-border)",
        borderRadius: "var(--radius-sm)",
      }}>
        <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: 4 }}>
          Dung lượng dữ liệu
        </div>
        <div style={{ fontSize: "1.1rem", color: "var(--text-soft)", fontWeight: 600 }}>
          {dbSize !== null ? formatBytes(dbSize) : "Đang tính..."}
        </div>
        <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", marginTop: 4 }}>
          Save slots, ảnh chân dung NPC, tóm tắt chương
        </div>
      </div>

      {/* Hướng dẫn */}
      <div style={{
        padding: "10px 14px",
        background: "rgba(255,255,255,0.02)",
        borderRadius: "var(--radius-sm)",
        border: "1px solid var(--glass-border)",
        fontSize: "0.78rem",
        color: "rgba(255,255,255,0.4)",
        lineHeight: 1.5,
      }}>
        Dùng nút Xuất/Nhập trong mục Tải Ván để sao lưu từng ván riêng lẻ.
        Xoá toàn bộ bên dưới sẽ xoá tất cả save, ảnh chân dung và tóm tắt — không ảnh hưởng preset/lorebook.
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: "8px 12px",
          background: "rgba(180,60,60,0.15)",
          border: "1px solid rgba(180,60,60,0.3)",
          borderRadius: "var(--radius-sm)",
          color: "#e8a0a0",
          fontSize: "0.8rem",
        }}>
          {error}
        </div>
      )}

      {/* Cleared success */}
      {cleared && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          background: "rgba(100,160,100,0.1)",
          border: "1px solid rgba(100,160,100,0.25)",
          borderRadius: "var(--radius-sm)",
          color: "#a0d8a0",
          fontSize: "0.8rem",
        }}>
          <IconCheck size={14} /> Đã xoá toàn bộ dữ liệu
        </div>
      )}

      {/* Xoá toàn bộ — 2 bước */}
      <div style={{
        padding: "14px 16px",
        background: "rgba(180,60,60,0.04)",
        border: "1px solid rgba(180,60,60,0.15)",
        borderRadius: "var(--radius-md)",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 8,
          fontSize: "0.85rem",
          fontWeight: 600,
          color: "#e8a0a0",
        }}>
          <IconAlert size={16} />
          Xoá toàn bộ dữ liệu
        </div>

        {!confirmClear ? (
          <button
            onClick={() => { setConfirmClear(true); setCleared(false); }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              background: "rgba(180,60,60,0.12)",
              border: "1px solid rgba(180,60,60,0.3)",
              borderRadius: "var(--radius-sm)",
              color: "#e8a0a0",
              fontSize: "0.8rem",
              cursor: "pointer",
            }}
          >
            <IconTrash size={14} />
            Xoá tất cả save, ảnh, tóm tắt
          </button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: "0.78rem", color: "#e8a0a0" }}>
              Hành động này không thể hoàn tác. Bạn có chắc chắn?
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleClear}
                disabled={clearing}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 14px",
                  background: "rgba(180,60,60,0.25)",
                  border: "1px solid rgba(180,60,60,0.5)",
                  borderRadius: "var(--radius-sm)",
                  color: "#e8a0a0",
                  fontSize: "0.78rem",
                  cursor: "pointer",
                }}
              >
                {clearing ? <IconSpinner size={12} /> : <IconCheck size={12} />}
                Xác nhận xoá
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                style={{
                  padding: "6px 14px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-muted)",
                  fontSize: "0.78rem",
                  cursor: "pointer",
                }}
              >
                Huỷ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
