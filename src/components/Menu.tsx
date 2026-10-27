"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Menu({ voci }: { voci: { href: string; etichetta: string }[] }) {
  const path = usePathname();
  return (
    <nav className="nav" aria-label="Sezioni">
      {voci.map((v) => (
        <Link key={v.href} href={v.href} aria-current={path === v.href || path.startsWith(v.href + "/") ? "page" : undefined}>
          {v.etichetta}
        </Link>
      ))}
    </nav>
  );
}
