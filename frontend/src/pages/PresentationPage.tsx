import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios, { AxiosError } from 'axios';
import { ClassRecord } from '../types';
import { useSocket } from '../hooks/useSocket';
import PresentationDeck from '../components/PresentationDeck';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

const PresentationPage = () => {
  const { classId } = useParams<{ classId: string }>();
  const [classData, setClassData] = useState<ClassRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const pdfObjectUrlRef = useRef<string | null>(null);

  const releasePdfObjectUrl = useCallback(() => {
    if (pdfObjectUrlRef.current) {
      URL.revokeObjectURL(pdfObjectUrlRef.current);
      pdfObjectUrlRef.current = null;
    }
  }, []);

  const loadPdfFromBase64 = useCallback((pdfBase64: string) => {
    try {
      const binary = window.atob(pdfBase64);
      const length = binary.length;
      const bytes = new Uint8Array(length);
      for (let index = 0; index < length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
      }
      const blob = new Blob([bytes], { type: 'application/pdf' });
      releasePdfObjectUrl();
      const objectUrl = URL.createObjectURL(blob);
      pdfObjectUrlRef.current = objectUrl;
      setPdfUrl(objectUrl);
    } catch (decodeError) {
      console.error('Error decoding PDF base64 data', decodeError);
    }
  }, [releasePdfObjectUrl]);

  const { socket, connected } = useSocket(classId, {
    onSlideUpdate: (slide) => {
      console.log('PresentationPage: onSlideUpdate ->', slide);
      setCurrentSlide(slide);
    },
    onPresentationData: (payload) => {
      if (typeof payload.currentSlide === 'number') {
        console.log('PresentationPage: onPresentationData currentSlide ->', payload.currentSlide);
        setCurrentSlide(payload.currentSlide);
      }
      if (payload.pdfBase64) {
        loadPdfFromBase64(payload.pdfBase64);
      }
      if (payload.classId) {
        setClassData((previous: ClassRecord | null) => {
          if (previous) {
            return {
              ...previous,
              current_slide: typeof payload.currentSlide === 'number' ? payload.currentSlide : previous.current_slide,
              total_slides: typeof payload.totalSlides === 'number' ? payload.totalSlides : previous.total_slides,
              slides: Array.isArray(payload.slides) ? (payload.slides as ClassRecord['slides']) : previous.slides,
              title: payload.title ?? previous.title,
            };
          }
          if (!classId) {
            return previous;
          }
          return {
            id: classId,
            title: payload.title ?? '',
            course: '',
            level: '',
            created_at: new Date().toISOString(),
            presentation_file: '',
            pdf_path: `/api/classes/${classId}/pdf`,
            slides: Array.isArray(payload.slides) ? (payload.slides as ClassRecord['slides']) : [],
            total_slides: typeof payload.totalSlides === 'number' ? payload.totalSlides : 0,
            status: 'ready',
            current_slide: typeof payload.currentSlide === 'number' ? payload.currentSlide : 0,
            session: null,
          };
        });
      }
    },
  });

  useEffect(() => {
    const fetchClass = async () => {
      if (!classId) return;
      try {
        setLoading(true);
        const response = await axios.get<ClassRecord>(`${API_BASE_URL}/api/classes/${classId}`);
        setClassData(response.data);
        setCurrentSlide(response.data.current_slide ?? 0);
      } catch (fetchError: unknown) {
        if (axios.isAxiosError(fetchError)) {
          const axiosError = fetchError as AxiosError<{ error?: string }>;
          setError(axiosError.response?.data?.error ?? axiosError.message);
        } else {
          setError('No se pudo obtener la clase');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchClass();
  }, [classId]);

  useEffect(() => {
    if (!classData || pdfUrl) {
      return;
    }
    if (classData.pdf_path) {
      setPdfUrl(`${API_BASE_URL}${classData.pdf_path}`);
    }
  }, [classData, pdfUrl]);

  useEffect(() => {
    if (!classId || !connected) {
      return;
    }
    console.log('Requesting presentation data over socket for class', classId);
    socket.emit('request_presentation', { classId });
  }, [classId, connected, socket]);

  useEffect(() => {
    console.log('PresentationPage: currentSlide state is', currentSlide);
  }, [currentSlide]);

  useEffect(() => () => {
    releasePdfObjectUrl();
  }, [releasePdfObjectUrl]);

  if (!classId) {
    return <p>Identificador de clase inválido.</p>;
  }

  const effectivePdfUrl = pdfUrl ?? (classData ? `${API_BASE_URL}${classData.pdf_path}` : null);

  return (
    <main className="layout">
      <header className="header">
        <Link to={`/classes/${classId}`}>← Volver a la clase</Link>
        <h1>Presentación</h1>
      </header>
      {loading && <p>Cargando…</p>}
      {error && <p className="error">{error}</p>}
      {classData && effectivePdfUrl && (
        <PresentationDeck pdfUrl={effectivePdfUrl} currentSlide={currentSlide} />
      )}
    </main>
  );
};

export default PresentationPage;
