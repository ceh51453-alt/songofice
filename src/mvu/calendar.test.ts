/**
 * calendar.test.ts — Lịch Westeros (12 tháng × 30 ngày = 360 ngày/năm).
 * Bao gồm cả migrate save cũ (Ngày 1-360, chưa có Tháng).
 */
import { describe, expect, it } from "vitest";
import {
  DAYS_PER_MONTH, DAYS_PER_YEAR, MONTHS_PER_YEAR,
  absoluteDay, absoluteMonth, normalizeCalendar, addDays, dayOfYear, fromDayOfYear,
  fromAbsoluteDay, formatDate, formatDateShort, formatDuration, daysBetween, turnsToDays,
  type CalendarLike,
} from "./calendar";

const at = (y: number, m: number, d: number): CalendarLike => ({ "Năm": y, "Tháng": m, "Ngày": d });

describe("hằng số lịch", () => {
  it("12 tháng × 30 ngày = 360 ngày/năm", () => {
    expect(DAYS_PER_MONTH).toBe(30);
    expect(MONTHS_PER_YEAR).toBe(12);
    expect(DAYS_PER_YEAR).toBe(360);
  });
});

describe("absoluteDay / absoluteMonth", () => {
  it("mốc đầu năm", () => {
    expect(absoluteDay(at(298, 1, 1))).toBe(298 * 360 + 1);
    expect(absoluteMonth(at(298, 1, 1))).toBe(298 * 12);
  });

  it("đơn điệu tăng theo ngày rồi tháng rồi năm", () => {
    expect(absoluteDay(at(298, 1, 2))).toBeGreaterThan(absoluteDay(at(298, 1, 1)));
    expect(absoluteDay(at(298, 2, 1))).toBeGreaterThan(absoluteDay(at(298, 1, 30)));
    expect(absoluteDay(at(299, 1, 1))).toBeGreaterThan(absoluteDay(at(298, 12, 30)));
  });

  it("cách nhau đúng 1 ngày qua ranh giới tháng và năm", () => {
    expect(absoluteDay(at(298, 2, 1)) - absoluteDay(at(298, 1, 30))).toBe(1);
    expect(absoluteDay(at(299, 1, 1)) - absoluteDay(at(298, 12, 30))).toBe(1);
  });
});

describe("normalizeCalendar", () => {
  it("tràn ngày → sang tháng", () => {
    const c = at(298, 1, 35);
    normalizeCalendar(c);
    expect(c).toEqual(at(298, 2, 5));
  });

  it("tràn tháng → sang năm", () => {
    const c = at(298, 14, 3);
    normalizeCalendar(c);
    expect(c).toEqual(at(299, 2, 3));
  });

  it("tràn nhiều mức cùng lúc", () => {
    const c = at(298, 12, 31);
    normalizeCalendar(c);
    expect(c).toEqual(at(299, 1, 1));
  });

  it("state đã chuẩn giữ nguyên (idempotent)", () => {
    const c = at(298, 7, 15);
    normalizeCalendar(c);
    normalizeCalendar(c);
    expect(c).toEqual(at(298, 7, 15));
  });

  it("kẹp về mốc 0 khi giá trị âm/không hợp lệ", () => {
    const c = at(0, 1, -50);
    normalizeCalendar(c);
    expect(c).toEqual(at(0, 1, 1));
  });

  it("MIGRATE save cũ: Ngày 1-360 chưa có Tháng → tách đúng Tháng/Ngày", () => {
    // save cũ ghi Ngày = 250 trong năm, Tháng mặc định = 1
    const old = at(298, 1, 250);
    normalizeCalendar(old);
    expect(old).toEqual(at(298, 9, 10));
    // khớp chính xác với fromDayOfYear
    expect(fromDayOfYear(250)).toEqual({ "Tháng": 9, "Ngày": 10 });
  });

  it("MIGRATE: Ngày = 360 (cuối năm) → tháng 12 ngày 30, KHÔNG nhảy năm", () => {
    const old = at(298, 1, 360);
    normalizeCalendar(old);
    expect(old).toEqual(at(298, 12, 30));
  });
});

