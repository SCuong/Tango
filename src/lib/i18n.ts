/**
 * Tango — Localization Foundation & Translation Dictionaries
 *
 * Governed by:
 * - docs/DESIGN_SYSTEM.md (§7)
 * - docs/ARCHITECTURE.md (§§1, 7)
 * - docs/DATA_MODEL.md (§4)
 */

import { AppLanguage } from '../types';

/**
 * Authoritative Vietnamese dictionary (default conceptual source language).
 * Defines the canonical set of translation keys for the application.
 */
export const VI_DICTIONARY = {
  // Common / Brand
  'app.name': 'Tango',
  'app.tagline': 'Học từ vựng và chữ Hán tiếng Nhật cho người Việt',

  // Navigation
  'nav.home': 'Trang chủ',
  'nav.back': 'Quay lại',
  'nav.settings': 'Cài đặt',
  'nav.contentManagement': 'Quản lý nội dung',

  // Actions
  'action.continue': 'Tiếp tục',
  'action.cancel': 'Hủy',
  'action.save': 'Lưu',
  'action.delete': 'Xóa',
  'action.close': 'Đóng',
  'action.start': 'Bắt đầu',
  'action.retry': 'Thử lại',

  // Categories
  'category.vocabulary': 'Từ vựng',
  'category.kanji': 'Hán tự',

  // Appearance & Preferences
  'preferences.theme': 'Giao diện',
  'preferences.theme.light': 'Sáng',
  'preferences.theme.dark': 'Tối',
  'preferences.theme.sakura': 'Sakura',
  'preferences.language': 'Ngôn ngữ',
  'preferences.language.vi': 'Tiếng Việt',
  'preferences.language.en': 'English',
  'preferences.sound': 'Âm thanh hiệu ứng',
  'preferences.sound.on': 'Bật',
  'preferences.sound.off': 'Tắt',

  // Global / Generic States
  'state.loading': 'Đang tải...',
  'state.empty': 'Không có dữ liệu',
  'state.notFound': 'Không tìm thấy trang',

  // Home Screen (SCREEN 01)
  'home.studyBooks': 'Giáo trình',
  'home.learnByType': 'Học theo loại',
  'home.test': 'Kiểm tra',
  'home.viewAllBooks': 'Xem tất cả',
  'home.showFewerBooks': 'Thu gọn',
  'home.emptyBooks.title': 'Chưa có giáo trình nào.',
  'home.emptyBooks.description': 'Bạn có thể thêm giáo trình trong: Cài đặt → Quản lý nội dung.',

  // Metrics & Counters
  'metrics.lessonCount.one': '{count} bài',
  'metrics.lessonCount.other': '{count} bài',
  'metrics.itemCount.one': '{count} mục',
  'metrics.itemCount.other': '{count} mục',
  'metrics.coverage': '{percent}%',

  // Accessibility / ARIA
  'aria.openBook': 'Mở giáo trình {title}',
  'aria.bookCover': 'Bìa giáo trình {title}',
  'aria.learnCategory': 'Học theo loại: {category}',
  'aria.createTest': 'Tạo bài kiểm tra',
  'aria.progressCoverage': 'Độ bao phủ: {percent}%',

  // Common
  'common.unassigned': 'Không thuộc giáo trình',
  'common.saveError': 'Không thể lưu vào thiết bị. Bộ nhớ trình duyệt có thể đã đầy.',
  'common.notFound.book': 'Không tìm thấy giáo trình này. Có thể nó đã bị xóa.',
  'common.notFound.lesson': 'Không tìm thấy bài học này. Có thể nó đã bị xóa.',
  'common.separator': ' · ',

  // Metrics
  'metrics.accuracyValue': 'Độ chính xác: {percent}',
  'metrics.accuracyUnknown': '--',
  'metrics.coverageValue': 'Đã học {percent}%',
  'metrics.weakCount': '{count} từ cần ôn',
  'metrics.lessonsAndItems': '{lessons} · {items}',

  // Book Study View (SCREEN 02)
  'book.header': 'Chi tiết giáo trình',
  'book.categories': 'Phân loại học tập',
  'book.openCategory': 'Mở xem',
  'book.openCategoryAria': 'Mở {category}',
  'book.emptyCategory': 'Chưa có bài học nào',
  'book.test': 'Kiểm tra giáo trình',

  // Category Inside Book (SCREEN 03)
  'category.emptyInBook.vocabulary': 'Chưa có bài học từ vựng nào trong giáo trình này.',
  'category.emptyInBook.kanji': 'Chưa có bài học Hán tự nào trong giáo trình này.',
  'category.multiTest': 'Kiểm tra nhiều bài',
  'category.lessonsHeading': 'Danh sách bài học',

  // Learn by Type (SCREEN 04)
  'learn.title': '{category} · Tất cả giáo trình',
  'learn.empty': 'Chưa có bài học nào trong mục này.',

  // Lesson Detail (SCREEN 05)
  'lesson.actions': 'Hành động học tập',
  'lesson.practice': 'Luyện tập',
  'lesson.practiceDesc': 'Học từng mục, không tính giờ. Từ sai sẽ được hỏi lại.',
  'lesson.quickTest': 'Kiểm tra nhanh',
  'lesson.quickTestDesc': 'Chọn số câu để bắt đầu',
  'lesson.quickTestCountAria': 'Bắt đầu kiểm tra nhanh với {count} câu',
  'lesson.viewItems': 'Xem danh sách từ',
  'lesson.viewItemsDesc': '{count} (Chữ Hán, cách đọc, Hán Việt, nghĩa)',
  'lesson.review': 'Ôn từ sai',
  'lesson.reviewNone': 'Chưa có từ nào cần ôn',

  // Lesson Items (SCREEN 06)
  'items.title': 'Danh sách từ',
  'items.empty': 'Bài học này chưa có mục học nào.',
  'items.hanViet': 'Hán Việt',
  'items.meaning': 'Nghĩa',
  'items.reading': 'Cách đọc',
  'items.word': 'Từ vựng',

  // Quiz configuration (SCREEN 07 – 09)
  'quizConfig.categoryTitle': 'Kiểm tra {category}',
  'quizConfig.bookTitle': 'Kiểm tra giáo trình',
  'quizConfig.mixedTitle': 'Kiểm tra tổng hợp',
  'quizConfig.selectLessons': 'Chọn bài kiểm tra',
  'quizConfig.selectAll': 'Chọn tất cả',
  'quizConfig.clearAll': 'Bỏ chọn tất cả',
  'quizConfig.tally': '{selected} mục đã chọn · {eligible} câu khả dụng',
  'quizConfig.settings': 'Cấu hình bài kiểm tra',
  'quizConfig.count': 'Số câu hỏi',
  'quizConfig.all': 'Tất cả ({count})',
  'quizConfig.types': 'Loại câu hỏi',
  'quizConfig.start': 'Bắt đầu kiểm tra',
  'quizConfig.noEligible': 'Không có câu hỏi phù hợp với các loại câu hỏi đã chọn.',
  'quizConfig.mixedEmpty': 'Chưa có bài học nào khả dụng để tạo bài kiểm tra tổng hợp.',
  'quizConfig.noLessonsInScope': 'Chưa có bài học nào để kiểm tra.',
  'quizType.kana_to_japanese': 'Kana → Chữ Hán/Từ',
  'quizType.japanese_to_vi': 'Từ/Chữ Hán → Tiếng Việt',
  'quizType.vi_to_japanese': 'Tiếng Việt → Chữ Hán/Từ',
  'quizType.vi_to_text': 'Tiếng Việt → Viết câu trả lời',

  // Quiz session (SCREEN 10 – 13)
  'quiz.exit': 'Thoát bài kiểm tra',
  'quiz.progressAria': 'Câu {current} trên {total}',
  'quiz.streakAria': 'Chuỗi đúng: {count}',
  'quiz.timerAria': 'Thời gian: {time}',
  'quiz.optionAria': 'Lựa chọn: {answer}',
  'quiz.instruction.kana_to_japanese': 'Chọn chữ Hán / từ đúng',
  'quiz.instruction.japanese_to_vi': 'Chọn nghĩa tiếng Việt',
  'quiz.instruction.vi_to_japanese': 'Chọn từ tiếng Nhật',
  'quiz.instruction.vi_to_text': 'Viết từ tiếng Nhật hoặc cách đọc',
  'quiz.answerLabel': 'Câu trả lời',
  'quiz.answerPlaceholder': 'Nhập câu trả lời…',
  'quiz.check': 'Kiểm tra',
  'quiz.correct': 'Chính xác!',
  'quiz.incorrect': 'Chưa chính xác',
  'quiz.yourAnswer': 'Bạn đã trả lời: {answer}',
  'quiz.correctAnswer': 'Đáp án: {answer}',
  'quiz.continueAfterMistake': 'Đã hiểu — Tiếp tục',
  'quiz.next': 'Tiếp tục',
  'quiz.exitDialog.title': 'Dừng bài kiểm tra?',
  'quiz.exitDialog.body': 'Tiến độ của bài kiểm tra hiện tại sẽ không được lưu vào lịch sử.',
  'quiz.exitDialog.keep': 'Tiếp tục học',
  'quiz.exitDialog.exit': 'Thoát',
  'quiz.noSession': 'Không có bài kiểm tra nào đang diễn ra.',
  'quiz.saveError': 'Không thể lưu kết quả vào thiết bị. Bộ nhớ trình duyệt có thể đã đầy.',

  // Quiz results (SCREEN 14)
  'results.titleTest': 'Hoàn thành bài kiểm tra!',
  'results.titlePractice': 'Hoàn thành luyện tập!',
  'results.titleReview': 'Hoàn thành ôn tập!',
  'results.score': 'Số câu đúng',
  'results.accuracy': 'Độ chính xác',
  'results.bestStreak': 'Chuỗi đúng dài nhất',
  'results.streakValue': '{count} liên tiếp',
  'results.time': 'Thời gian',
  'results.missed': 'Các từ đã sai',
  'results.reviewMissed': 'Ôn lại các từ đã sai ({count} từ)',
  'results.retry': 'Làm lại bài kiểm tra',
  'results.home': 'Về trang chủ',
  'results.perfect': 'Không có từ nào sai. Tuyệt vời!',
  'results.none': 'Chưa có kết quả nào để hiển thị.',

  // Review missed (SCREEN 15)
  'review.title': 'Ôn lại từ sai',
  'review.empty': 'Tuyệt vời! Bạn không có từ nào cần ôn lại. Hãy tiếp tục luyện tập bài mới.',

  // Settings (SCREEN 16)
  'settings.title': 'Cài đặt',
  'settings.appearance': 'Giao diện & Tùy chọn',
  'settings.language': 'Ngôn ngữ giao diện',
  'settings.theme': 'Chủ đề màu sắc',
  'settings.themeDesc.light': 'Ngọc trai mát · ban ngày',
  'settings.themeDesc.dark': 'Mực đêm · trăng, đèn lồng',
  'settings.themeDesc.sakura': 'Giấy hoa anh đào ấm',
  'settings.sound': 'Âm thanh hiệu ứng',
  'settings.soundDesc': 'Âm chạm nhẹ khi trả lời câu hỏi. Mặc định tắt.',
  'settings.studyContent': 'Nội dung học',
  'settings.manageContent': 'Quản lý giáo trình và bài học',
  'settings.manageContentDesc': 'Thêm, sửa, nhập và phân loại nội dung',

  // Content Management (SCREEN 17)
  'content.books': 'Giáo trình',
  'content.addBook': 'Thêm giáo trình mới',
  'content.manage': 'Quản lý',
  'content.manageAria': 'Quản lý {title}',
  'content.noBooks': 'Chưa có giáo trình nào. Hãy thêm giáo trình đầu tiên.',
  'content.lessonTools': 'Bài học & nhập liệu',
  'content.import': 'Thêm / Nhập bài học mới',
  'content.importDesc': 'Tạo bài học bằng cách dán văn bản hoặc tải tệp lên.',

  // Book form (SCREEN 18, 19)
  'addBook.title': 'Thêm giáo trình',
  'bookForm.title': 'Tên giáo trình',
  'bookForm.titlePlaceholder': 'Ví dụ: 中級へ行こう',
  'bookForm.titleRequired': 'Vui lòng nhập tên giáo trình.',
  'bookForm.cover': 'Ảnh bìa (không bắt buộc)',
  'bookForm.coverLabel': 'Ảnh bìa',
  'bookForm.chooseCover': 'Chọn ảnh bìa',
  'bookForm.changeCover': 'Thay đổi ảnh',
  'bookForm.removeCover': 'Xóa ảnh bìa',
  'bookForm.clearSelection': 'Bỏ ảnh đã chọn',
  'bookForm.coverFormats': 'Hỗ trợ .jpg, .jpeg, .png, .webp',
  'bookForm.coverInvalid': 'Chỉ hỗ trợ tệp ảnh .jpg, .jpeg, .png hoặc .webp.',
  'bookForm.coverPreview': 'Xem trước ảnh bìa',
  'bookForm.savingCover': 'Đang lưu ảnh...',
  'bookForm.create': 'Tạo giáo trình',

  // Manage Study Book (SCREEN 19)
  'manageBook.title': 'Quản lý: {title}',
  'manageBook.details': 'Thông tin giáo trình',
  'manageBook.saveTitle': 'Lưu thay đổi tên sách',
  'manageBook.saved': 'Đã lưu thay đổi.',
  'manageBook.lessons': 'Danh sách bài học ({count})',
  'manageBook.noLessons': 'Giáo trình này chưa có bài học nào.',
  'manageBook.addLesson': 'Thêm bài vào giáo trình này',
  'manageBook.dangerDesc': 'Xóa vĩnh viễn giáo trình và toàn bộ bài học bên trong.',
  'manageBook.delete': 'Xóa giáo trình này',
  'danger.title': 'Vùng nguy hiểm',

  // Manage Lesson (SCREEN 20)
  'manageLesson.title': 'Quản lý bài học',
  'lessonForm.title': 'Tên bài học',
  'lessonForm.titlePlaceholder': 'Ví dụ: Bài 3: Đời sống & Công việc',
  'lessonForm.titleRequired': 'Vui lòng nhập tên bài học.',
  'lessonForm.subtitle': 'Phụ đề chủ đề (không bắt buộc)',
  'lessonForm.category': 'Loại bài học',
  'lessonForm.book': 'Giáo trình trực thuộc',
  'manageLesson.itemCount': 'Số lượng mục học: {count}',
  'manageLesson.save': 'Lưu thay đổi',
  'manageLesson.items': 'Mục học trong bài',
  'manageLesson.dangerDesc': 'Xóa vĩnh viễn bài học này và toàn bộ {count}.',
  'manageLesson.delete': 'Xóa bài học này',

  // Destructive dialogs (SCREEN 25 – 27)
  'dialog.cancel': 'Hủy bỏ',
  'dialog.deletePermanently': 'Xóa vĩnh viễn',
  'dialog.irreversible': 'Hành động này không thể hoàn tác.',
  'dialog.deleteError': 'Không thể xóa. Vui lòng thử lại.',
  'deleteBook.title': 'Xóa vĩnh viễn giáo trình?',
  'deleteBook.intro': 'Bạn sắp xóa:',
  'deleteBook.cascade': 'Toàn bộ bài học, mục từ, tiến độ học tập và ảnh bìa sẽ bị xóa hoàn toàn khỏi thiết bị.',
  'deleteLesson.title': 'Xóa vĩnh viễn bài học?',
  'deleteLesson.items': '{count} sẽ bị xóa vĩnh viễn. Tiến độ học liên quan đến các mục này cũng sẽ bị xóa.',
  'deleteLesson.preserveBook': 'Giáo trình “{title}” và các bài học khác vẫn được giữ nguyên 100%.',
  'deleteLesson.preserveOther': 'Các bài học khác vẫn được giữ nguyên 100%.',
  'removeCover.title': 'Xóa ảnh bìa giáo trình?',
  'removeCover.body': 'Giáo trình và toàn bộ bài học bên trong vẫn được giữ nguyên 100%. Chỉ ảnh bìa sẽ được gỡ bỏ khỏi thiết bị.',
  'removeCover.cancel': 'Hủy',
  'removeCover.confirm': 'Xóa ảnh bìa',

  // Import (SCREEN 21 – 24)
  'import.title': 'Thêm / Nhập bài học',
  'import.stepOf': 'Bước {step}/4 · {name}',
  'import.step.1': 'Nhập dữ liệu',
  'import.step.2': 'Ghép cột',
  'import.step.3': 'Xem trước',
  'import.step.4': 'Hoàn tất',
  'import.method': 'Phương thức nhập',
  'import.method.paste': 'Dán văn bản',
  'import.method.file': 'Tải tệp lên',
  'import.pasteLabel': 'Dán nội dung tại đây',
  'import.pastePlaceholder': 'Ví dụ:\n旅行;りょこう;Lữ Hành;Du lịch\n家族;かぞく;Gia Tộc;Gia đình',
  'import.fileChoose': 'Chọn tệp',
  'import.fileFormats': 'Hỗ trợ .txt, .csv, .md, .xlsx',
  'import.fileSelected': 'Đã chọn: {name}',
  'import.fileInvalid': 'Chỉ hỗ trợ tệp .txt, .csv, .md hoặc .xlsx.',
  'import.fileReadError': 'Không thể đọc tệp này.',
  'import.delimiter': 'Phân cách cột',
  'import.delimiter.auto': 'Tự động (khuyên dùng)',
  'import.delimiter.tab': 'Tab',
  'import.delimiter.semicolon': 'Chấm phẩy ( ; )',
  'import.delimiter.pipe': 'Dấu gạch đứng ( | )',
  'import.delimiter.comma': 'Dấu phẩy ( , )',
  'import.delimiter.custom': 'Ký hiệu khác...',
  'import.customDelimiter': 'Ký hiệu phân cách',
  'import.templates': 'Tải file mẫu',
  'import.continue': 'Tiếp tục: Kiểm tra dữ liệu',
  'import.processing': 'Đang xử lý dữ liệu...',
  'import.noInput': 'Hãy dán nội dung hoặc chọn một tệp.',
  'import.noRows': 'Không tìm thấy dòng dữ liệu nào.',
  'import.back': 'Quay lại',
  'import.mapping.title': 'Ghép cột dữ liệu',
  'import.mapping.desc': 'Chọn cột tương ứng cho từng trường. Chỉ Từ vựng là bắt buộc.',
  'import.mapping.none': '— Không dùng —',
  'import.mapping.column': 'Cột {index}: {sample}',
  'import.mapping.needJapanese': 'Hãy chọn cột cho Từ vựng.',
  'import.mapping.preview': 'Xem trước kết quả',
  'import.field.japanese': 'Từ vựng (bắt buộc)',
  'import.field.kana': 'Cách đọc',
  'import.field.hanViet': 'Âm Hán Việt',
  'import.field.vietnamese': 'Nghĩa tiếng Việt',
  'import.col.japanese': 'Từ vựng',
  'import.col.kana': 'Cách đọc',
  'import.col.hanViet': 'Âm Hán Việt',
  'import.col.vietnamese': 'Nghĩa tiếng Việt',
  'import.col.status': 'Trạng thái',
  'import.summary.book': 'Giáo trình',
  'import.summary.category': 'Phân loại',
  'import.summary.lesson': 'Tên bài',
  'import.summary.count': 'Số lượng',
  'import.badge.ready': '{count} mục sẵn sàng',
  'import.badge.warnings': '{count} mục thiếu thông tin',
  'import.badge.duplicates': '{count} dòng trùng đã tự loại bỏ',
  'import.badge.merged': '{count} mục đã tự gộp bổ sung thông tin',
  'import.badge.conflicts': '{count} xung đột dữ liệu',
  'import.badge.invalid': '{count} dòng thiếu Từ vựng đã bỏ qua',
  'import.warning.noKana': 'Chưa có cách đọc',
  'import.warning.noMeaning': 'Chưa có nghĩa',
  'import.warning.conflict': 'Xung đột dữ liệu',
  'import.statusOk': 'Sẵn sàng',
  'import.warningNote': 'Cảnh báo không ngăn việc thêm bài học.',
  'import.itemOf': 'Mục {index} / {total}',
  'import.moreRows': '+ {count} mục khác',
  'import.backToEdit': 'Quay lại chỉnh sửa',
  'import.confirm': 'Thêm {count} vào bài',
  'import.noValid': 'Không có mục hợp lệ để nhập. Mỗi dòng cần có Từ vựng.',
  'import.done.title': 'Nhập bài học thành công!',
  'import.done.summary': 'Đã lưu {count} vào {lesson} ({category}) trong giáo trình {book}.',
  'import.done.summaryUnassigned': 'Đã lưu {count} vào {lesson} ({category}), không thuộc giáo trình.',
  'import.done.study': 'Bắt đầu học bài này ngay',
  'import.done.back': 'Về Quản lý nội dung',
  'import.mapping.firstRowHeader': 'Dòng đầu tiên là tiêu đề cột',
  'import.adjustMapping': 'Điều chỉnh cột',
  'import.chooseBook': 'Giáo trình trực thuộc',
} as const;

