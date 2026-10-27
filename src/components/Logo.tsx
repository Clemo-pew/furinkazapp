/* eslint-disable @next/next/no-img-element */
// Segno (fiamma con tigre) + nome dell'app.
export const NOME_APP = "FurinkazApp";

export function Segno({ altezza = 32 }: { altezza?: number }) {
  return <img src="/segno.svg" alt="" width={Math.round(altezza * 0.727)} height={altezza} className="segno" />;
}

export function Logo({ altezza = 32 }: { altezza?: number }) {
  return (
    <span className="logo">
      <Segno altezza={altezza} />
      <span>Furinkaz<span className="logo-app">App</span></span>
    </span>
  );
}
