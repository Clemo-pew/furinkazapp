import { describe, expect, it } from "vitest";
import { idDaLinkYoutube, VIDEO_PREDEFINITI, videoKata } from "./kataVideo";
import { kataValido } from "./kata";

describe("video dei kata", () => {
  it("riconosce i vari formati di link YouTube", () => {
    for (const link of [
      "https://www.youtube.com/watch?v=lZyI9mtk924",
      "https://youtube.com/watch?v=lZyI9mtk924&t=30s",
      "https://m.youtube.com/watch?v=lZyI9mtk924",
      "https://youtu.be/lZyI9mtk924?si=abc",
      "youtu.be/lZyI9mtk924",
      "https://www.youtube.com/shorts/lZyI9mtk924",
      "https://www.youtube.com/embed/lZyI9mtk924?autoplay=1",
      "https://www.youtube-nocookie.com/embed/lZyI9mtk924",
      " lZyI9mtk924 ",
    ]) expect(idDaLinkYoutube(link)).toBe("lZyI9mtk924");
  });
  it("rifiuta link non validi", () => {
    expect(idDaLinkYoutube("https://vimeo.com/123")).toBeNull();
    expect(idDaLinkYoutube("https://www.youtube.com/@canale")).toBeNull();
    expect(idDaLinkYoutube("ciao")).toBeNull();
  });
  it("i video predefiniti sono di kata esistenti", () => {
    for (const [k, id] of Object.entries(VIDEO_PREDEFINITI)) {
      expect(kataValido(k)).toBe(true);
      expect(id).toMatch(/^[A-Za-z0-9_-]{11}$/);
    }
  });
  it("il video scelto dal dojo ha la precedenza", () => {
    expect(videoKata("heian_shodan", { heian_shodan: "AAAAAAAAAAA" })).toEqual({ id: "AAAAAAAAAAA", personalizzato: true });
    expect(videoKata("heian_shodan", {})).toEqual({ id: "lZyI9mtk924", personalizzato: false });
    expect(videoKata("tekki_shodan", {})).toBeNull();
  });
});
