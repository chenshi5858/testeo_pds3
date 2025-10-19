import { useEffect, useRef, useState } from 'react';
import Reveal from 'reveal.js';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.js?url';

GlobalWorkerOptions.workerSrc = pdfWorker;

interface Props {
  pdfUrl: string;
  currentSlide: number;
}

const PresentationDeck = ({ pdfUrl, currentSlide }: Props) => {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const deckRef = useRef<Reveal.Api | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pendingSlideRef = useRef<number | null>(null);
  const [deckReady, setDeckReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadPdf = async () => {
      console.log('PresentationDeck: iniciando carga de PDF', pdfUrl);
      try {
        const doc: PDFDocumentProxy = await getDocument(pdfUrl).promise;
        console.log('PresentationDeck: PDF cargado, páginas:', doc.numPages);
        const renderedSlides: string[] = [];
        
        for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
          const page = await doc.getPage(pageNumber);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          if (!context) {
            console.warn('PresentationDeck: no se pudo obtener contexto 2d para página', pageNumber);
            continue;
          }
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({ canvasContext: context, viewport }).promise;
          renderedSlides.push(canvas.toDataURL('image/png'));
        }
        
        if (isMounted) {
          console.log('PresentationDeck: slides renderizados exitosamente', renderedSlides.length);
          setImages(renderedSlides);
          setError(null);
        }
      } catch (loadError) {
        console.error('PresentationDeck: error al cargar PDF', loadError);
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar la presentación');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      isMounted = false;
    };
  }, [pdfUrl]);

  useEffect(() => {
    if (!containerRef.current || images.length === 0) {
      console.log('PresentationDeck: esperando contenedor o imágenes', { 
        hasContainer: !!containerRef.current, 
        imageCount: images.length 
      });
      return;
    }
    
    if (!deckRef.current) {
      console.log('PresentationDeck: inicializando Reveal.js con', images.length, 'slides');
  const deck = new Reveal(containerRef.current, {
        embedded: true,
        controls: true,
        progress: true,
        slideNumber: true,
        keyboard: true,
        overview: true,
        center: true,
        touch: true,
        loop: false,
        rtl: false,
        navigationMode: 'default',
        shuffle: false,
        fragments: true,
        help: true,
        showNotes: false,
        autoPlayMedia: null,
        preloadIframes: null,
        autoSlide: 0,
        autoSlideStoppable: true,
        mouseWheel: false,
        hideInactiveCursor: true,
        hideCursorTime: 5000,
        transition: 'slide',
        transitionSpeed: 'default',
        backgroundTransition: 'fade',
        display: 'block',
      });
      
      deck.initialize().then(() => {
        console.log('PresentationDeck: Reveal.js inicializado correctamente');
        deckRef.current = deck;
        const targetSlide = pendingSlideRef.current ?? currentSlide;
        pendingSlideRef.current = null;
        deck.slide(targetSlide);
        setDeckReady(true);
      }).catch((initError: Error) => {
        console.error('PresentationDeck: error al inicializar Reveal.js', initError);
      });
    } else {
      console.log('PresentationDeck: sincronizando Reveal.js');
      deckRef.current.sync();
    }
    
    return () => {
      if (deckRef.current && typeof (deckRef.current as any).destroy === 'function') {
        console.log('PresentationDeck: destruyendo instancia de Reveal.js');
        (deckRef.current as any).destroy();
        deckRef.current = null;
      }
      setDeckReady(false);
    };
  }, [images]);

  useEffect(() => {
    if (!deckRef.current) {
      pendingSlideRef.current = currentSlide;
      console.log('PresentationDeck: esperando inicialización de Reveal antes de cambiar slide');
      return;
    }
    console.log('PresentationDeck: cambiando a slide', currentSlide, 'deckReady:', deckReady);
    try {
      deckRef.current.slide(currentSlide);
      deckRef.current.sync();
      if (typeof (deckRef.current as any).layout === 'function') {
        (deckRef.current as any).layout();
      }
    } catch (slideError) {
      console.error('PresentationDeck: error al cambiar de slide', slideError);
    }
  }, [currentSlide, deckReady]);

  return (
    <div className="card">
      <h2>Presentación</h2>
      {loading && <p>Cargando presentación…</p>}
      {error && (
        <div>
          <p className="error">Error: {error}</p>
          <p>
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
              Abrir PDF directamente
            </a>
          </p>
        </div>
      )}
      {!loading && !error && images.length === 0 && <p>No se encontraron diapositivas.</p>}
      {images.length > 0 && (
        <div className="reveal" ref={containerRef} style={{ height: '600px', width: '100%' }}>
          <div className="slides">
            {images.map((src: string, index: number) => (
              <section key={index}>
                <img src={src} alt={`Diapositiva ${index + 1}`} style={{ maxHeight: '100%', maxWidth: '100%' }} />
              </section>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PresentationDeck;
