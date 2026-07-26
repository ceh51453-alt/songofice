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
    return applyRegexForSingleMessage(content, role, depth, scripts, true);
  };
}

import { applyRegexForSingleMessage } from "../../preset/regexEngine";

