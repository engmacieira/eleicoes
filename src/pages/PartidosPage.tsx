import React, { useState } from 'react';
import { RaioXPartidario } from '../components/RaioXPartidario';
import { useAppRouter } from '../router/RouterContext';

export const PartidosPage: React.FC = () => {
  const { currentRoute } = useAppRouter();
  const initialAno = currentRoute.query?.ano ? parseInt(currentRoute.query.ano, 10) : 2024;
  const [ano, setAno] = useState<number>(initialAno);

  return (
    <div className="space-y-6">
      <RaioXPartidario ano={ano} setAno={setAno} />
    </div>
  );
};
