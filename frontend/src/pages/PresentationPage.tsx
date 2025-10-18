import { useEffect, useState } from 'react';
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

  const { socket } = useSocket(classId, {
    onSlideUpdate: (slide) => setCurrentSlide(slide),
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

  if (!classId) {
    return <p>Identificador de clase inválido.</p>;
  }

  return (
    <main className="layout">
      <header className="header">
        <Link to={`/classes/${classId}`}>← Volver a la clase</Link>
        <h1>Presentación</h1>
      </header>
      {loading && <p>Cargando…</p>}
      {error && <p className="error">{error}</p>}
      {classData && (
        <PresentationDeck pdfUrl={`${API_BASE_URL}${classData.pdf_path}`} currentSlide={currentSlide} />
      )}
    </main>
  );
};

export default PresentationPage;
