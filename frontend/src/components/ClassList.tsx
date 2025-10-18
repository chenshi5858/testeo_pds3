import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios, { AxiosError } from 'axios';
import { ClassRecord } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

interface Props {
  refreshToken?: string;
}

const ClassList = ({ refreshToken }: Props) => {
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const response = await axios.get<{ classes: ClassRecord[] }>(`${API_BASE_URL}/api/classes`);
      setClasses(response.data.classes);
    } catch (fetchError: unknown) {
      if (axios.isAxiosError(fetchError)) {
        const axiosError = fetchError as AxiosError<{ error?: string }>;
        const payload = axiosError.response?.data;
        setError(payload?.error ?? axiosError.message);
      } else {
        setError('No se pudo obtener la lista de clases');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, [refreshToken]);

  return (
    <div className="card">
      <div className="card-header">
        <h2>Clases creadas</h2>
        <button type="button" onClick={loadClasses} disabled={loading}>
          Actualizar
        </button>
      </div>
      {loading && <p>Cargando…</p>}
      {error && <p className="error">{error}</p>}
      <ul className="class-list">
  {classes.map((classItem: ClassRecord) => (
          <li key={classItem.id}>
            <div>
              <strong>{classItem.title}</strong>
              <span>{classItem.course || 'Sin asignatura'} · {classItem.total_slides} diapositivas</span>
            </div>
            <div className="actions">
              <Link to={`/classes/${classItem.id}`}>Administrar</Link>
              <Link to={`/classes/${classItem.id}/control`}>Control</Link>
              <Link to={`/classes/${classItem.id}/presentation`}>Presentación</Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ClassList;
