import React from 'react';
import { IconCards, IconNotebook } from '@tabler/icons-react';
import { StudyCategory } from '../../types';
import { useAppState } from '../../hooks/useAppState';
import { useNavigation } from '../../hooks/useNavigation';
import { useI18n } from '../../hooks/useI18n';
import { useCounts } from '../../hooks/useCounts';
import { getCategoryStudyMetrics } from '../../lib/studyMetrics';
import { getBookLessons } from '../../lib/studySelectors';
import { Screen, ScreenHeader, SectionLabel, StickyBottomBar } from '../../components/Screen';
import { Button } from '../../components/Button';
import { NotFoundScreen } from '../../components/NotFoundScreen';
import { CATEGORY_GLYPHS, CATEGORY_LABEL_KEYS, CATEGORY_SURFACE_CLASSES, InlineNotice, LessonList } from './StudyParts';

/**
 * SCREEN 03 — Category View Inside Book (`/book/:bookId/category/:category`).
 * Flat lesson list (title, item count, Answer Accuracy) plus the multi-lesson test action.
 */
export const CategoryInBook: React.FC<{ bookId: string; category: StudyCategory }> = ({
  bookId,
  category,
}) => {
  const { state } = useAppState();
  const { navigate, goUp } = useNavigation();
  const { t } = useI18n();
  const counts = useCounts();
  const book = state.books[bookId];
  const goToBook = () => goUp({ type: 'book_study', bookId });

  if (!book) {
    return <NotFoundScreen message={t('common.notFound.book')} onBack={() => goUp({ type: 'home' })} />;
  }

  const label = t(CATEGORY_LABEL_KEYS[category]);
  const lessons = getBookLessons(state.lessons, bookId, category);
  const metrics = getCategoryStudyMetrics(category, state.lessons, state.progressByItem, bookId);
  const tone = CATEGORY_SURFACE_CLASSES[category];
  const openTest = () => navigate({ type: 'category_quiz_config', bookId, category });

  const testButton = (label: 'full' | 'compact') => (
    <Button
      variant={label === 'full' ? 'primary' : 'secondary'}
      size={label === 'full' ? 'lg' : 'md'}
      fullWidth={label === 'full'}
      icon={<IconCards size={20} stroke={2} />}
      onClick={openTest}
    >
      {t('category.multiTest')}
    </Button>
  );

  return (
    <Screen
      ambience
      width="4xl"
      onEscape={goToBook}
      header={
        <ScreenHeader
          title={label}
          subtitle={book.title}
          onBack={goToBook}
          width="4xl"
          trailing={lessons.length > 0 ? <div className="hidden sm:block">{testButton('compact')}</div> : undefined}
        />
      }
      bottomBar={
        lessons.length > 0 ? (
          <StickyBottomBar width="4xl" mobileOnly>
            {testButton('full')}
          </StickyBottomBar>
        ) : undefined
      }
    >
      <div className="flex items-center gap-3 mb-4">
        <span
          lang="ja"
          aria-hidden="true"
          className={`inline-flex items-center justify-center min-w-[3.25rem] h-10 px-2 rounded-lg border font-japanese font-bold text-lg whitespace-nowrap ${tone.surface} ${tone.glyph}`}
        >
          {CATEGORY_GLYPHS[category]}
        </span>
        <p className="text-sm text-text-secondary leading-snug">
          {t('metrics.lessonsAndItems', {
            lessons: counts.lessons(metrics.lessonCount),
            items: counts.items(metrics.itemCount),
          })}
        </p>
      </div>

      <section aria-labelledby="category-lessons-heading">
        <SectionLabel id="category-lessons-heading" className="sr-only">
          {t('category.lessonsHeading')}
        </SectionLabel>
        {lessons.length === 0 ? (
          <InlineNotice icon={<IconNotebook size={18} stroke={2} />}>
            {t(category === 'vocabulary' ? 'category.emptyInBook.vocabulary' : 'category.emptyInBook.kanji')}
          </InlineNotice>
        ) : (
          <LessonList
            lessons={lessons}
            progressByItem={state.progressByItem}
            onOpen={(lesson) => navigate({ type: 'lesson_detail', lessonId: lesson.id })}
            labelledBy="category-lessons-heading"
          />
        )}
      </section>
    </Screen>
  );
};
