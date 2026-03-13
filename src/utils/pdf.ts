/**
 * 📄 Motor de exportación PDF
 *
 * Convierte una porción del DOM en un PDF multipágina respetando bloques lógicos.
 * La clave del enfoque es:
 * - renderizar el nodo como imagen por página
 * - detectar cortes naturales con `data-pdf-block`
 * - evitar tajazos feos cuando una sección ya no cabe
 */
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

type ExportPdfOptions = {
  marginMm?: number;
  scale?: number;
  backgroundColor?: string;
  pageBlockSelector?: string;
};

type PageSlice = {
  top: number;
  height: number;
};

function wait(ms: number) {
  // ⏱️ Pequeña pausa para permitir estabilización visual antes del render.
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadImages(container: HTMLElement): Promise<void[]> {
  // 🖼️ Garantiza que todas las imágenes del clon estén listas antes del screenshot.
  const images = Array.from(container.querySelectorAll('img'));

  return Promise.all(
    images.map((img) => {
      if (img.complete) return Promise.resolve();

      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    })
  );
}

function getElementAbsoluteTop(element: HTMLElement, root: HTMLElement) {
  // 📐 Calcula la posición vertical absoluta de un bloque dentro del nodo raíz.
  const elRect = element.getBoundingClientRect();
  const rootRect = root.getBoundingClientRect();
  return elRect.top - rootRect.top + root.scrollTop;
}

function getTopLevelBlocks(root: HTMLElement, pageBlockSelector: string) {
  // 🧱 Filtra solo bloques de primer nivel para evitar que padre e hijo compitan entre sí.
  return Array.from(root.querySelectorAll<HTMLElement>(pageBlockSelector))
    .filter((el) => el.offsetParent !== null)
    .filter((el) => {
      let parent = el.parentElement;

      while (parent && parent !== root) {
        if (parent.matches(pageBlockSelector)) {
          return false;
        }
        parent = parent.parentElement;
      }

      return true;
    });
}

function buildPageSlices(
  root: HTMLElement,
  pageContentHeightPx: number,
  pageBlockSelector: string
): PageSlice[] {
  // ✂️ Genera los fragmentos verticales que se convertirán en páginas PDF.
  const blocks = getTopLevelBlocks(root, pageBlockSelector);

  const totalHeight = root.scrollHeight;

  if (!blocks.length) {
    // 🪚 Fallback: si no hay bloques declarados, se corta por altura fija.
    const fallbackSlices: PageSlice[] = [];
    let currentTop = 0;

    while (currentTop < totalHeight) {
      fallbackSlices.push({
        top: currentTop,
        height: Math.min(pageContentHeightPx, totalHeight - currentTop),
      });
      currentTop += pageContentHeightPx;
    }

    return fallbackSlices;
  }

  const slices: PageSlice[] = [];
  let pageTop = 0;
  let pageBottom = pageContentHeightPx;

  for (const block of blocks) {
    const blockTop = getElementAbsoluteTop(block, root);
    const blockHeight = block.offsetHeight;
    const blockBottom = blockTop + blockHeight;

    if (blockHeight > pageContentHeightPx) {
      // 📚 Si un bloque completo no cabe en una página, intentamos dividirlo por sub-bloques.
      if (blockTop > pageTop) {
        slices.push({
          top: pageTop,
          height: blockTop - pageTop,
        });
      }

      const nestedSlices = buildPageSlices(block, pageContentHeightPx, pageBlockSelector);

      if (nestedSlices.length) {
        slices.push(
          ...nestedSlices.map((slice) => ({
            top: blockTop + slice.top,
            height: slice.height,
          }))
        );
      } else {
        // 🧯 Último recurso: cortar por altura cuando ya no existe granularidad interna.
        let oversizedTop = blockTop;
        while (oversizedTop < blockBottom) {
          const chunkHeight = Math.min(pageContentHeightPx, blockBottom - oversizedTop);
          slices.push({
            top: oversizedTop,
            height: chunkHeight,
          });
          oversizedTop += chunkHeight;
        }
      }

      pageTop = blockBottom;
      pageBottom = pageTop + pageContentHeightPx;
      continue;
    }

    if (blockBottom > pageBottom) {
      // ↪️ Si el bloque actual rebasa la página, se mueve entero al siguiente corte.
      if (blockTop > pageTop) {
        slices.push({
          top: pageTop,
          height: blockTop - pageTop,
        });
      }

      pageTop = blockTop;
      pageBottom = pageTop + pageContentHeightPx;
    }
  }

  if (pageTop < totalHeight) {
    slices.push({
      top: pageTop,
      height: Math.min(pageContentHeightPx, totalHeight - pageTop),
    });
  }

  return slices.filter((slice) => slice.height > 0);
}

function createOffscreenContainer(widthPx: number) {
  // 👻 Crea un contenedor fuera de pantalla para renderizar cada página sin afectar la UI visible.
  const wrapper = document.createElement('div');

  wrapper.style.position = 'fixed';
  wrapper.style.left = '-100000px';
  wrapper.style.top = '0';
  wrapper.style.width = `${widthPx}px`;
  wrapper.style.zIndex = '-1';
  wrapper.style.pointerEvents = 'none';
  wrapper.style.opacity = '1';
  wrapper.style.background = '#ffffff';

  document.body.appendChild(wrapper);

  return wrapper;
}

export async function exportNodeToPdf(
  node: HTMLElement,
  filename: string,
  options: ExportPdfOptions = {}
) {
  // 📄 Estrategia resumida del motor:
  // medir -> cortar -> clonar -> rasterizar -> componer PDF -> descargar.
  // 🧮 Convierte proporciones reales del DOM a dimensiones físicas A4 en milímetros.
  const {
    marginMm = 10,
    scale = 2,
    backgroundColor = '#ffffff',
    pageBlockSelector = '[data-pdf-block]',
  } = options;

  const pdf = new jsPDF('p', 'mm', 'a4');

  const pageWidthMm = pdf.internal.pageSize.getWidth();
  const pageHeightMm = pdf.internal.pageSize.getHeight();

  const contentWidthMm = pageWidthMm - marginMm * 2;
  const contentHeightMm = pageHeightMm - marginMm * 2;

  const nodeWidthPx = Math.ceil(node.scrollWidth || node.offsetWidth);
  const pxPerMm = nodeWidthPx / contentWidthMm;
  const pageContentHeightPx = Math.floor(contentHeightMm * pxPerMm);

  const pageSlices = buildPageSlices(node, pageContentHeightPx, pageBlockSelector);

  if (!pageSlices.length) {
    throw new Error('No se pudieron calcular páginas para el PDF.');
  }

  for (let pageIndex = 0; pageIndex < pageSlices.length; pageIndex += 1) {
    const slice = pageSlices[pageIndex];

    // 🪞 Cada página se renderiza a partir de un clon desplazado verticalmente.
    const offscreen = createOffscreenContainer(nodeWidthPx);

    const pageViewport = document.createElement('div');
    pageViewport.style.position = 'relative';
    pageViewport.style.width = `${nodeWidthPx}px`;
    pageViewport.style.height = `${slice.height}px`;
    pageViewport.style.overflow = 'hidden';
    pageViewport.style.background = backgroundColor;

    const clone = node.cloneNode(true) as HTMLElement;
    clone.style.margin = '0';
    clone.style.width = `${nodeWidthPx}px`;
    clone.style.boxSizing = 'border-box';
    clone.style.transform = `translateY(-${slice.top}px)`;
    clone.style.transformOrigin = 'top left';
    clone.style.background = backgroundColor;

    pageViewport.appendChild(clone);
    offscreen.appendChild(pageViewport);

    await loadImages(clone);
    await wait(60);

    const canvas = await html2canvas(pageViewport, {
      scale,
      useCORS: true,
      backgroundColor,
      logging: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: nodeWidthPx,
      windowHeight: slice.height,
    });

    const imgData = canvas.toDataURL('image/png');

    if (pageIndex > 0) {
      // ➕ A partir de la segunda iteración se agrega una nueva hoja.
      pdf.addPage();
    }

    const renderedHeightMm = slice.height / pxPerMm;

    pdf.addImage(
      imgData,
      'PNG',
      marginMm,
      marginMm,
      contentWidthMm,
      renderedHeightMm,
      undefined,
      'FAST'
    );

    document.body.removeChild(offscreen);
  }

  // 💾 Descarga final del archivo en el navegador.
  pdf.save(filename);
}
