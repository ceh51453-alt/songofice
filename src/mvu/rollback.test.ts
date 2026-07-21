/**
 * Test cơ chế snapshot/rollback của reroll (19.1/5.3) — bất biến quan trọng nhất:
 * reroll 1 lượt NHIỀU LẦN không cộng dồn thay đổi state (HP chỉ trừ 1 lần).
 * Đây chính là chuỗi thao tác chatStore thực hiện qua mvuStore.
 */
import { describe, expect, it } from "vitest";
import { makeDefaultState } from "./schema";
import { applyPatch } from "./patchEngine";
import { extractUpdates } from "./extractor";
import { runCascadeEffects, recomputeDerived } from "./effects";
import type { StatData } from "./schema";

function makeState(): StatData {
  const s = makeDefaultState();
  recomputeDerived(s);
  s["Chỉ Số Sinh Tồn"]["HP"] = s["Chỉ Số Phái Sinh"]["_HP Tối Đa"];
  return s;
}

/** Mô phỏng applyAiOps của mvuStore: patch + lan toả. */
function applyAiResponse(state: StatData, rawResponse: string): StatData {
  const { ops } = extractUpdates(rawResponse);
  const { state: patched } = applyPatch(state, ops);
  return runCascadeEffects(state, patched).state;
}

const RESPONSE_V1 = `Gã lính chém trúng vai ngươi.
<UpdateVariable>{"mvu_update":[{"op":"delta","path":"stat_data.Chỉ Số Sinh Tồn.HP","value":-15}]}</UpdateVariable>`;

const RESPONSE_V2 = `Ngươi né được nhưng trẹo chân.
<UpdateVariable>{"mvu_update":[{"op":"delta","path":"stat_data.Chỉ Số Sinh Tồn.HP","value":-5}]}</UpdateVariable>`;

describe("reroll rollback (19.1)", () => {
  it("reroll nhiều lần KHÔNG cộng dồn: HP chỉ trừ 1 lần theo bản active", () => {
    const state0 = makeState();
    const hpFull = state0["Chỉ Số Sinh Tồn"]["HP"];

    // lượt N: snapshot TRƯỚC khi áp (chatStore.send)
    const snapshot = structuredClone(state0);
    let current = applyAiResponse(state0, RESPONSE_V1);
    expect(current["Chỉ Số Sinh Tồn"]["HP"]).toBe(hpFull - 15);

    // reroll lần 1: rollback snapshot → áp bản mới
    current = applyAiResponse(structuredClone(snapshot), RESPONSE_V2);
    expect(current["Chỉ Số Sinh Tồn"]["HP"]).toBe(hpFull - 5); // KHÔNG phải -20

    // reroll lần 2 (quay lại bản 1): rollback → áp lại v1
    current = applyAiResponse(structuredClone(snapshot), RESPONSE_V1);
    expect(current["Chỉ Số Sinh Tồn"]["HP"]).toBe(hpFull - 15); // KHÔNG phải -35
  });

  it("swipe giữa các bản khôi phục đúng state của bản đang chọn", () => {
    const state0 = makeState();
    const snapshot = structuredClone(state0);
    const variants = [RESPONSE_V1, RESPONSE_V2];

    // swipe qua lại 10 lần — state luôn đúng theo bản active, không tích luỹ
    let current = state0;
    for (let i = 0; i < 10; i++) {
      const active = variants[i % 2];
      current = applyAiResponse(structuredClone(snapshot), active);
      const expected = active === RESPONSE_V1 ? -15 : -5;
      expect(current["Chỉ Số Sinh Tồn"]["HP"]).toBe(state0["Chỉ Số Sinh Tồn"]["HP"] + expected);
    }
  });

  it("snapshot độc lập — áp patch bản mới không làm bẩn snapshot (deep clone)", () => {
    const state0 = makeState();
    const snapshot = structuredClone(state0);
    applyAiResponse(structuredClone(snapshot), RESPONSE_V1);
    expect(snapshot["Chỉ Số Sinh Tồn"]["HP"]).toBe(state0["Chỉ Số Sinh Tồn"]["HP"]);
  });

  it("turnCount trong snapshot khôi phục theo — chuỗi RNG stream của lượt giữ nguyên khi reroll (5bis.1)", () => {
    const state0 = makeState();
    state0["_engineMeta"]["turnCount"] = 7;
    const snapshot = structuredClone(state0);
    const after = applyAiResponse(state0, RESPONSE_V1);
    after["_engineMeta"]["turnCount"] += 1; // store tăng sau mỗi lượt
    // rollback
    const restored = structuredClone(snapshot);
    expect(restored["_engineMeta"]["turnCount"]).toBe(7); // cùng turn → cùng eventSeed
  });
});
