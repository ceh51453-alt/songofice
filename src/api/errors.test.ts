import { describe, expect, it } from "vitest";
import { classifyHttpStatus, isRetryable, parseRetryAfter, shouldRotateKey, toApiError, ApiError } from "./errors";

describe("phân loại lỗi API (mục 2.3)", () => {
  it("phân loại HTTP status đúng nhóm", () => {
    expect(classifyHttpStatus(429)).toBe("rate_limit");
    expect(classifyHttpStatus(401)).toBe("auth");
    expect(classifyHttpStatus(403)).toBe("auth");
    expect(classifyHttpStatus(500)).toBe("server");
    expect(classifyHttpStatus(503)).toBe("server");
    expect(classifyHttpStatus(400)).toBe("bad_request");
    expect(classifyHttpStatus(404)).toBe("bad_request");
  });

  it("lỗi tạm thời retry được, lỗi vĩnh viễn thì không", () => {
    expect(isRetryable("rate_limit", 1)).toBe(true);
    expect(isRetryable("server", 1)).toBe(true);
    expect(isRetryable("timeout", 1)).toBe(true);
    expect(isRetryable("network", 1)).toBe(true);
    expect(isRetryable("stream_broken", 1)).toBe(true);
    expect(isRetryable("bad_request", 1)).toBe(false);
    expect(isRetryable("aborted", 1)).toBe(false);
    // auth: phụ thuộc số key
    expect(isRetryable("auth", 1)).toBe(false);
    expect(isRetryable("auth", 3)).toBe(true);
  });

  it("chỉ 429/401 mới xoay key", () => {
    expect(shouldRotateKey("rate_limit")).toBe(true);
    expect(shouldRotateKey("auth")).toBe(true);
    expect(shouldRotateKey("server")).toBe(false);
    expect(shouldRotateKey("timeout")).toBe(false);
  });

  it("parse Retry-After dạng giây", () => {
    expect(parseRetryAfter("5")).toBe(5000);
    expect(parseRetryAfter(null)).toBeUndefined();
    expect(parseRetryAfter("rác")).toBeUndefined();
  });

  it("toApiError giữ nguyên ApiError, bọc lỗi lạ", () => {
    const orig = new ApiError("server", "x", { status: 500 });
    expect(toApiError(orig)).toBe(orig);
    expect(toApiError(new TypeError("failed to fetch")).kind).toBe("network");
    expect(toApiError(new DOMException("x", "AbortError")).kind).toBe("aborted");
    expect(toApiError("chuỗi lỗi").kind).toBe("unknown");
  });
});
