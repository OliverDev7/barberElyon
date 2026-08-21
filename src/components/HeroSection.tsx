import bannerImage from "@/images/banner.jpg";

export function HeroSection() {
  return (
    <section
      className="relative isolate flex min-h-[500px] w-full overflow-hidden bg-cover bg-[58%_center] px-6 py-20 text-white shadow-[0_28px_70px_-42px_rgba(4,47,46,.7)] sm:min-h-[560px] sm:px-10 lg:min-h-[clamp(560px,68vh,720px)] lg:items-center lg:justify-center lg:bg-center lg:px-20 lg:py-24 lg:text-center"
      style={{ backgroundImage: `linear-gradient(120deg, rgba(4, 18, 17, .86) 0%, rgba(4, 18, 17, .68) 48%, rgba(4, 18, 17, .42) 100%), url(${bannerImage.src})` }}
    >
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white/[.06] via-transparent to-black/20" aria-hidden="true" />
      <div className="w-full max-w-[900px]">
        <p className="text-[clamp(.72rem,.68rem+.12vw,.86rem)] font-extrabold uppercase leading-snug tracking-[.2em] text-white/80">
          Bienvenido
        </p>
        <h1 className="mt-5 max-w-[900px] font-display text-[clamp(2rem,9vw,3rem)] font-[760] leading-[1.04] text-white sm:text-[clamp(2.15rem,1.65rem+2.7vw,4.35rem)] lg:mx-auto lg:leading-[1.02]">
          Somos Elyon Barber Studio, reserva tu hora de manera fácil y cómoda.
        </h1>
        <div className="mt-7 h-px w-14 bg-white/70 lg:mx-auto" aria-hidden="true" />
        <blockquote className="mt-5 max-w-[680px] font-display text-[.95rem] font-medium italic leading-[1.65] text-white/90 sm:text-[clamp(.95rem,.88rem+.2vw,1.12rem)] sm:leading-[1.75] lg:mx-auto">
          “Yo no he venido a llamar a los buenos, sino a los pecadores, para que se conviertan”
          <cite className="mt-3 block not-italic text-xs font-bold uppercase tracking-[.16em] text-white/70">
            Lucas 5:32
          </cite>
        </blockquote>
      </div>
    </section>
  );
}
