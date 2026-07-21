import { describe, expect, it, vi } from "vitest";
import { backoffDelay, withRetry, type RetryAttemptInfo } from "./retry";
import { ApiError } from "./errors";

/** sleep giả — không chờ thật, ghi lại các delay. */
function makeFakeSleep() {
  const delays: number[] = [];
  return {
    delays,
    sleep: (ms: number) => {
      delays.push(ms);
      return Promise.resolve();
    },
  };
}

describe("withRetry — auto-retry mục 2.3", () => {
  it("thành công ngay lần đầu — không retry", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    const result = await withRetry(fn, { maxRetries: 5, keyCount: 1, sleepFn: makeFakeSleep().sleep });
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retry đúng số lần cấu hình rồi ném lỗi cuối cùng", async () => {
    const fn = vi.fn().mockRejectedValue(new ApiError("server", "HTTP 503", { status: 503 }));
    const { sleep, delays } = makeFakeSleep();
    await expect(withRetry(fn, { maxRetries: 4, keyCount: 1, sleepFn: sleep, jitterFn: () => 0 })).rejects.toThrow(
      "HTTP 503",
    );
    // 1 lần đầu + 4 lần retry = 5 lần gọi
    expect(fn).toHaveBeenCalledTimes(5);
    expect(delays).toHaveLength(4);
  });

  it("số lần retry tôn trọng cấu hình 3-10 (thử với 10)", async () => {
    const fn = vi.fn().mockRejectedValue(new ApiError("timeout", "timeout"));
    await expect(
      withRetry(fn, { maxRetries: 10, keyCount: 1, sleepFn: makeFakeSleep().sleep, jitterFn: () => 0 }),
    ).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(11);
  });

  it("backoff tăng dần theo cấp số nhân (1s, 2s, 4s...)", async () => {
    const fn = vi.fn().mockRejectedValue(new ApiError("server", "500", { status: 500 }));
    const { sleep, delays } = makeFakeSleep();
    await expect(withRetry(fn, { maxRetries: 4, keyCount: 1, sleepFn: sleep, jitterFn: () => 0 })).rejects.toThrow();
    expect(delays).toEqual([1000, 2000, 4000, 8000]);
  });

  it("jitter được cộng vào backoff (tối đa 400ms)", () => {
    expect(backoffDelay(1, 0)).toBe(1000);
    expect(backoffDelay(1, 1)).toBe(1400);
    expect(backoffDelay(3, 0.5)).toBe(4200);
  });

  it("tôn trọng Retry-After của server thay vì backoff", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new ApiError("rate_limit", "429", { status: 429, retryAfterMs: 7000 }))
      .mockResolvedValue("ok");
    const { sleep, delays } = makeFakeSleep();
    const result = await withRetry(fn, { maxRetries: 3, keyCount: 1, sleepFn: sleep });
    expect(result).toBe("ok");
    expect(delays).toEqual([7000]);
  });

  it("xoay key round-robin khi 429 và có nhiều key", async () => {
    const usedKeys: number[] = [];
    const fn = vi.fn().mockImplementation(({ keyIndex }: { keyIndex: number }) => {
      usedKeys.push(keyIndex);
      return Promise.reject(new ApiError("rate_limit", "429", { status: 429 }));
    });
    await expect(
      withRetry(fn, { maxRetries: 5, keyCount: 3, sleepFn: makeFakeSleep().sleep, jitterFn: () => 0 }),
    ).rejects.toThrow();
    // bắt đầu key 0, mỗi lần retry xoay: 0,1,2,0,1,2
    expect(usedKeys).toEqual([0, 1, 2, 0, 1, 2]);
  });

  it("401 với 1 key duy nhất — KHÔNG retry, báo ngay", async () => {
    const fn = vi.fn().mockRejectedValue(new ApiError("auth", "401", { status: 401 }));
    await expect(withRetry(fn, { maxRetries: 5, keyCount: 1, sleepFn: makeFakeSleep().sleep })).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("401 với nhiều key — xoay key và thử tiếp", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new ApiError("auth", "401", { status: 401 }))
      .mockResolvedValue("ok");
    const result = await withRetry(fn, { maxRetries: 3, keyCount: 2, sleepFn: makeFakeSleep().sleep, jitterFn: () => 0 });
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn.mock.calls[1][0].keyIndex).toBe(1); // đã xoay sang key thứ 2
  });

  it("400 bad_request — lỗi vĩnh viễn, KHÔNG retry", async () => {
    const fn = vi.fn().mockRejectedValue(new ApiError("bad_request", "400 body sai", { status: 400 }));
    await expect(withRetry(fn, { maxRetries: 5, keyCount: 3, sleepFn: makeFakeSleep().sleep })).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("stream gãy giữa chừng — được retry", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new ApiError("stream_broken", "stream đứt"))
      .mockResolvedValue("ok");
    const result = await withRetry(fn, { maxRetries: 3, keyCount: 1, sleepFn: makeFakeSleep().sleep, jitterFn: () => 0 });
    expect(result).toBe("ok");
  });

  it("huỷ chủ động (aborted) — dừng ngay, không retry", async () => {
    const fn = vi.fn().mockRejectedValue(new ApiError("aborted", "Đã huỷ"));
    await expect(withRetry(fn, { maxRetries: 5, keyCount: 1, sleepFn: makeFakeSleep().sleep })).rejects.toThrow("Đã huỷ");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("signal abort trong lúc chờ backoff — dừng chuỗi retry", async () => {
    const controller = new AbortController();
    const fn = vi.fn().mockRejectedValue(new ApiError("server", "503", { status: 503 }));
    const sleepThenAbort = (_ms: number, signal?: AbortSignal): Promise<void> => {
      controller.abort();
      if (signal?.aborted) return Promise.reject(new ApiError("aborted", "Đã huỷ"));
      return Promise.resolve();
    };
    await expect(
      withRetry(fn, { maxRetries: 5, keyCount: 1, signal: controller.signal, sleepFn: sleepThenAbort }),
    ).rejects.toThrow("Đã huỷ");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("onAttempt được gọi với thông tin đúng cho UI (n/N)", async () => {
    const attempts: RetryAttemptInfo[] = [];
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new ApiError("server", "503", { status: 503 }))
      .mockRejectedValueOnce(new ApiError("server", "503", { status: 503 }))
      .mockResolvedValue("ok");
    await withRetry(fn, {
      maxRetries: 5,
      keyCount: 1,
      sleepFn: makeFakeSleep().sleep,
      jitterFn: () => 0,
      onAttempt: (i) => attempts.push(i),
    });
    expect(attempts.map((a) => a.attempt)).toEqual([1, 2]);
    expect(attempts[0].maxRetries).toBe(5);
    expect(attempts[0].delayMs).toBe(1000);
    expect(attempts[1].delayMs).toBe(2000);
  });
});
