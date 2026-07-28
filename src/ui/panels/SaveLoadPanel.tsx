/**
 * SaveLoadPanel.tsx (M15) — UI quản lý save slots.
 * Grid card glassmorphism: tên slot, metadata, nút Load/Delete/Export.
 * Form tạo save mới + nút Import file JSON.
 */
import { useState, useEffect, useCallback } from "react";
import { IconPlus, IconTrash, IconCheck, IconSpinner } from "../icons";
import type { SaveSlotRecord } from "../../state/db";
import {
  saveGame,
  loadGame,
  deleteSlot,
  listSlots,
  exportSave,
  importSave,
  downloadBlob,
} from "../../state/saveEngine";

type Mode = "save" | "load";

export function SaveLoadPanel({
  mode,
  onDone,
}: {
  mode: Mode;
  onDone: () => void;
}) {
  const [slots, setSlots] = useState<SaveSlotRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const all = await listSlots();
      setSlots(all);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // ── Handlers ──

  const handleSave = async () => {
    const name = newName.trim();
    if (!name) return;
    setBusy("save");
    setError(null);
    try {
      await saveGame(name);
      setNewName("");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lưu thất bại");
    } finally {
      setBusy(null);
    }
  };

  const handleOverwrite = async (slot: SaveSlotRecord) => {
    setBusy(slot.id);
    setError(null);
    try {
      await saveGame(slot.slotName, slot.id);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ghi đè thất bại");
    } finally {
      setBusy(null);
    }
  };

  const handleLoad = async (slot: SaveSlotRecord) => {
    setBusy(slot.id);
    setError(null);
    try {
      await loadGame(slot.id);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Tải thất bại");
      setBusy(null);
    }
  };

  const handleDelete = async (slotId: string) => {
    setBusy(slotId);
    try {
      await deleteSlot(slotId);
      setConfirmDelete(null);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xoá thất bại");
    } finally {
      setBusy(null);
    }
  };

  const handleExport = async (slot: SaveSlotRecord) => {
    setBusy(slot.id);
    try {
      const blob = await exportSave(slot.id);
      const filename = `${slot.slotName.replace(/[^a-zA-Z0-9\u00C0-\u1EF9]/g, "_")}_save.json`;
      downloadBlob(blob, filename);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xuất thất bại");
    } finally {
      setBusy(null);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy("import");
    setError(null);
    try {
      await importSave(file);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nhập thất bại");
    } finally {
      setBusy(null);
      e.target.value = "";
    }
  };

  // ── Render helpers ──

  const isAutosave = (s: SaveSlotRecord) => s.slotName === "_autosave";
  const displayName = (s: SaveSlotRecord) => isAutosave(s) ? "Tự Động Lưu" : s.slotName;
  const formatDate = (ts: number) => new Date(ts).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });

  return (
    <div style={{ minHeight: 300 }}>
      {/* Error banner */}
      {error && (
        <div style={{
          padding: "8px 12px",
          marginBottom: 12,
          background: "rgba(180,60,60,0.15)",
          border: "1px solid rgba(180,60,60,0.3)",
          borderRadius: "var(--radius-sm)",
          color: "#e8a0a0",
          fontSize: "0.8rem",
        }}>
          {error}
        </div>
      )}

      {/* Save form (chỉ trong mode save) */}
      {mode === "save" && (
        <div style={{
          display: "flex",
          gap: 8,
          marginBottom: 16,
        }}>
          <input
            type="text"
            placeholder="Tên ván lưu..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            maxLength={60}
            style={{
              flex: 1,
              padding: "8px 12px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid var(--glass-border)",
              borderRadius: "var(--radius-sm)",
              color: "var(--text-soft)",
              fontSize: "0.85rem",
              outline: "none",
            }}
          />
          <button
            onClick={handleSave}
            disabled={!newName.trim() || busy === "save"}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              background: "var(--accent-soft)",
              border: "1px solid var(--accent-border)",
              borderRadius: "var(--radius-sm)",
              color: "var(--accent-text)",
              fontSize: "0.85rem",
              cursor: "pointer",
              opacity: !newName.trim() ? 0.4 : 1,
            }}
          >
            {busy === "save" ? <IconSpinner size={14} /> : <IconPlus size={14} />}
            Lưu
          </button>
        </div>
      )}

      {/* Import button */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <label style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 12px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid var(--glass-border)",
          borderRadius: "var(--radius-sm)",
          color: "var(--text-muted)",
          fontSize: "0.8rem",
          cursor: "pointer",
          transition: "background 0.15s",
        }}>
          <IconPlus size={14} />
          Nhập file JSON
          <input type="file" accept=".json" onChange={handleImport} style={{ display: "none" }} />
        </label>
        {busy === "import" && <IconSpinner size={16} />}
      </div>

      {/* Slot grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--text-faint)" }}>
          <IconSpinner size={24} />
        </div>
      ) : slots.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: 40,
          color: "rgba(255,255,255,0.3)",
          fontSize: "0.85rem",
        }}>
          Chưa có ván nào được lưu.
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 12,
        }}>
          {slots.map((slot) => (
            <div
              key={slot.id}
              style={{
                padding: 14,
                background: isAutosave(slot)
                  ? "rgba(100,160,120,0.06)"
                  : "rgba(255,255,255,0.03)",
                border: `1px solid ${isAutosave(slot) ? "rgba(100,160,120,0.2)" : "var(--glass-border)"}`,
                borderRadius: "var(--radius-md)",
                backdropFilter: "blur(12px)",
                transition: "border-color 0.15s",
              }}
            >
              {/* Header */}
              <div style={{ marginBottom: 8 }}>
                <div style={{
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  color: "var(--text-soft)",
                  marginBottom: 2,
                }}>
                  {displayName(slot)}
                </div>
                <div style={{
                  fontSize: "0.75rem",
                  color: "var(--text-faint)",
                }}>
                  {formatDate(slot.updatedAt)}
                </div>
              </div>

              {/* Meta */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "4px 12px",
                fontSize: "0.78rem",
                color: "rgba(255,255,255,0.5)",
                marginBottom: 10,
              }}>
                <span>{slot.meta.characterName}</span>
                <span>{slot.meta.house}</span>
                <span>Ngày {slot.meta.day}/{slot.meta.month}</span>
                <span>Năm {slot.meta.year} · {slot.meta.season}</span>
              </div>

              {/* Actions */}
              {confirmDelete === slot.id ? (
                <div style={{ display: "flex", gap: 6, fontSize: "0.78rem" }}>
                  <span style={{ color: "#e8a0a0", flex: 1 }}>Xoá ván này?</span>
                  <button
                    onClick={() => handleDelete(slot.id)}
                    disabled={busy === slot.id}
                    style={{
                      padding: "4px 10px",
                      background: "rgba(180,60,60,0.2)",
                      border: "1px solid rgba(180,60,60,0.4)",
                      borderRadius: "var(--radius-sm)",
                      color: "#e8a0a0",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                    }}
                  >
                    {busy === slot.id ? <IconSpinner size={12} /> : <IconCheck size={12} />}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    style={{
                      padding: "4px 10px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: "var(--radius-sm)",
                      color: "var(--text-muted)",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                    }}
                  >
                    Huỷ
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 6 }}>
                  {mode === "load" ? (
                    <button
                      onClick={() => handleLoad(slot)}
                      disabled={busy === slot.id}
                      style={{
                        flex: 1,
                        padding: "6px 0",
                        background: "var(--accent-soft)",
                        border: "1px solid var(--accent-border)",
                        borderRadius: "var(--radius-sm)",
                        color: "var(--accent-text)",
                        fontSize: "0.8rem",
                        cursor: "pointer",
                      }}
                    >
                      {busy === slot.id ? <IconSpinner size={12} /> : "Tải Ván"}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOverwrite(slot)}
                      disabled={busy === slot.id || isAutosave(slot)}
                      style={{
                        flex: 1,
                        padding: "6px 0",
                        background: "var(--accent-soft)",
                        border: "1px solid var(--accent-border)",
                        borderRadius: "var(--radius-sm)",
                        color: "var(--accent-text)",
                        fontSize: "0.8rem",
                        cursor: "pointer",
                        opacity: isAutosave(slot) ? 0.4 : 1,
                      }}
                    >
                      {busy === slot.id ? <IconSpinner size={12} /> : "Ghi Đè"}
                    </button>
                  )}
                  <button
                    onClick={() => handleExport(slot)}
                    disabled={busy === slot.id}
                    title="Xuất file JSON"
                    style={{
                      padding: "6px 10px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: "var(--radius-sm)",
                      color: "var(--text-muted)",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                    }}
                  >
                    Xuất
                  </button>
                  <button
                    onClick={() => setConfirmDelete(slot.id)}
                    title="Xoá ván"
                    style={{
                      padding: "6px 8px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: "var(--radius-sm)",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                    }}
                  >
                    <IconTrash size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
