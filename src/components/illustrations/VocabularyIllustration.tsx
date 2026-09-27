import React from 'react';
import { IllustrationProps, StudyCardIllustration } from './StudyCardIllustration';

/** Decorative Vocabulary illustration (study card with `あ`). Color comes from `currentColor`. */
export const VocabularyIllustration: React.FC<IllustrationProps> = ({ className }) => (
  <StudyCardIllustration glyph="あ" idPrefix="tango-vocabulary-illustration" className={className} />
);