describe("addDays", () => {
  it("cộng trong cùng tháng", () => {
    const c = at(298, 3, 10);
    addDays(c, 5);
    expect(c).toEqual(at(298, 3, 15));
  });

  it("cộng vượt tháng", () => {
    const c = at(298, 3, 25);
    addDays(c, 10);
    expect(c).toEqual(at(298, 4, 5));
  });

  it("cộng đúng 1 năm quay lại cùng ngày/tháng", () => {
    const c = at(298, 6, 12);
    addDays(c, DAYS_PER_YEAR);
    expect(c).toEqual(at(299, 6, 12));
  });

  it("trừ ngày (delta âm)", () => {
    const c = at(298, 4, 5);
    addDays(c, -10);
    expect(c).toEqual(at(298, 3, 25));
  });
});

describe("dayOfYear / fromDayOfYear", () => {
  it("ngày đầu và cuối năm", () => {
    expect(dayOfYear(at(298, 1, 1))).toBe(1);
    expect(dayOfYear(at(298, 12, 30))).toBe(360);
  });

  it("round-trip mọi ngày trong năm", () => {
    for (let doy = 1; doy <= DAYS_PER_YEAR; doy++) {
      const { "Tháng": m, "Ngày": d } = fromDayOfYear(doy);
      expect(dayOfYear(at(298, m, d))).toBe(doy);
    }
  });

  it("kẹp giá trị ngoài khoảng", () => {
    expect(fromDayOfYear(0)).toEqual({ "Tháng": 1, "Ngày": 1 });
    expect(fromDayOfYear(999)).toEqual({ "Tháng": 12, "Ngày": 30 });
  });
});

describe("fromAbsoluteDay", () => {
  it("là nghịch đảo của absoluteDay", () => {
    for (const c of [at(298, 1, 1), at(298, 6, 15), at(298, 12, 30), at(300, 4, 7)]) {
      expect(fromAbsoluteDay(absoluteDay(c))).toEqual(c);
    }
  });
});

describe("daysBetween", () => {
  it("hiệu dương khi b sau a", () => {
    expect(daysBetween(at(298, 1, 1), at(298, 2, 1))).toBe(30);
  });

  it("hiệu âm khi b trước a", () => {
    expect(daysBetween(at(298, 2, 1), at(298, 1, 1))).toBe(-30);
  });
});

describe("turnsToDays", () => {
  it("1 turn thiết kế cũ = 1 tháng = 30 ngày", () => {
    expect(turnsToDays(1)).toBe(30);
    expect(turnsToDays(3)).toBe(90);
    expect(turnsToDays(0)).toBe(0);
  });
});

describe("format", () => {
  it("formatDate đầy đủ", () => {
    expect(formatDate(at(298, 3, 12))).toBe("ngày 12 tháng 3, năm 298 AC");
  });

  it("formatDateShort", () => {
    expect(formatDateShort(at(298, 3, 12))).toBe("12/3/298 AC");
  });

  it("formatDuration: dưới 1 tháng → ngày", () => {
    expect(formatDuration(0)).toBe("xong");
    expect(formatDuration(1)).toBe("1 ngày");
    expect(formatDuration(29)).toBe("29 ngày");
  });

  it("formatDuration: tròn tháng KHÔNG kèm phần ngày", () => {
    expect(formatDuration(30)).toBe("1 tháng");
    expect(formatDuration(90)).toBe("3 tháng");
  });

  it("formatDuration: tháng + ngày lẻ", () => {
    expect(formatDuration(45)).toBe("1 tháng 15 ngày");
  });

  it("formatDuration: gộp năm khi ≥ 360 ngày", () => {
    expect(formatDuration(360)).toBe("1 năm");
    expect(formatDuration(395)).toBe("1 năm 1 tháng 5 ngày");
  });
});
