import type { Metadata } from "next";
import { contestoStaff } from "@/lib/data/contesto";
import { FormComunicazione } from "../FormComunicazione";

export const metadata: Metadata = { title: "Nuova comunicazione" };

export default async function NuovaComunicazione() {
  await contestoStaff();
  return (
    <>
      <h1>Nuova comunicazione</h1>
      <FormComunicazione />
    </>
  );
}