/**
 * Strongly typed translation key representing every available translation string.
 */
export type TranslationKey = keyof typeof VI_DICTIONARY;

/**
 * English dictionary.
 * The `Record<TranslationKey, string>` type enforces compile-time symmetry:
 * any missing or extra key in the English dictionary produces a TypeScript compilation error.
 */
export const EN_DICTIONARY: Record<TranslationKey, string> = {
  // Common / Brand
  'app.name': 'Tango',
  'app.tagline': 'Japanese vocabulary and Kanji learning for Vietnamese learners',

  // Navigation
  'nav.home': 'Home',
  'nav.back': 'Back',
  'nav.settings': 'Settings',
  'nav.contentManagement': 'Content Management',

  // Actions
  'action.continue': 'Continue',
  'action.cancel': 'Cancel',
  'action.save': 'Save',
  'action.delete': 'Delete',
  'action.close': 'Close',
  'action.start': 'Start',
  'action.retry': 'Retry',

  // Categories
  'category.vocabulary': 'Vocabulary',
  'category.kanji': 'Kanji',

  // Appearance & Preferences
  'preferences.theme': 'Theme',
  'preferences.theme.light': 'Light',
  'preferences.theme.dark': 'Dark',
  'preferences.theme.sakura': 'Sakura',
  'preferences.language': 'Language',
  'preferences.language.vi': 'Tiếng Việt',
  'preferences.language.en': 'English',
  'preferences.sound': 'Sound Effects',
  'preferences.sound.on': 'On',
  'preferences.sound.off': 'Off',

  // Global / Generic States
  'state.loading': 'Loading...',
  'state.empty': 'No data available',
  'state.notFound': 'Page not found',

  // Home Screen (SCREEN 01)
  'home.studyBooks': 'Study Books',
  'home.learnByType': 'Learn by Type',
  'home.test': 'Test',
  'home.viewAllBooks': 'View all',
  'home.showFewerBooks': 'Show less',
  'home.emptyBooks.title': 'No study books yet.',
  'home.emptyBooks.description': 'You can add study books from: Settings → Content Management.',

  // Metrics & Counters
  'metrics.lessonCount.one': '{count} lesson',
  'metrics.lessonCount.other': '{count} lessons',
  'metrics.itemCount.one': '{count} item',
  'metrics.itemCount.other': '{count} items',
  'metrics.coverage': '{percent}%',

  // Accessibility / ARIA
  'aria.openBook': 'Open study book: {title}',
  'aria.bookCover': 'Book cover: {title}',
  'aria.learnCategory': 'Learn by type: {category}',
  'aria.createTest': 'Create test',
  'aria.progressCoverage': 'Study coverage: {percent}%',

  // Common
  'common.unassigned': 'Unassigned',
  'common.saveError': 'Could not save on this device. Browser storage may be full.',
  'common.notFound.book': 'This study book could not be found. It may have been deleted.',
  'common.notFound.lesson': 'This lesson could not be found. It may have been deleted.',
  'common.separator': ' · ',

  // Metrics
  'metrics.accuracyValue': 'Accuracy: {percent}',
  'metrics.accuracyUnknown': '--',
  'metrics.coverageValue': '{percent}% studied',
  'metrics.weakCount': '{count} to review',
  'metrics.lessonsAndItems': '{lessons} · {items}',

  // Book Study View (SCREEN 02)
  'book.header': 'Study Book',
  'book.categories': 'Study categories',
  'book.openCategory': 'Open',
  'book.openCategoryAria': 'Open {category}',
  'book.emptyCategory': 'No lessons yet',
  'book.test': 'Test this book',

  // Category Inside Book (SCREEN 03)
  'category.emptyInBook.vocabulary': 'No vocabulary lessons in this book yet.',
  'category.emptyInBook.kanji': 'No Kanji lessons in this book yet.',
  'category.multiTest': 'Multi-Lesson Test',
  'category.lessonsHeading': 'Lessons',

  // Learn by Type (SCREEN 04)
  'learn.title': '{category} · All books',
  'learn.empty': 'No lessons in this category yet.',

  // Lesson Detail (SCREEN 05)
  'lesson.actions': 'Study actions',
  'lesson.practice': 'Practice',
  'lesson.practiceDesc': 'One item at a time, no timer. Missed words come back.',
  'lesson.quickTest': 'Quick Test',
  'lesson.quickTestDesc': 'Choose a question count to start',
  'lesson.quickTestCountAria': 'Start a quick test with {count} questions',
  'lesson.viewItems': 'View word list',
  'lesson.viewItemsDesc': '{count} (word, reading, Hán Việt, meaning)',
  'lesson.review': 'Review missed words',
  'lesson.reviewNone': 'Nothing to review yet',

  // Lesson Items (SCREEN 06)
  'items.title': 'Word list',
  'items.empty': 'This lesson has no items yet.',
  'items.hanViet': 'Hán Việt',
  'items.meaning': 'Meaning',
  'items.reading': 'Reading',
  'items.word': 'Word',

  // Quiz configuration (SCREEN 07 – 09)
  'quizConfig.categoryTitle': '{category} test',
  'quizConfig.bookTitle': 'Test Study Book',
  'quizConfig.mixedTitle': 'Combined Test',
  'quizConfig.selectLessons': 'Choose lessons',
  'quizConfig.selectAll': 'Select all',
  'quizConfig.clearAll': 'Clear all',
  'quizConfig.tally': '{selected} items selected · {eligible} questions available',
  'quizConfig.settings': 'Test settings',
  'quizConfig.count': 'Question count',
  'quizConfig.all': 'All ({count})',
  'quizConfig.types': 'Question types',
  'quizConfig.start': 'Start test',
  'quizConfig.noEligible': 'No eligible questions for the selected question types.',
  'quizConfig.mixedEmpty': 'No lessons are available for a combined test yet.',
  'quizConfig.noLessonsInScope': 'There are no lessons to test yet.',
  'quizType.kana_to_japanese': 'Kana → Japanese',
  'quizType.japanese_to_vi': 'Japanese → Vietnamese',
  'quizType.vi_to_japanese': 'Vietnamese → Japanese',
  'quizType.vi_to_text': 'Vietnamese → Written answer',

  // Quiz session (SCREEN 10 – 13)
  'quiz.exit': 'Exit quiz',
  'quiz.progressAria': 'Question {current} of {total}',
  'quiz.streakAria': 'Streak: {count}',
  'quiz.timerAria': 'Time: {time}',
  'quiz.optionAria': 'Choice: {answer}',
  'quiz.instruction.kana_to_japanese': 'Choose the Japanese word',
  'quiz.instruction.japanese_to_vi': 'Choose the Vietnamese meaning',
  'quiz.instruction.vi_to_japanese': 'Choose the Japanese word',
  'quiz.instruction.vi_to_text': 'Type the Japanese word or its reading',
  'quiz.answerLabel': 'Answer',
  'quiz.answerPlaceholder': 'Type your answer…',
  'quiz.check': 'Check',
  'quiz.correct': 'Correct!',
  'quiz.incorrect': 'Not quite',
  'quiz.yourAnswer': 'Your answer: {answer}',
  'quiz.correctAnswer': 'Answer: {answer}',
  'quiz.continueAfterMistake': 'Got it — Continue',
  'quiz.next': 'Continue',
  'quiz.exitDialog.title': 'Stop this quiz?',
  'quiz.exitDialog.body': 'Progress from this quiz will not be saved to your history.',
  'quiz.exitDialog.keep': 'Keep studying',
  'quiz.exitDialog.exit': 'Exit',
  'quiz.noSession': 'There is no quiz in progress.',
  'quiz.saveError': 'Could not save the results on this device. Browser storage may be full.',

  // Quiz results (SCREEN 14)
  'results.titleTest': 'Quiz complete!',
  'results.titlePractice': 'Practice complete!',
  'results.titleReview': 'Review complete!',
  'results.score': 'Correct',
  'results.accuracy': 'Accuracy',
  'results.bestStreak': 'Best streak',
  'results.streakValue': '{count} in a row',
  'results.time': 'Time',
  'results.missed': 'Missed words',
  'results.reviewMissed': 'Review missed words ({count})',
  'results.retry': 'Retake quiz',
  'results.home': 'Back to Home',
  'results.perfect': 'No mistakes. Excellent!',
  'results.none': 'There are no results to show yet.',

  // Review missed (SCREEN 15)
  'review.title': 'Review Missed Words',
  'review.empty': 'Great! You have no words to review. Keep practicing new lessons.',

  // Settings (SCREEN 16)
  'settings.title': 'Settings',
  'settings.appearance': 'Appearance & Preferences',
  'settings.language': 'Interface language',
  'settings.theme': 'Color theme',
  'settings.themeDesc.light': 'Cool pearl · daytime',
  'settings.themeDesc.dark': 'Midnight ink · moonlit night',
  'settings.themeDesc.sakura': 'Warm blossom paper',
  'settings.sound': 'Sound effects',
  'settings.soundDesc': 'A soft tap when you answer. Off by default.',
  'settings.studyContent': 'Study Content',
  'settings.manageContent': 'Manage books and lessons',
  'settings.manageContentDesc': 'Add, edit, import, and organize content',

  // Content Management (SCREEN 17)
  'content.books': 'Study Books',
  'content.addBook': 'Add study book',
  'content.manage': 'Manage',
  'content.manageAria': 'Manage {title}',
  'content.noBooks': 'No study books yet. Add your first one.',
  'content.lessonTools': 'Lessons & Import',
  'content.import': 'Add / Import lesson',
  'content.importDesc': 'Create a lesson by pasting text or uploading a file.',

  // Book form (SCREEN 18, 19)
  'addBook.title': 'Add Study Book',
  'bookForm.title': 'Book title',
  'bookForm.titlePlaceholder': 'e.g. 中級へ行こう',
  'bookForm.titleRequired': 'Please enter a book title.',
  'bookForm.cover': 'Cover image (optional)',
  'bookForm.coverLabel': 'Cover image',
  'bookForm.chooseCover': 'Choose cover',
  'bookForm.changeCover': 'Change cover',
  'bookForm.removeCover': 'Remove cover',
  'bookForm.clearSelection': 'Clear selected image',
  'bookForm.coverFormats': 'Supports .jpg, .jpeg, .png, .webp',
  'bookForm.coverInvalid': 'Only .jpg, .jpeg, .png, or .webp images are supported.',
  'bookForm.coverPreview': 'Cover preview',
  'bookForm.savingCover': 'Saving image...',
  'bookForm.create': 'Create book',

  // Manage Study Book (SCREEN 19)
  'manageBook.title': 'Manage: {title}',
  'manageBook.details': 'Book details',
  'manageBook.saveTitle': 'Save title',
  'manageBook.saved': 'Changes saved.',
  'manageBook.lessons': 'Lessons ({count})',
  'manageBook.noLessons': 'This book has no lessons yet.',
  'manageBook.addLesson': 'Add a lesson to this book',
  'manageBook.dangerDesc': 'Permanently delete this book and every lesson inside it.',
  'manageBook.delete': 'Delete this book',
  'danger.title': 'Danger Zone',

  // Manage Lesson (SCREEN 20)
  'manageLesson.title': 'Manage Lesson',
  'lessonForm.title': 'Lesson title',
  'lessonForm.titlePlaceholder': 'e.g. Lesson 3: Daily Life',
  'lessonForm.titleRequired': 'Please enter a lesson title.',
  'lessonForm.subtitle': 'Topic subtitle (optional)',
  'lessonForm.category': 'Lesson type',
  'lessonForm.book': 'Parent study book',
  'manageLesson.itemCount': 'Items: {count}',
  'manageLesson.save': 'Save changes',
  'manageLesson.items': 'Items in this lesson',
  'manageLesson.dangerDesc': 'Permanently delete this lesson and all {count}.',
  'manageLesson.delete': 'Delete this lesson',

  // Destructive dialogs (SCREEN 25 – 27)
  'dialog.cancel': 'Cancel',
  'dialog.deletePermanently': 'Delete permanently',
  'dialog.irreversible': 'This action cannot be undone.',
  'dialog.deleteError': 'Could not delete. Please try again.',
  'deleteBook.title': 'Permanently delete this book?',
  'deleteBook.intro': 'You are about to delete:',
  'deleteBook.cascade': 'All lessons, items, study progress, and the cover image will be permanently deleted from this device.',
  'deleteLesson.title': 'Permanently delete this lesson?',
  'deleteLesson.items': '{count} will be permanently deleted, along with their study progress.',
  'deleteLesson.preserveBook': 'The book “{title}” and its other lessons stay 100% intact.',
  'deleteLesson.preserveOther': 'All other lessons stay 100% intact.',
  'removeCover.title': 'Remove the book cover?',
  'removeCover.body': 'The book and all of its lessons stay 100% intact. Only the cover image is removed from this device.',
  'removeCover.cancel': 'Cancel',
  'removeCover.confirm': 'Remove cover',

  // Import (SCREEN 21 – 24)
  'import.title': 'Add / Import Lesson',
  'import.stepOf': 'Step {step} of 4 · {name}',
  'import.step.1': 'Input',
  'import.step.2': 'Map columns',
  'import.step.3': 'Preview',
  'import.step.4': 'Done',
  'import.method': 'Input method',
  'import.method.paste': 'Paste text',
  'import.method.file': 'Upload file',
  'import.pasteLabel': 'Paste your list here',
  'import.pastePlaceholder': 'Example:\n旅行;りょこう;Lữ Hành;Du lịch\n家族;かぞく;Gia Tộc;Gia đình',
  'import.fileChoose': 'Choose a file',
  'import.fileFormats': 'Supports .txt, .csv, .md, .xlsx',
  'import.fileSelected': 'Selected: {name}',
  'import.fileInvalid': 'Only .txt, .csv, .md, or .xlsx files are supported.',
  'import.fileReadError': 'This file could not be read.',
  'import.delimiter': 'Column delimiter',
  'import.delimiter.auto': 'Automatic (recommended)',
  'import.delimiter.tab': 'Tab',
  'import.delimiter.semicolon': 'Semicolon ( ; )',
  'import.delimiter.pipe': 'Pipe ( | )',
  'import.delimiter.comma': 'Comma ( , )',
  'import.delimiter.custom': 'Other character...',
  'import.customDelimiter': 'Delimiter character',
  'import.templates': 'Download a template',
  'import.continue': 'Continue: Check data',
  'import.processing': 'Processing data...',
  'import.noInput': 'Paste some text or choose a file.',
  'import.noRows': 'No data rows were found.',
  'import.back': 'Back',
  'import.mapping.title': 'Map columns',
  'import.mapping.desc': 'Choose the column for each field. Only Japanese is required.',
  'import.mapping.none': '— Not used —',
  'import.mapping.column': 'Column {index}: {sample}',
  'import.mapping.needJapanese': 'Choose a column for Japanese.',
  'import.mapping.preview': 'Preview result',
  'import.field.japanese': 'Japanese (required)',
  'import.field.kana': 'Reading (Kana)',
  'import.field.hanViet': 'Hán Việt',
  'import.field.vietnamese': 'Vietnamese meaning',
  'import.col.japanese': 'Japanese',
  'import.col.kana': 'Reading',
  'import.col.hanViet': 'Hán Việt',
  'import.col.vietnamese': 'Meaning',
  'import.col.status': 'Status',
  'import.summary.book': 'Book',
  'import.summary.category': 'Type',
  'import.summary.lesson': 'Lesson',
  'import.summary.count': 'Items',
  'import.badge.ready': '{count} items ready',
  'import.badge.warnings': '{count} items missing info',
  'import.badge.duplicates': '{count} duplicate rows removed',
  'import.badge.merged': '{count} items merged with extra info',
  'import.badge.conflicts': '{count} data conflicts',
  'import.badge.invalid': '{count} rows without Japanese skipped',
  'import.warning.noKana': 'No reading',
  'import.warning.noMeaning': 'No meaning',
  'import.warning.conflict': 'Data conflict',
  'import.statusOk': 'Ready',
  'import.warningNote': 'Warnings do not block adding the lesson.',
  'import.itemOf': 'Item {index} of {total}',
  'import.moreRows': '+ {count} more items',
  'import.backToEdit': 'Back to edit',
  'import.confirm': 'Add {count} to the lesson',
  'import.noValid': 'No valid items to import. Every row needs a Japanese word.',
  'import.done.title': 'Lesson imported!',
  'import.done.summary': 'Saved {count} to {lesson} ({category}) in {book}.',
  'import.done.summaryUnassigned': 'Saved {count} to {lesson} ({category}), unassigned.',
  'import.done.study': 'Start studying this lesson',
  'import.done.back': 'Back to Content Management',
  'import.mapping.firstRowHeader': 'The first row is a header',
  'import.adjustMapping': 'Adjust columns',
  'import.chooseBook': 'Parent study book',
};

/**
 * Master dictionary map keyed strictly by AppLanguage ('vi' | 'en').
 */
export const DICTIONARIES: Record<AppLanguage, Record<TranslationKey, string>> = {
  vi: VI_DICTIONARY,
  en: EN_DICTIONARY,
};

/**
 * Pure translation function.
 * Looks up the translation key for the specified language, falling back to
 * Vietnamese if missing, and optionally interpolating {key} or {{key}} parameters.
 */
export function translate(
  language: AppLanguage,
  key: TranslationKey,
  params?: Record<string, string | number>
): string {
  const dict = DICTIONARIES[language] ?? DICTIONARIES.vi;
  const template = dict[key] ?? VI_DICTIONARY[key] ?? key;

  if (!params) {
    return template;
  }

  // Single pass with a replacer function: values are inserted literally (no `$&` patterns)
  // and a value that itself contains `{name}` is never substituted again.
  return template.replace(/\{\{(\w+)\}\}|\{(\w+)\}/g, (match, double?: string, single?: string) => {
    const name = double ?? single ?? '';
    return Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match;
  });
}

/**
 * Pure shorthand alias for `translate`.
 */
export const t = translate;
