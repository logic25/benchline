import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <section className="container-bl flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <span className="font-serif text-7xl text-gold-dark">404</span>
      <h1 className="mt-6 font-serif text-3xl text-navy">This part isn&rsquo;t on the calendar.</h1>
      <p className="mt-3 max-w-md text-slate">
        The page you&rsquo;re looking for doesn&rsquo;t exist or has moved. Let&rsquo;s
        get you back on the docket.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/">Back to home</ButtonLink>
        <ButtonLink href="/faq" variant="outline">
          Visit the FAQ
        </ButtonLink>
      </div>
    </section>
  );
}
