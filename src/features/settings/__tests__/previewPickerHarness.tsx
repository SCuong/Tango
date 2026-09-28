import React from 'react';
import { renderToString } from 'react-dom/server';
import { AppStateProvider } from '../../../hooks/useAppState';
import { UserStudyState } from '../../../types';
import { PreviewRadioGroup } from '../SettingsScreen';

export interface PreviewCardProps {
  value: string;
  onSelect: () => void;
  onKeyDown: (e: Partial<React.KeyboardEvent>) => void;
}

function collect(tree: unknown, match: (props: Record<string, unknown>) => boolean): Record<string, unknown>[] {
  const found: Record<string, unknown>[] = [];
  const walk = (node: unknown) => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== 'object' || !('props' in node)) return;
    const props = (node as React.ReactElement).props as Record<string, unknown>;
    if (match(props)) found.push(props);
    walk(props.children);
  };
  walk(tree);
  return found;
}

/** Calls a component during a server render (hooks work) and returns the element tree it built. */
function renderTree(state: UserStudyState, build: () => React.ReactNode): unknown {
  let tree: unknown = null;
  const Capture = () => {
    tree = build();
    return tree as React.ReactElement;
  };
  renderToString(
    <AppStateProvider initialState={state}>
      <Capture />
    </AppStateProvider>
  );
  return tree;
}

/**
 * Returns the props of a Settings preview picker's cards (there is no DOM in this test
 * environment): the picker's radio group is expanded into its cards so their click and keyboard
 * handlers can be called directly.
 */
export function previewPickerCards(state: UserStudyState, picker: () => React.ReactNode): PreviewCardProps[] {
  const tree = renderTree(state, picker);
  const [group] = collect(tree, (props) => Array.isArray(props.options) && typeof props.onChange === 'function');
  const groupTree = renderTree(state, () =>
    PreviewRadioGroup(group as unknown as Parameters<typeof PreviewRadioGroup>[0])
  );
  return collect(groupTree, (props) => typeof props.onSelect === 'function' && typeof props.value === 'string') as unknown as PreviewCardProps[];
}
