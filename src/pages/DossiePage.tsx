import React, { useState, useEffect } from 'react';
import { DossiePoliticoView } from '../components/DossiePoliticoView';
import { RawElectionDataset } from '../types/election';
import { loadFallbackDataset } from '../services/api';
import { useAppRouter } from '../router/RouterContext';

export const DossiePage: React.FC = () => {
  const [dataset, setDataset] = useState<RawElectionDataset | null>(null);
  const [loading, setLoading] = useState(true);
  const { openCandidato } = useAppRouter();

  useEffect(() => {
    let isMounted = true;
    loadFallbackDataset()
      .then((ds) => {
        if (isMounted) {
          setDataset(ds);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Erro ao carregar dataset para o Dossiê:', err);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading && !dataset) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500">
          Carregando base histórica de candidatos e pessoas físicas...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DossiePoliticoView
        dataset={dataset}
        onSelectCandidato={openCandidato}
      />
    </div>
  );
};
