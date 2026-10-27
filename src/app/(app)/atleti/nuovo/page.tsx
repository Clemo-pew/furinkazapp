import type { Metadata } from "next";
import { contestoStaff } from "@/lib/data/contesto";
import { FormAtleta } from "../FormAtleta";

export const metadata: Metadata = { title: "Nuovo atleta" };

export default async function NuovoAtleta() {
  await contestoStaff();
  return (
    <>
      <h1>Nuovo atleta</h1>
      <FormAtleta />
    </>
  );
}
