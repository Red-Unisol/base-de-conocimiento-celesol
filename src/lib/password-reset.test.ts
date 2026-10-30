import { describe, expect, it } from "vitest";
import { normalizeResetEmail, shouldCreateRequest, validateNewPassword } from "./password-reset";

describe("password reset rules", () => {
  it("allows only one pending request per email", () => {
    expect(shouldCreateRequest(["ana@redunisol.com.ar"], "ANA@redunisol.com.ar")).toBe(false);
    expect(shouldCreateRequest(["ana@redunisol.com.ar"], "juan@gmail.com")).toBe(true);
  });
  it("accepts any email domain", () => {
    expect(normalizeResetEmail(" Juan@MiEmpresa.com ")).toBe("juan@miempresa.com");
  });
  it("requires at least 8 characters", () => {
    expect(() => validateNewPassword("1234567")).toThrow();
    expect(validateNewPassword("12345678")).toBe("12345678");
  });
});
