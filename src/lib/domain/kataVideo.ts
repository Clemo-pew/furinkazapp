// Video di esecuzione dei kata.
// Predefiniti: i video che la Shotokan Karate Academy (Vancouver, canale YouTube @shotokankarateacademy6550)
// pubblica nelle pagine dei kata del suo sito karatevancouver.ca/kata.
// Lo staff può sostituirli o aggiungere quelli mancanti dalla sezione Kata (tabella kata_video).
export const VIDEO_PREDEFINITI: Record<string, string> = {
  heian_shodan: "lZyI9mtk924",
  heian_nidan: "_ZPODff5Vew",
  heian_sandan: "28T1JbwbjuE",
  heian_godan: "qxw4Guoogu0",
  bassai_dai: "EryYYUXvojw",
  bassai_sho: "ki17srZIQHI",
  kanku_dai: "2rrBRdMmYyA",
  kanku_sho: "WOFf0xWEoUM",
  enpi: "vsOt9sMtgeA",
  jiin: "HzRfPqm6Ycc",
  jitte: "XivYh0vSMCQ",
  hangetsu: "G6bR1KpZS4w",
  gankaku: "WcgGK6f-eZs",
  sochin: "ksZ3TGAGdIc",
  nijushiho: "8XLEtTkn2iU",
  meikyo: "W8vSLsnZJFA",
  unsu: "ozDrcTQo3zs",
  gojushiho_sho: "sFAzqnAW9NM",
  gojushiho_dai: "r-77w9I5kO8",
};

const RE_ID = /^[A-Za-z0-9_-]{11}$/;

/** Ricava l'ID di 11 caratteri da un link YouTube (watch, youtu.be, shorts, embed, live) o da un ID già pulito. */
export function idDaLinkYoutube(testo: string): string | null {
  const s = testo.trim();
  if (RE_ID.test(s)) return s;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www\.|m\.|music\.)/, "");
  let id: string | null = null;
  if (host === "youtu.be") id = url.pathname.slice(1).split("/")[0];
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    id = url.searchParams.get("v");
    if (!id) {
      const m = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/);
      id = m?.[1] ?? null;
    }
  }
  return id && RE_ID.test(id) ? id : null;
}

/** Video da mostrare: quello scelto dal dojo, altrimenti il predefinito. */
export function videoKata(kata: string, personalizzati: Record<string, string>): { id: string; personalizzato: boolean } | null {
  if (personalizzati[kata]) return { id: personalizzati[kata], personalizzato: true };
  if (VIDEO_PREDEFINITI[kata]) return { id: VIDEO_PREDEFINITI[kata], personalizzato: false };
  return null;
}

export const linkYoutube = (id: string) => `https://www.youtube.com/watch?v=${id}`;
export const anteprimaYoutube = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
export const embedYoutube = (id: string) => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
