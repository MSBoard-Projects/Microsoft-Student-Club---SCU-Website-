import { createElement, type ComponentType } from 'react';
import type { IconBaseProps, IconType } from 'react-icons';

export default function Icon({ glyph, ...props }: IconBaseProps & { glyph: IconType }) {
  return createElement(glyph as ComponentType<IconBaseProps>, { 'aria-hidden': true, ...props });
}