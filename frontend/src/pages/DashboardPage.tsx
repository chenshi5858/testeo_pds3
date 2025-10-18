import { useState } from 'react';
import ClassForm from '../components/ClassForm';
import ClassList from '../components/ClassList';
import { ClassRecord } from '../types';

const DashboardPage = () => {
  const [refreshToken, setRefreshToken] = useState<string>('');

  const handleCreated = (record: ClassRecord) => {
    setRefreshToken(record.id);
  };

  return (
    <main className="layout">
      <header className="header">
        <h1>Asistente de Clase IA</h1>
        <p>Configura tus clases, sincroniza el control y proyecta la presentación asistida por IA.</p>
      </header>
      <section className="grid">
        <ClassForm onCreated={handleCreated} />
        <ClassList refreshToken={refreshToken} />
      </section>
    </main>
  );
};

export default DashboardPage;
