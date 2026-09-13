import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { FiImage } from 'react-icons/fi';
import Icon from './Icon';
import season2Media from '../../content/season2Media.json';

export interface OptimizedImageProps {
  src: string | null;
  alt: string;
  className?: string;
  fit?: 'cover' | 'contain';
  position?: string;
  priority?: boolean;
  framed?: boolean;
  srcSet?: string;
  sizes?: string;
  width?: number;
  height?: number;
  aspectRatio?: CSSProperties['aspectRatio'];
  softEdges?: boolean;
  children?: ReactNode;
}

function ImageFrame({ src, alt, className = '', fit = 'cover', position = 'center', priority = false, framed = true, srcSet, sizes = '(max-width: 760px) 100vw, 50vw', width, height, aspectRatio, softEdges = false, children }: OptimizedImageProps) {
  const [state, setState] = useState<'loading' | 'loaded' | 'failed'>(src ? 'loading' : 'failed');
  const imageRef = useRef<HTMLImageElement>(null);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (imageRef.current?.complete && imageRef.current.naturalWidth > 0) setState('loaded');
  }, []);
  return (
    <motion.div className={`glass-image ${framed ? 'glass-image-framed' : ''} ${className}`} style={{ aspectRatio }}
      aria-busy={state === 'loading'} whileHover={reducedMotion || !framed ? undefined : { y: -4 }} transition={{ duration: 0.3 }}>
      {src && state !== 'failed' ? <img ref={imageRef} src={src} srcSet={srcSet} sizes={sizes} alt={alt}
        width={width} height={height} loading={priority ? 'eager' : 'lazy'} decoding="async"
        style={{ objectFit: fit, objectPosition: position, opacity: state === 'loaded' ? 1 : 0,
          ...(softEdges ? { maskImage: 'linear-gradient(to bottom, black 75%, transparent)', WebkitMaskImage: 'linear-gradient(to bottom, black 75%, transparent)' } : {}) }}
        onLoad={() => setState('loaded')} onError={() => setState('failed')} /> :
        <div className="glass-image-fallback" role="img" aria-label={alt || 'Club image unavailable'}><Icon glyph={FiImage} /><span>Image coming soon</span></div>}
      {state === 'loading' && <span className="glass-image-skeleton" role="status"><span className="sr-only">Loading {alt}</span></span>}
      {framed && <span className="glass-image-edge" aria-hidden="true" />}
      {children}
    </motion.div>
  );
}

export default function OptimizedImage(props: OptimizedImageProps) {
  const rendition = season2Media.find(image => image.src === props.src);
  return <ImageFrame key={`${props.src}|${props.srcSet ?? ''}`} width={rendition?.width} height={rendition?.height} srcSet={rendition?.srcSet} {...props} />;
}