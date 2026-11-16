import { describe, expect, it } from "vitest";
import { contributionRow } from "./contributions";
import { oauthReturnPath } from "./oauth-return-path";
describe("aportes", () => {
  it("guarda propuestas sin convertirlas en políticas confirmadas", () => {
    const row = contributionRow({ kind: "policy", title: "Cambio", content_markdown: "1. Revisar evidencia" }, "owner");
    expect(row.status).toBe("pendiente");
    expect(row.created_by).toBe("owner");
    expect(row.process_id).toBeNull();
  });
  it("requiere un destino válido cuando se indica", () => {
    expect(() => contributionRow({ kind: "process", target_id: "invalid", title: "Cambio", content_markdown: "Pasos" }, "owner")).toThrow();
  });
});
describe("retorno de autorización", () => {
  it("conserva el identificador de consentimiento", () => expect(oauthReturnPath("/.lovable/oauth/consent?authorization_id=abc#detail")).toBe("/.lovable/oauth/consent?authorization_id=abc#detail"));
  it.each(["//evil.example", "/\\evil.example", "https://evil.example", "/\nelsewhere"])("rechaza retorno externo o ambiguo %s", value => expect(oauthReturnPath(value)).toBe("/"));
});