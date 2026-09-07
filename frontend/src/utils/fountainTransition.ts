/**
 * fountainTransition.ts
 * Manages mouse click origin tracking for the Fountain Flight transition.
 * When the user clicks any navigation item in the sidebar, the exact click coordinates
 * (clientX, clientY) are captured to serve as the launch origin for destination elements.
 */

interface Point {
  x: number;
  y: number;
}

let lastClickOrigin: Point | null = null;

export function setFountainOrigin(x: number, y: number): void {
  lastClickOrigin = { x, y };
}

export function getFountainOrigin(): Point {
  if (lastClickOrigin) {
    const origin = lastClickOrigin;
    lastClickOrigin = null; // consume once
    return origin;
  }

  // Default fallback if navigation occurred without click (e.g. initial load or direct URL)
  // Originates gracefully from the sidebar area
  const fallbackY = typeof window !== 'undefined' ? window.innerHeight * 0.35 : 220;
  return { x: 80, y: fallbackY };
}

// Global capture listener: ensures any click on sidebar nav items or page links records exact click coordinates
if (typeof window !== 'undefined') {
  window.addEventListener(
    'pointerdown',
    (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.closest('aside a, aside button, nav a, .page-link')) {
        setFountainOrigin(e.clientX, e.clientY);
      }
    },
    { capture: true, passive: true }
  );
}

/**
 * Traverses destination page to collect meaningful visual boxes
 * (Headings, buttons, metric cards, alert boxes, search bars, tables).
 * Does not animate individual icons or microscopic text spans.
 */
export function getFountainElements(container: HTMLElement): HTMLElement[] {
  const pageRoot = container.firstElementChild as HTMLElement | null;
  if (!pageRoot) return [];

  const elements: HTMLElement[] = [];
  const sections = Array.from(pageRoot.children) as HTMLElement[];

  for (const section of sections) {
    // Skip hidden or zero-size elements
    if (section.offsetHeight === 0 && section.offsetWidth === 0) continue;

    // 1. Header sections with title and action button groups
    const hasHeaderTag = section.querySelector('h1, h2');
    if (hasHeaderTag) {
      const directChildren = Array.from(section.children) as HTMLElement[];
      if (directChildren.length >= 2 && directChildren.some((c) => c.querySelector('button, a'))) {
        for (const child of directChildren) {
          if (child.offsetHeight > 0) elements.push(child);
        }
        continue;
      }
    }

    // 2. Metric / KPI card grids (animate each individual card box)
    const isGrid = section.classList.contains('grid');
    const childGrid = section.querySelector(':scope > .grid, :scope > div > .grid') as HTMLElement | null;
    const gridEl = isGrid ? section : childGrid;

    if (gridEl && gridEl.children.length >= 2 && gridEl.children.length <= 12) {
      const cards = Array.from(gridEl.children) as HTMLElement[];
      for (const card of cards) {
        if (card.offsetHeight > 0) {
          elements.push(card);
        }
      }
      continue;
    }

    // 3. Standalone major visual panels (Alert boxes, Search bars, Table containers, Canvas)
    elements.push(section);
  }

  return elements.length > 0 ? elements : [pageRoot];
}
