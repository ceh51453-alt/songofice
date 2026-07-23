import { useState } from "react";
import { GlassInput } from "../components/GlassInput";
import { GlassButton } from "../components/GlassButton";
import { IconSpinner } from "../icons";
import { generateCanonCharacter } from "../../character/aiGeneration";
import type { CanonCharacter, EraData } from "../../content/westeros/eras";

interface Props {
  era: EraData;
  onGenerated: (character: CanonCharacter) => void;
}

export function AiCanonAssistant({ era, onGenerated }: Props) {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const char = await generateCanonCharacter(prompt, era);
      onGenerated(char);
      setPrompt(""); // Clear prompt after success
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mt-6 rounded-[var(--radius-sm)] border border-[var(--accent-border)] bg-[rgba(0,0,0,0.2)] p-4 shadow-[0_0_15px_-5px_var(--accent-soft)]">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[13px] font-medium text-[var(--accent-text)]">
          ✨ Trợ lý AI (Tạo Biến Thể / What-if)
        </span>
        {error && <span className="text-[12px] text-[var(--danger)]">{error}</span>}
      </div>
      
      <div className="flex gap-2">
        <GlassInput
          placeholder="Ví dụ: Tạo một thành viên nhà Tyrell là hiệp sĩ lưu manh..."
          value={prompt}
          onChange={(e: any) => setPrompt(e.target.value)}
          disabled={isLoading}
          onKeyDown={(e: any) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleGenerate();
            }
          }}
        />
        <GlassButton variant="accent" onClick={() => void handleGenerate()} disabled={isLoading}>
          {isLoading ? <IconSpinner size={16} className="animate-spin" /> : "Tạo"}
        </GlassButton>
      </div>
      
      <div className="mt-2 text-[11px] text-[var(--text-faint)]">
        AI sẽ tạo ra một nhân vật hoàn chỉnh (với đầy đủ chỉ số, vật phẩm) chuẩn lore ASOIAF dựa theo yêu cầu của bạn.
      </div>
    </div>
  );
}
