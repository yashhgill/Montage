export default function About() {
  return (
    <section
      id="about"
      data-testid="about-section"
      className="relative py-24 md:py-32 px-5 md:px-10 bg-[#070713] overflow-hidden"
    >
      <div className="absolute inset-0 grid-noise opacity-30 pointer-events-none" />
      <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-neon-pink/10 blur-[160px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto grid lg:grid-cols-[0.95fr_0.65fr] gap-12 lg:gap-16 items-start">
        <div>
          <p className="text-[11px] uppercase tracking-[0.32em] font-bold text-neon-cyan" data-testid="about-kicker">
            About Montage
          </p>
          <h2 className="mt-4 font-display font-black tracking-tighter text-3xl sm:text-4xl lg:text-6xl leading-[0.95] max-w-3xl" data-testid="about-title">
            We bring the party pieces, then make them feel <span className="text-neon-gradient">effortless.</span>
          </h2>
          <div className="mt-8 space-y-5 text-white/70 leading-relaxed max-w-2xl text-base sm:text-lg">
            <p>
              Montage is the crew you call when an event needs more than tables, chairs, and a playlist. We show up with the lights,
              sound, games, photo moments, bar setup, entertainers, and the kind of energy that gets people out of their seats.
            </p>
            <p>
              No stiff event talk. Tell us the date, the crowd, the venue, and the vibe you want. We help you mix the right
              attractions, keep the setup smooth, and make sure guests leave with stories, photos, and a proper night to remember.
            </p>
          </div>
        </div>

        <div className="grid gap-4">
          {[
            {
              kicker: "What we're about",
              body: "Fun setups, real crowd energy, clean execution, and moments that look good on the night and on camera.",
              accent: "from-neon-pink/20 to-transparent",
            },
            {
              kicker: "How we work",
              body: "Pick the vibe, choose the attractions, and let the Montage team handle the moving parts before the first guest walks in.",
              accent: "from-neon-cyan/20 to-transparent",
            },
            {
              kicker: "Where we play",
              body: "Klang Valley to nationwide — corporate halls, hotel ballrooms, outdoor venues, private homes.",
              accent: "from-neon-lime/20 to-transparent",
            },
          ].map((b) => (
            <div key={b.kicker} className={`relative p-6 rounded-2xl border border-white/10 bg-gradient-to-br ${b.accent} backdrop-blur-md`}>
              <p className="text-[10px] uppercase tracking-[0.32em] font-bold text-neon-pink">{b.kicker}</p>
              <p className="mt-3 text-sm text-white/80 leading-relaxed">{b.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
