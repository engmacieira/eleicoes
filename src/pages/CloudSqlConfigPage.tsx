import React, { useState, useEffect } from 'react';
import { CloudSqlConfigView } from '../components/CloudSqlConfigView';
import { RawElectionDataset } from '../types/election';
import { loadFallbackDataset } from '../services/api';
import { useAppRouter } from '../router/RouterContext';

export const CloudSqlConfigPage: React.FC = () => {
  const { currentRoute } = useAppRouter();
  const [dataset, setDataset] = useState<RawElectionDataset | null>(null);

  const subTab =
    (currentRoute.query?.tab as 'status' | 'guide' | 'seeder') || 'status';

  useEffect(() => {
    let isMounted = true;
    loadFallbackDataset()
      .then((ds) => {
        if (isMounted) setDataset(ds);
      })
      .catch((err) => console.error('Erro ao carregar dataset na configuração:', err));

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <CloudSqlConfigView dataset={dataset} initialTab={subTab} />
    </div>
  );
};
