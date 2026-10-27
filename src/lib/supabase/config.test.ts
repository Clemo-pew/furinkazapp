import { describe, expect, it } from "vitest";
import { normalizzaUrlSupabase } from "./config";

describe("indirizzo Supabase", () => {
  it.each([
    ["https://abcdefghijklmnop.supabase.co", "https://abcdefghijklmnop.supabase.co"],
    ["https://abcdefghijklmnop.supabase.co/", "https://abcdefghijklmnop.supabase.co"],
    ["https://abcdefghijklmnop.supabase.co/rest/v1/", "https://abcdefghijklmnop.supabase.co"],
    ["abcdefghijklmnop.supabase.co", "https://abcdefghijklmnop.supabase.co"],
    [" https://abcdefghijklmnop.supabase.co/auth/v1 ", "https://abcdefghijklmnop.supabase.co"],
    ["https://supabase.com/dashboard/project/abcdefghijklmnop/settings/api", "https://abcdefghijklmnop.supabase.co"],
  ])("%s", (dato, atteso) => {
    expect(normalizzaUrlSupabase(dato.trim())).toBe(atteso);
  });
});
