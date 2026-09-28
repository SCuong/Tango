import React, { useEffect, useState } from 'react';
import { useNavigation } from './hooks/useNavigation';
import { HomeStudyHub } from './features/books/HomeStudyHub';
import { BookStudyView } from './features/study/BookStudyView';
import { CategoryInBook } from './features/study/CategoryInBook';
import { LearnByType } from './features/study/LearnByType';
import { LessonDetail } from './features/study/LessonDetail';
import { LessonItems } from './features/study/LessonItems';
import { QuizConfigScreen } from './features/quiz/QuizConfigScreen';
import { QuizRunnerScreen } from './features/quiz/QuizRunnerScreen';
import { QuizResultsScreen } from './features/quiz/QuizResultsScreen';
import { SettingsScreen } from './features/settings/SettingsScreen';
import { ContentManagement } from './features/content-management/ContentManagement';
import { AddBookScreen } from './features/content-management/AddBookScreen';
import { ManageBookScreen } from './features/content-management/ManageBookScreen';
import { ManageLessonScreen } from './features/content-management/ManageLessonScreen';
import { ImportScreen } from './features/content-management/ImportScreen';
import { NotFoundScreen } from './components/NotFoundScreen';
import {
  MobileBottomNav,
  PrimaryDestination,
  getPrimaryDestination,
  shouldAnimateRootEntrance,
} from './components/PrimaryNav';

/**
 * Class for the screen wrapper: root destinations reserve the mobile bottom-nav space, and a
 * switch between two different roots adds the entrance transition (DESIGN_SYSTEM §16.0).
 */
export function rootWrapperClassName(destination: PrimaryDestination | null, entering: boolean): string | undefined {
  if (!destination) return undefined;
  return entering ? 'tango-primary-root tango-root-enter' : 'tango-primary-root';
}

/**
 * Screen router / navigation coordinator: one canonical screen per route (SCREEN_SPEC §4).
 */
export const App: React.FC = () => {
  const { route } = useNavigation();
  const primaryDestination = getPrimaryDestination(route);

  // Remember which root was shown last so only root-to-root switches animate. Updated during
  // render (React's "adjust state when a prop changes" pattern), so the entrance class lands in
  // the same commit that mounts the new root screen: no extra frame, no navigation delay.
  const [rootMotion, setRootMotion] = useState({ destination: primaryDestination, entering: false });
  if (rootMotion.destination !== primaryDestination) {
    setRootMotion({
      destination: primaryDestination,
      entering: shouldAnimateRootEntrance(rootMotion.destination, primaryDestination),
    });
  }

  // Root destinations (Home, Test, Settings) get the mobile primary navigation; deeper and
  // focused flows (study details, active quiz, results, management, import) never do.
  // The wrapper element stays the same on every route so screens are not remounted by it.
  return (
    <div className={rootWrapperClassName(primaryDestination, rootMotion.entering)}>
      <Screens />
      {primaryDestination && <MobileBottomNav active={primaryDestination} />}
    </div>
  );
};

const Screens: React.FC = () => {
  const { route } = useNavigation();

  // Each screen starts at the top of the page
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      window.scrollTo(0, 0);
    }
  }, [route.type]);

  switch (route.type) {
    case 'home':
      return <HomeStudyHub />;
    case 'book_study':
      return <BookStudyView key={route.bookId} bookId={route.bookId} />;
    case 'category_inside_book':
      return <CategoryInBook key={`${route.bookId}/${route.category}`} bookId={route.bookId} category={route.category} />;
    case 'learn_by_type':
      return <LearnByType key={route.category} category={route.category} />;
    case 'lesson_detail':
      return <LessonDetail key={route.lessonId} lessonId={route.lessonId} />;
    case 'lesson_items':
      return <LessonItems key={route.lessonId} lessonId={route.lessonId} />;
    case 'category_quiz_config':
      return (
        <QuizConfigScreen
          key={`category/${route.bookId}/${route.category}`}
          scope={{ kind: 'category', bookId: route.bookId, category: route.category }}
        />
      );
    case 'book_quiz_config':
      return <QuizConfigScreen key={`book/${route.bookId}`} scope={{ kind: 'book', bookId: route.bookId }} />;
    case 'mixed_quiz_config':
      return <QuizConfigScreen key="mixed" scope={{ kind: 'mixed' }} />;
    case 'quiz_session':
      return <QuizRunnerScreen key="session" review={false} />;
    case 'quiz_review':
      return <QuizRunnerScreen key="review" review />;
    case 'quiz_results':
      return <QuizResultsScreen />;
    case 'settings':
      return <SettingsScreen />;
    case 'content_management':
      return <ContentManagement />;
    case 'add_book':
      return <AddBookScreen />;
    case 'manage_book':
      return <ManageBookScreen key={route.bookId} bookId={route.bookId} />;
    case 'manage_lesson':
      return <ManageLessonScreen key={route.lessonId} lessonId={route.lessonId} />;
    case 'import':
      return <ImportScreen />;
    case 'not_found':
      return <NotFoundScreen />;
  }
};

export default App;
