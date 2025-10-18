import { ChangeEvent, FormEvent, useState } from 'react';
import { Socket } from 'socket.io-client';

interface Props {
  classId: string;
  socket: Socket;
  currentSlide: number;
  totalSlides: number;
}

const ControlPanel = ({ classId, socket, currentSlide, totalSlides }: Props) => {
  const [targetSlide, setTargetSlide] = useState('');

  const emitAction = (action: 'next' | 'prev' | 'goto', index?: number) => {
    const payload: { classId: string; action: 'next' | 'prev' | 'goto'; index?: number } = {
      classId,
      action,
    };
    if (typeof index === 'number') {
      payload.index = index;
    }
    socket.emit('control_action', payload);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const slideIndex = Number(targetSlide) - 1;
    if (Number.isNaN(slideIndex)) return;
    emitAction('goto', slideIndex);
  };

  return (
    <div className="card">
      <h2>Control remoto</h2>
      <p>
        Diapositiva actual: <strong>{currentSlide + 1}</strong> / {totalSlides || 'N/D'}
      </p>
      <div className="button-row">
        <button type="button" onClick={() => emitAction('prev')}>
          Anterior
        </button>
        <button type="button" onClick={() => emitAction('next')}>
          Siguiente
        </button>
      </div>
      <form onSubmit={handleSubmit} className="goto-form">
        <label>
          Ir a diapositiva
          <input value={targetSlide} onChange={(event: ChangeEvent<HTMLInputElement>) => setTargetSlide(event.target.value)} placeholder="Ej: 3" />
        </label>
        <button type="submit">Ir</button>
      </form>
    </div>
  );
};

export default ControlPanel;
