import Link from "next/link";

export default function NoEncontrada() {
  return (
    <main id="contenido" className="mx-auto flex min-h-[80vh] max-w-2xl flex-col justify-center px-4 sm:px-8">
      <p className="rotulo">Error 404</p>
      <h1 className="font-titular mt-3 text-[48px] leading-tight">Esta página no existe.</h1>
      <p className="mt-5 text-[18px] text-[var(--gris)]">Puede que el enlace esté mal escrito o que la página se haya movido.</p>
      <p className="mt-8 flex gap-6 text-[16px]">
        <Link href="/" className="toque underline decoration-[var(--linea)] underline-offset-4">
          Ir al inicio
        </Link>
        <Link href="/plan" className="toque underline decoration-[var(--linea)] underline-offset-4">
          Armar mi plan
        </Link>
      </p>
    </main>
  );
}
