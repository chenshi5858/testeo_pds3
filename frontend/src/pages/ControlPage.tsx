import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios, { AxiosError } from 'axios';
import { Socket } from 'socket.io-client';
import { ClassRecord } from '../types';
import { useSocket } from '../hooks/useSocket';
import ControlPanel from '../components/ControlPanel';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

const ControlPage = () => {
  const { classId } = useParams<{ classId: string }>();
  const [classData, setClassData] = useState<ClassRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const { socket } = useSocket(classId, {
    onSlideUpdate: (slide) => setCurrentSlide(slide),
  });

  useEffect(() => {
    const loadClass = async () => {
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
          setError('No se pudo cargar la clase');
        }
      } finally {
        setLoading(false);
      }
    };
    loadClass();
  }, [classId]);

  if (!classId) {
    return <p>Identificador de clase inválido.</p>;
  }

  const totalSlides = classData?.total_slides ?? classData?.slides?.length ?? 0;

  return (
    <main className="layout">
      <header className="header">
        <Link to={`/classes/${classId}`}>← Volver a la clase</Link>
        <h1>Control</h1>
      </header>
      {loading && <p>Cargando…</p>}
      {error && <p className="error">{error}</p>}
      {classData && socket && (
        <ControlPanel
          classId={classId}
          socket={socket as Socket}
          currentSlide={currentSlide}
          totalSlides={totalSlides}
        />
      )}
    </main>
  );
};

export default ControlPage;
