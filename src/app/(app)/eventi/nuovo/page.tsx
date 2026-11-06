import type { Metadata } from "next";
import { contestoStaff } from "@/lib/data/contesto";
import { oggi } from "@/lib/domain/date";
import { FormEvento } from "../FormEvento";

export const metadata: Metadata = { title: "Nuovo evento" };

export default async function NuovoEvento({ searchParams }: { searchParams: Promise<{ data?: string }> }) {
  await contestoStaff();
  const { data } = await searchParams; // dal tocco su un giorno del calendario
  return (
    <>
      <h1>Nuovo evento</h1>
      <FormEvento dataPredefinita={data && /^\d{4}-\d{2}-\d{2}$/.test(data) ? data : oggi()} />
    </>
  );
}
