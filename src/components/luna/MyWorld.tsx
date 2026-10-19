import React from 'react';
import { Feather, BookOpen, HeartHandshake, Sprout, Lock } from 'lucide-react';
import gardenBg from '@/assets/my-world-garden.jpg';

const intentions = [
  {
    icon: Feather,
    title: 'Quiet Reflections',
    text: 'A still place to gather your thoughts, feelings and moments — kept gently, just for you.',
  },
  {
    icon: BookOpen,
    title: 'Your Story',
    text: 'The seasons of your life, held together in one living record that grows with you.',
  },
  {
    icon: HeartHandshake,
    title: 'What Matters',
    text: 'The people, dreams and decisions close to your heart, cared for in one calm space.',
  },
  {
    icon: Sprout,
    title: 'Gentle Growth',
    text: 'Over time, Ordiva will help you notice the patterns in your world — always with your permission.',
  },
];

const MyWorld: React.FC = () => {
  return (
    <div className="relative min-h-dvh overflow-hidden">
      {/* Living garden backdrop */}
      <img
        src={gardenBg}
        alt=""
        width={1024}
        height={1920}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />
      {/* Soft light veil so text stays readable */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/55 via-white/35 to-white/70" />

      <div className="relative px-6 pt-14 pb-10">
        {/* Welcome */}
        <header className="text-center">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-emerald-900/60">
            Your sanctuary
          </p>
          <h1 className="mt-3 font-serif text-4xl font-semibold text-emerald-950">
            My World
          </h1>
          <p className="mx-auto mt-4 max-w-xs text-sm leading-relaxed text-emerald-950/70">
            Step out of the noise. This is your private garden — a peaceful,
            living space that belongs entirely to you.
          </p>
        </header>

        {/* Quiet pool: a moment of stillness */}
        <section className="mt-10 rounded-3xl border border-white/60 bg-white/55 p-6 shadow-[0_18px_50px_-20px_rgba(45,74,62,0.35)] backdrop-blur-md">
          <p className="text-center font-serif text-lg italic text-emerald-950/80">
            “Nothing here is rushed. Nothing here is watched.
            <br />
            This garden grows at your pace.”
          </p>
        </section>

        {/* What will live here */}
        <section className="mt-8 space-y-4">
          <h2 className="text-center text-xs font-medium uppercase tracking-[0.25em] text-emerald-900/60">
            What will grow here
          </h2>
          {intentions.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="flex items-start gap-4 rounded-2xl border border-white/60 bg-white/60 p-5 shadow-[0_10px_30px_-15px_rgba(45,74,62,0.3)] backdrop-blur-md"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-900/10">
                <Icon className="h-5 w-5 text-emerald-900/80" />
              </div>
              <div>
                <h3 className="font-serif text-base font-semibold text-emerald-950">
                  {title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-emerald-950/70">
                  {text}
                </p>
              </div>
            </div>
          ))}
        </section>

        {/* Privacy promise */}
        <footer className="mt-10 flex items-center justify-center gap-2 text-center">
          <Lock className="h-3.5 w-3.5 text-emerald-900/60" />
          <p className="text-xs text-emerald-950/60">
            Everything in My World is private to you — always.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default MyWorld;
