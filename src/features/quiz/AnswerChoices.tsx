import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnswerLayout } from '../../types';
import {
  AnswerGridMeasurement,
  GRID_OPTION_COUNT,
  answersFitGrid,
  estimateAnswersFitGrid,
  gridMaxLines,
  resolveAnswerLayout,
} from '../../lib/answerLayout';

/** Answer text classes shared by the visible answer cards and the hidden grid measurement. */
export function answerTextClasses(japanese: boolean): string {
  return `${japanese ? 'font-japanese text-xl sm:text-[1.375rem]' : 'text-lg sm:text-xl'} font-semibold leading-snug`;
}

/** Horizontal padding of a grid answer card (room for the feedback icon in the corner). */
export const GRID_ANSWER_PADDING = 'px-6';

// Layout effects do not run on the server; fall back to a plain effect there
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/** Reads the hidden grid replica: the text column width and each answer's rendered line count. */
function measureGridProbe(probe: HTMLElement): AnswerGridMeasurement {
  const texts = Array.from(probe.querySelectorAll<HTMLElement>('[data-answer-probe-text]'));
  let textWidth = texts.length > 0 ? Infinity : 0;
  const answers = texts.map((text) => {
    const style = window.getComputedStyle(text);
    const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.375;
    textWidth = Math.min(textWidth, text.clientWidth);
    return {
      lines: Math.max(1, Math.round(text.getBoundingClientRect().height / lineHeight)),
      overflows: text.scrollWidth > text.clientWidth + 1,
    };
  });
  return { textWidth, answers };
}

/**
 * The effective layout of one question's answers: the saved preference, unless the question does
 * not have four options or its answers do not fit a 2×2 card (DESIGN_SYSTEM §12.4). Measurement runs
 * in a layout effect against a hidden grid replica, so the final layout is chosen before paint;
 * a width change of the answer area re-measures (the saved preference is never touched).
 */
function useEffectiveAnswerLayout(
  requested: AnswerLayout,
  options: readonly string[],
  japanese: boolean,
  containerRef: React.RefObject<HTMLElement>,
  probeRef: React.RefObject<HTMLElement>
): AnswerLayout {
  const eligible = requested === 'grid' && options.length === GRID_OPTION_COUNT;
  const key = `${japanese ? 'ja' : 'ui'}\u0001${options.join('\u0000')}`;
  const [measured, setMeasured] = useState<{ key: string; fits: boolean } | null>(null);

  useIsomorphicLayoutEffect(() => {
    const container = containerRef.current;
    const probe = probeRef.current;
    if (!eligible || !container || !probe) return undefined;
    const measure = () => {
      const fits = answersFitGrid(measureGridProbe(probe), gridMaxLines(japanese));
      setMeasured((previous) => (previous && previous.key === key && previous.fits === fits ? previous : { key, fits }));
    };
    measure();

    let width = container.getBoundingClientRect().width;
    const observer =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            const next = container.getBoundingClientRect().width;
            if (next !== width) {
              width = next;
              measure();
            }
          })
        : null;
    observer?.observe(container);
    // Web fonts arriving late change text widths
    let alive = true;
    document.fonts?.ready.then(() => {
      if (alive) measure();
    });
    return () => {
      alive = false;
      observer?.disconnect();
    };
  }, [eligible, key, japanese]);

  const fits = measured?.key === key ? measured.fits : estimateAnswersFitGrid(options, japanese);
  return resolveAnswerLayout(requested, options.length, fits);
}

/**
 * The answer area of a multiple-choice question: a 2×2 grid or stacked 1×4 rows. The whole question
 * uses one layout; cards in the grid share one height.
 */
export const AnswerChoices: React.FC<{
  requested: AnswerLayout;
  options: readonly string[];
  japanese: boolean;
  renderOption: (option: string, index: number, layout: AnswerLayout) => React.ReactNode;
}> = ({ requested, options, japanese, renderOption }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<HTMLDivElement>(null);
  const layout = useEffectiveAnswerLayout(requested, options, japanese, containerRef, probeRef);
  const measuring = requested === 'grid' && options.length === GRID_OPTION_COUNT;

  return (
    <div ref={containerRef} className="relative" data-answer-layout={layout}>
      {measuring && (
        // Invisible, zero-height replica of the grid cards: measures real text wrapping only
        <div ref={probeRef} aria-hidden="true" data-answer-probe="" className="absolute inset-x-0 top-0 h-0 overflow-hidden invisible pointer-events-none">
          <div className="grid grid-cols-2 gap-3">
            {options.map((option, index) => (
              <div key={index} className={`border ${GRID_ANSWER_PADDING}`}>
                <span data-answer-probe-text="" lang={japanese ? 'ja' : undefined} className={`block ${answerTextClasses(japanese)}`}>
                  {option}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className={layout === 'grid' ? 'grid grid-cols-2 auto-rows-fr gap-3' : 'grid gap-3'}>
        {options.map((option, index) => renderOption(option, index, layout))}
      </div>
    </div>
  );
};
