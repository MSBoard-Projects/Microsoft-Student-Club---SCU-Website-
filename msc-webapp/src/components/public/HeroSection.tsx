import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { FiArrowUpRight, FiArrowDown } from 'react-icons/fi';
import GlassImage from './GlassImage';
import Icon from './Icon';
import type { ClubAssets } from './types';

export default function HeroSection({ assets }: { assets: ClubAssets }) {
  const section = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end start'] });
  const parallax = useTransform(scrollYProgress, [0, 1], [0, 70]);
  const [activePhoto, setActivePhoto] = useState(0);
  const photos = assets.heroGallery?.length ? assets.heroGallery : [{ src: assets.hero, alt: assets.heroAlt, label: 'Our community' }];
  const photo = photos[activePhoto] ?? photos[0];

  return (
    <section ref={section} className="club-hero" aria-labelledby="club-hero-title">
      <motion.div className="club-hero-photo" style={{ y: reducedMotion ? 0 : parallax }}>
        <motion.div key={photo.src} className="h-full w-full" initial={reducedMotion ? false : { opacity: 0.4 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
          <GlassImage src={photo.src} alt={photo.alt} priority framed={false} position="68% 38%" className="h-full w-full" />
        </motion.div>
      </motion.div>
      <div className="club-hero-shade" aria-hidden="true" />
      <div className="club-container club-hero-content">
        <div className="club-hero-copy">
          <motion.p className="club-eyebrow club-hero-eyebrow" initial={reducedMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }}>SUEZ CANAL UNIVERSITY / STUDENT-LED</motion.p>
          <h1 id="club-hero-title">
            <motion.span initial={reducedMotion ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>Microsoft</motion.span>
            <motion.span initial={reducedMotion ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.7 }}>Student Club<span className="club-hero-period">.</span></motion.span>
          </h1>
          <motion.div initial={reducedMotion ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.6 }}>
            <p className="club-hero-lead">Big ideas start with curious people.<br />Find yours. Build together. Go further.</p>
            <div className="club-hero-actions">
              <Link className="club-cta club-cta-primary" to="/events">Explore events <Icon glyph={FiArrowUpRight} /></Link>
              <a href="#club-story" className="club-hero-story">Our story <Icon glyph={FiArrowDown} /></a>
            </div>
          </motion.div>
        </div>
        <div className="club-hero-bottom">
          <div className="club-hero-signature"><span>LEARN. BUILD. BELONG.</span><span>SUEZ CANAL UNIVERSITY / EGYPT</span></div>
          {photos.length > 1 && <div className="club-hero-gallery" role="group" aria-label="Community highlights">
            {photos.map((image, index) => <button key={image.src} type="button" aria-label={`Show ${image.label}`} aria-pressed={activePhoto === index} title={image.label} onClick={() => setActivePhoto(index)}>
              <GlassImage src={image.src} alt="" framed={false} className="h-full w-full" />
              <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            </button>)}
            <span className="club-hero-caption" aria-live="polite">{photo.label}</span>
          </div>}
        </div>
        <motion.div className="club-hero-seal" animate={reducedMotion ? undefined : { y: [0, -7, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}>
          <GlassImage src={assets.logo} alt="Microsoft Student Club SCU logo" fit="contain" priority>
            <span className="club-seal-label">YOUR PEOPLE. YOUR POSSIBILITIES.</span>
          </GlassImage>
        </motion.div>
      </div>
    </section>
  );
}