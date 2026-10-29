import { describe, expect, it } from "vitest";
import { isInstitutionalEmail } from "./institutional-domains";

describe("isInstitutionalEmail", () => {
  it("acepta @redunisol.com.ar", () => expect(isInstitutionalEmail("Ana@RedUnisol.com.ar")).toBe(true));
  it("rechaza gmail", () => expect(isInstitutionalEmail("ana@gmail.com")).toBe(false));
  it("rechaza subdominios parecidos", () => expect(isInstitutionalEmail("a@redunisol.com.ar.evil.com")).toBe(false));
});
