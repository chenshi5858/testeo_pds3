import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios, { AxiosError } from 'axios';
import { ClassRecord } from '../types';
import { useSocket } from '../hooks/useSocket';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

const ClassSessionPage = () => {
  const { classId } = useParams<{ classId: string }>();
  const [classData, setClassData] = useState<ClassRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const { socket } = useSocket(classId, {
    onSlideUpdate: (slide) => {
      setCurrentSlide(slide);
    },
    onClassStarted: () => {
      setStatusMessage('La clase está en vivo');
      reloadClass();
    },
    onClassStopped: () => {
      setStatusMessage('La clase finalizó');
      reloadClass();
    },
  });

  const reloadClass = async () => {
    if (!classId) return;
    try {
      setLoading(true);
      const response = await axios.get<ClassRecord>(`${API_BASE_URL}/api/classes/${classId}`);
      setClassData(response.data);
      setCurrentSlide(response.data.current_slide ?? 0);
      setError(null);
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

  useEffect(() => {
    reloadClass();
  }, [classId]);

  const handleStart = async () => {
    if (!classId) return;
    try {
      await axios.post(`${API_BASE_URL}/api/classes/${classId}/start`);
      setStatusMessage('Clase iniciada');
      reloadClass();
    } catch (startError: unknown) {
      setStatusMessage('No se pudo iniciar la clase');
      if (axios.isAxiosError(startError)) {
        const axiosError = startError as AxiosError<{ error?: string }>;
        setError(axiosError.response?.data?.error ?? axiosError.message);
      }
    }
  };

  const handleStop = async () => {
    if (!classId) return;
    try {
      await axios.post(`${API_BASE_URL}/api/classes/${classId}/stop`);
      setStatusMessage('Clase detenida');
      reloadClass();
    } catch (stopError: unknown) {
      setStatusMessage('No se pudo detener la clase');
      if (axios.isAxiosError(stopError)) {
        const axiosError = stopError as AxiosError<{ error?: string }>;
        setError(axiosError.response?.data?.error ?? axiosError.message);
      }
    }
  };

  if (!classId) {
    return <p>Identificador de clase inválido.</p>;
  }

  return (
    <main className="layout">
      <header className="header">
        <Link to="/">← Volver</Link>
        <h1>Clase</h1>
        {classData && <h2>{classData.title}</h2>}
      </header>
      {loading && <p>Cargando clase…</p>}
      {error && <p className="error">{error}</p>}
      {statusMessage && <p>{statusMessage}</p>}
      {classData && (
        <section className="card">
          <h2>Detalles</h2>
          <ul className="details">
            <li><strong>Asignatura:</strong> {classData.course || 'N/D'}</li>
            <li><strong>Nivel:</strong> {classData.level || 'N/D'}</li>
            <li><strong>Estado:</strong> {classData.status}</li>
            <li><strong>Diapositiva actual:</strong> {currentSlide + 1}</li>
            <li><strong>Total de diapositivas:</strong> {classData.total_slides}</li>
          </ul>
          <div className="button-row">
            <button type="button" onClick={handleStart}>Iniciar clase</button>
            <button type="button" onClick={handleStop}>Finalizar clase</button>
            <Link className="button-link" to={`/classes/${classId}/control`}>Ir al control</Link>
            <Link className="button-link" to={`/classes/${classId}/presentation`}>Ver presentación</Link>
          </div>
        </section>
      )}
    </main>
  );
};

export default ClassSessionPage;
