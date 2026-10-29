import { toPng } from 'html-to-image';

// Pixel transparent : remplace une photo qui ne se charge pas, pour que l'export n'échoue jamais.
const PLACEHOLDER = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([p, new Promise<T>((_, reject) => setTimeout(() => reject(new Error('délai dépassé')), ms))]);
}

/** Exporte un nœud du DOM en PNG puis le partage (ou le télécharge si le partage de fichiers n'existe pas). */
export async function shareNodeAsPng(node: HTMLElement, filename: string, title: string): Promise<'partage' | 'telecharge'> {
  const options = { pixelRatio: 2, backgroundColor: '#0B0F14', imagePlaceholder: PLACEHOLDER };
  let dataUrl: string;
  try {
    dataUrl = await withTimeout(toPng(node, options), 15000);
  } catch {
    // Polices distantes ou photos trop lentes : on réessaie sans polices embarquées.
    dataUrl = await withTimeout(toPng(node, { ...options, skipFonts: true }), 15000);
  }
  const blob = await (await fetch(dataUrl)).blob();
  const file = new File([blob], filename, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return 'partage';
    } catch (e) {
      if ((e as DOMException).name === 'AbortError') return 'partage';
    }
  }
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  return 'telecharge';
}
