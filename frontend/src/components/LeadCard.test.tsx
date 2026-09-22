import { describe, expect, it } from "vitest";
import { formatByn, formatPercent } from "../utils/formatters";

describe("lead card formatting", () => {
  it("formats Expected GM and probability for a compact card", () => {
    expect(formatByn(151.4)).toBe("151 BYN");
    expect(formatPercent(0.39)).toBe("39%");
  });
});
