"use client";
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { anteprimaYoutube, embedYoutube, linkYoutube } from "@/lib/domain/kataVideo";

/**
 * Video YouTube "leggero": mostra l'anteprima e carica il lettore solo al tocco,
 * così la pagina con tanti kata resta veloce. Usa youtube-nocookie (niente cookie finché non si guarda).
 */
export function VideoYoutube({ id, titolo }: { id: string; titolo: string }) {
  const [avviato, setAvviato] = useState(false);
  return (
    <div className="video">
      {avviato ? (
        <iframe
          src={embedYoutube(id)}
          title={titolo}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <button type="button" className="video-anteprima" onClick={() => setAvviato(true)} aria-label={`Guarda ${titolo}`}>
          <img src={anteprimaYoutube(id)} alt="" loading="lazy" />
          <span className="video-play" aria-hidden="true">
            <svg viewBox="0 0 68 48" width="68" height="48"><path d="M66.5 7.7A8.5 8.5 0 0 0 60.5 1.7C55.3.3 34 .3 34 .3S12.7.3 7.5 1.7A8.5 8.5 0 0 0 1.5 7.7C.1 12.9.1 24 .1 24s0 11.1 1.4 16.3a8.5 8.5 0 0 0 6 6C12.7 47.7 34 47.7 34 47.7s21.3 0 26.5-1.4a8.5 8.5 0 0 0 6-6C67.9 35.1 67.9 24 67.9 24s0-11.1-1.4-16.3z" fill="#c00" /><path d="M45 24 27 14v20z" fill="#fff" /></svg>
          </span>
        </button>
      )}
      <a className="hint video-link" href={linkYoutube(id)} target="_blank" rel="noopener noreferrer">Apri su YouTube ↗</a>
    </div>
  );
}
