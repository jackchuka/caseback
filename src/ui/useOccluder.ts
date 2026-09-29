import { useEffect, useRef } from 'react';
import { occluders } from '../state/occluders';

// Registers the element's screen box while `active`, so the camera frames the subject beside it. Measured only when
// the element resizes or the window does, never per frame. `heightVar` also publishes its height as a CSS variable.
export function useOccluder<T extends HTMLElement>(active: boolean, heightVar?: string) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !active) return;
    const id = Symbol();
    let height = -1;
    const measure = () => {
      const r = el.getBoundingClientRect();
      occluders.set(id, { left: r.left, top: r.top, right: r.right, bottom: r.bottom });
      if (heightVar && Math.round(r.height) !== height) {
        height = Math.round(r.height);
        document.documentElement.style.setProperty(heightVar, `${height}px`);
      }
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      removeEventListener('resize', measure);
      occluders.remove(id);
    };
  }, [active, heightVar]);
  return ref;
}
