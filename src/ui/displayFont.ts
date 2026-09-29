import { useEffect } from 'react';

// The serif display face is only for a few headings, so Google Fonts is asked for just their glyphs
// (`text=`): a few kilobytes instead of the dozens of unicode-range slices a Japanese face otherwise pulls.
export function useDisplayFont(text: string) {
  useEffect(() => {
    const glyphs = [...new Set(text.replace(/\s/g, ''))].sort().join('');
    const href = `https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@300;500&display=swap&text=${encodeURIComponent(glyphs)}`;
    let link = document.getElementById('display-font') as HTMLLinkElement | null;
    if (link?.href === href) return;
    link ??= Object.assign(document.createElement('link'), { id: 'display-font', rel: 'stylesheet' });
    link.href = href;
    document.head.append(link);
  }, [text]);
}
