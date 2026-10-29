import { toPng } from 'html-to-image';

/** Exporte un nœud du DOM en PNG puis le partage (ou le télécharge si le partage de fichiers n'existe pas). */
export async function shareNodeAsPng(node: HTMLElement, filename: string, title: string): Promise<'partage' | 'telecharge'> {
  const options = { pixelRatio: 2, backgroundColor: '#0B0F14', cacheBust: true };
  let dataUrl: string;
  try {
    dataUrl = await toPng(node, options);
  } catch {
    // Les polices distantes peuvent bloquer l'export : on réessaie sans les embarquer.
    dataUrl = await toPng(node, { ...options, skipFonts: true });
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
