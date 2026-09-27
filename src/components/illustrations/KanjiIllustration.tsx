import React from 'react';
import { IllustrationProps, StudyCardIllustration } from './StudyCardIllustration';

/** Decorative Kanji illustration (study card with `字`). Color comes from `currentColor`. */
export const KanjiIllustration: React.FC<IllustrationProps> = ({ className }) => (
  <StudyCardIllustration glyph="字" idPrefix="tango-kanji-illustration" className={className} />
);
