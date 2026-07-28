import { useState } from "react";
import { GlassInput } from "../components/GlassInput";
import { GlassButton } from "../components/GlassButton";
import { IconSpinner } from "../icons";
import { generateWizardData } from "../../character/aiGeneration";
import type { WizardData } from "../../character/characterInit";

interface Props {
  currentData: WizardData;
  stepName?: string;
  onApplyPatch: (patch: Partial<WizardData>) => void;
}

export function AiWizardAssistant({ currentData, stepName, onApplyPatch }: Props) {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const patch = await generateWizardData(prompt, currentData, stepName);
      onApplyPatch(patch);
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
           Trợ lý AI {stepName ? `(${stepName})` : ""}
        </span>
        {error && <span className="text-[12px] text-[var(--danger)]">{error}</span>}
      </div>
      
      <div className="flex gap-2">
        <GlassInput
          placeholder={stepName ? "Nhập yêu cầu cho phần này..." : "Nhập yêu cầu tạo nhân vật..."}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isLoading}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleGenerate();
            }
          }}
        />
        <GlassButton variant="accent" onClick={handleGenerate} disabled={isLoading}>
          {isLoading ? <IconSpinner size={16} className="animate-spin" /> : "Tạo"}
        </GlassButton>
        <GlassButton onClick={handleGenerate} disabled={isLoading} title="Tạo lại với dữ liệu hiện tại">
          Reroll
        </GlassButton>
      </div>
      
      <div className="mt-2 text-[11px] text-[var(--text-faint)]">
        {prompt.trim() 
          ? "AI sẽ cập nhật dữ liệu dựa trên yêu cầu của bạn." 
          : "Bỏ trống để AI tự động sáng tạo phần còn thiếu dựa trên các lựa chọn trước đó."}
      </div>
    </div>
  );
}
