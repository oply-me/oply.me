import { describe, expect, it } from "vitest";
import { isPlausibleReferralCode, referralLink } from "@/lib/referrals";

/**
 * Pure checks only. The rules that actually protect the program — self
 * referral, one referrer per account, reward-once, clawback — live in
 * `attach_referral` / `grant_referral_reward` and are covered by
 * `tests/integration/security.test.ts`, because they are only true if the
 * database enforces them.
 */
describe("referral code shape", () => {
  it("accepts a well-formed code", () => {
    expect(isPlausibleReferralCode("A2B3C4D5")).toBe(true);
  });

  it("is case-insensitive on input", () => {
    expect(isPlausibleReferralCode("a2b3c4d5")).toBe(true);
  });

  it("tolerates surrounding whitespace from a pasted link", () => {
    expect(isPlausibleReferralCode("  A2B3C4D5 ")).toBe(true);
  });

  it("rejects the wrong length", () => {
    expect(isPlausibleReferralCode("A2B3C4D")).toBe(false);
    expect(isPlausibleReferralCode("A2B3C4D5E")).toBe(false);
  });

  it("rejects the characters the alphabet deliberately omits", () => {
    // 0/O and 1/I/L are excluded so a code read aloud is unambiguous.
    for (const code of ["A2B3C4D0", "A2B3C4DO", "A2B3C4D1", "A2B3C4DI"]) {
      expect(isPlausibleReferralCode(code)).toBe(false);
    }
  });

  it("rejects anything that could smuggle a query or path", () => {
    for (const code of ["A2B3C4D5&x=1", "../ADMIN1", "A2B3 C4D5", ""]) {
      expect(isPlausibleReferralCode(code)).toBe(false);
    }
  });
});

describe("referral link", () => {
  it("points at the site root with the code as ?ref", () => {
    expect(referralLink("A2B3C4D5", "https://oply.me")).toBe(
      "https://oply.me/?ref=A2B3C4D5",
    );
  });

  it("encodes the code rather than interpolating it raw", () => {
    expect(referralLink("A&B", "https://oply.me")).toBe(
      "https://oply.me/?ref=A%26B",
    );
  });
});
