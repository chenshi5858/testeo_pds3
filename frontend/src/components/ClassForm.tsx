import { ChangeEvent, FormEvent, useState } from 'react';
import axios, { AxiosError } from 'axios';
import { ClassRecord } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

interface Props {
  onCreated?: (record: ClassRecord) => void;
}

const ClassForm = ({ onCreated }: Props) => {
  const [title, setTitle] = useState('');
  const [course, setCourse] = useState('');
  const [level, setLevel] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (submitEvent: FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault();
    setError(null);
    if (!file) {
      setError('Selecciona un archivo de presentación');
      return;
    }
    const formData = new FormData();
    formData.append('title', title);
    formData.append('course', course);
    formData.append('level', level);
    formData.append('file', file);

    try {
      setLoading(true);
      const response = await axios.post<ClassRecord>(`${API_BASE_URL}/api/classes`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onCreated?.(response.data);
      setTitle('');
      setCourse('');
      setLevel('');
      setFile(null);
    } catch (error: unknown) {
      let message = 'Error al subir la presentación';
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ error?: string }>;
        const payload = axiosError.response?.data;
        message = payload?.error ?? axiosError.message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (setter: (value: string) => void) => (event: ChangeEvent<HTMLInputElement>) => {
    setter(event.target.value);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] ?? null);
  };

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2>Crear una clase</h2>
      <label>
        Título
  <input value={title} onChange={handleTextChange(setTitle)} placeholder="Clase de muestra" />
      </label>
      <label>
        Asignatura
  <input value={course} onChange={handleTextChange(setCourse)} placeholder="Matemáticas" />
      </label>
      <label>
        Nivel
  <input value={level} onChange={handleTextChange(setLevel)} placeholder="1° Medio" />
      </label>
      <label>
        Presentación (PPTX, PPT o PDF)
  <input type="file" accept=".pptx,.ppt,.pdf" onChange={handleFileChange} />
      </label>
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Procesando…' : 'Crear clase'}
      </button>
    </form>
  );
};

export default ClassForm;
