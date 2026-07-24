import Link from 'next/link';

interface NotFoundStateProps {
  href: string;
  title: string;
  description: string;
  linkLabel: string;
}

export default function NotFoundState({ href, title, description, linkLabel }: NotFoundStateProps) {
  return (
    <main className="flex min-h-[50vh] w-full items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <section className="w-full max-w-xl rounded-2xl bg-surface-container-low p-6 text-center shadow-sm sm:p-10">
        <h1 className="font-serif text-3xl text-on-surface sm:text-4xl">{title}</h1>
        <p className="mx-auto mt-4 max-w-md font-sans text-base leading-7 text-on-surface-variant">
          {description}
        </p>
        <Link
          href={href}
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-6 py-3 font-sans text-sm font-semibold text-on-primary transition-colors hover:bg-primary-dim focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
        >
          {linkLabel}
        </Link>
      </section>
    </main>
  );
}
