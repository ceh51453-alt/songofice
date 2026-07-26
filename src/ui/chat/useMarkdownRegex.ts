import { useMemo } from "react";
import { usePresetStore } from "../../state/presetStore";
import type { ApiChatMessage } from "../../types/connection";

/**
 * Hook trả về hàm xử lý chuỗi dựa trên các regex scripts (dành cho UI Markdown).
 */
export function useMarkdownRegex() {
  const activePreset = usePresetStore((s) => s.activePreset);

  const scripts = useMemo(() => {
    return activePreset?.extensions?.regex_scripts ?? [];
  }, [activePreset]);

  // Hàm xử lý
  return (content: string, role: ApiChatMessage["role"], depth: number) => {
    if (scripts.length === 0) return content;

    // applyRegexScripts nhận mảng messages và trả về mảng.
    // Chúng ta tạo một message giả có đúng depth để khớp điều kiện của regex.
    // Tuy nhiên applyRegexScripts đếm depth = length - 1 - i.
    // Nếu truyền 1 message, depth của nó sẽ bị đếm là 0. 
    // Điều này sẽ sai bét nếu mình đang apply cho tin nhắn cũ ở UI.
    
    // Vì applyRegexScripts mặc định thao tác trên MẢNG chat history,
    // ta nên viết một phiên bản nhẹ nhàng hơn để chạy trực tiếp cho 1 message.
    return applyRegexForSingleMessage(content, role, depth, scripts);
  };
}

import { compileRegex } from "../../preset/regexEngine";
import type { STRegexScript } from "../../preset/presetSchema";

function applyRegexForSingleMessage(
  content: string,
  role: ApiChatMessage["role"],
  depth: number,
  scripts: STRegexScript[]
): string {
  let text = content;
  
  // Lọc chỉ áp dụng cho UI
  const activeScripts = scripts.filter(s => !s.disabled && !s.promptOnly);
  
  if (activeScripts.length === 0) return text;

  for (const script of activeScripts) {
    // 1. Kiểm tra placement
    if (script.placement && script.placement.length > 0) {
      const roleMap: Record<ApiChatMessage["role"], number> = {
        system: 0,
        user: 1,
        assistant: 2,
      };
      if (!script.placement.includes(roleMap[role])) continue;
    }

    // 2. Kiểm tra depth
    if (script.minDepth !== null && script.minDepth !== undefined && depth < script.minDepth) continue;
    if (script.maxDepth !== null && script.maxDepth !== undefined && depth > script.maxDepth) continue;

    // 3. Compile và chạy
    const regex = compileRegex(script.findRegex);
    if (regex) {
      regex.lastIndex = 0;
      text = text.replace(regex, script.replaceString);
    }
  }

  return text;
}
