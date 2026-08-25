import { motion, useReducedMotion } from 'framer-motion';
import { LineChart, ShieldHalf, Radio, Trophy, History, Gauge } from 'lucide-react';
import { FeatureCard } from '@/components/ui/grid-feature-cards';
import type React from 'react';

const features = [
  {
    title: 'Poisson × Dixon-Coles core',
    icon: LineChart,
    stat: 'λ / μ',
    description: 'Expected goals modelled as independent Poisson processes, corrected with a Dixon-Coles tau adjustment for realistic low-score dependence.',
  },
  {
    title: '12-factor weighting vector',
    icon: Gauge,
    stat: '12×',
    description: 'Form, personnel, tactics, motivation, rest, travel, and H2H are each scored 1–10 and rolled into a single home/away multiplier.',
  },
  {
    title: 'Live ESPN scoreboard feed',
    icon: Radio,
    stat: 'LIVE',
    description: 'Fixtures, kickoff times, and venues are pulled from the ESPN soccer scoreboard, with a Football-Data.org fallback if a matchday is empty.',
  },
  {
    title: 'Leagues, cups & UEFA',
    icon: Trophy,
    stat: '23',
    description: 'Top 10 European leagues plus domestic cups and UEFA competitions — each with its own goal environment and home-advantage baseline.',
  },
  {
    title: 'Head-to-head memory',
    icon: History,
    stat: 'H2H',
    description: 'Direct meeting history and rivalry context nudge the model — a derby or a lopsided historical record shifts the odds, not just current form.',
  },
  {
    title: 'Confidence tiering',
    icon: ShieldHalf,
    stat: '±',
    description: 'Every prediction ships with a Low, Moderate, High, or Very High confidence read, so a coin-flip fixture never masquerades as a lock.',
  },
];

type ViewAnimationProps = {
  delay?: number;
  className?: string;
  children: React.ReactNode;
};

function AnimatedContainer({ className, delay = 0.1, children }: ViewAnimationProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ filter: 'blur(4px)', translateY: -8, opacity: 0 }}
      whileInView={{ filter: 'blur(0px)', translateY: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.8 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function FeaturesSection() {
  return (
    <section id="features" className="border-t py-16 md:py-24" style={{ borderColor: 'var(--border-glass)' }}>
      <div className="mx-auto w-full max-w-5xl space-y-10 px-4">
        <AnimatedContainer className="mx-auto max-w-2xl text-center">
          <span className="font-mono text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--accent-text)' }}>
            How the engine works
          </span>
          <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-balance md:text-3xl" style={{ color: 'var(--text-primary)' }}>
            One model, twelve inputs, every top-flight matchday
          </h2>
          <p className="mt-3 text-sm md:text-base" style={{ color: 'var(--text-secondary)' }}>
            No black box — each fixture below is scored from real scoreboard data through a transparent, weighted statistical pipeline.
          </p>
        </AnimatedContainer>

        <AnimatedContainer
          delay={0.3}
          className="glass grid grid-cols-1 divide-x divide-y divide-[color:var(--border-glass)] sm:grid-cols-2 md:grid-cols-3"
        >
          {features.map((feature, i) => (
            <FeatureCard key={i} feature={feature} />
          ))}
        </AnimatedContainer>
      </div>
    </section>
  );
}
