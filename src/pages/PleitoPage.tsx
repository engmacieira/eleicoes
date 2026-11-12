import React, { useState, useEffect } from 'react';
import { PleitoOverview } from '../components/PleitoOverview';
import { DetalhesVotacaoDto, ResultadoCandidatoDto } from '../types/election';
import { getEleicoes, getResultados } from '../services/api';
import { useAppRouter } from '../router/RouterContext';

export const PleitoPage: React.FC = () => {
  const { currentRoute, openCandidato } = useAppRouter();

  // Read initial ano and cargo from route query if available
  const initialAno = currentRoute.query?.ano ? parseInt(currentRoute.query.ano, 10) : 2024;
  const initialCargo = (currentRoute.query?.cargo === 'Prefeito' ? 'Prefeito' : 'Vereador') as
    | 'Prefeito'
    | 'Vereador';

  const [ano, setAno] = useState<number>(initialAno);
  const [cargo, setCargo] = useState<'Prefeito' | 'Vereador'>(initialCargo);
  const [detalhes, setDetalhes] = useState<DetalhesVotacaoDto | null>(null);
  const [resultados, setResultados] = useState<ResultadoCandidatoDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([getEleicoes(ano, cargo), getResultados(ano, cargo)])
      .then(([eleicaoList, resList]) => {
        if (!isMounted) return;

        if (eleicaoList.length > 0 && eleicaoList[0].detalhes.length > 0) {
          const matched =
            eleicaoList[0].detalhes.find(
              (d) => d.cargo.toLowerCase() === cargo.toLowerCase()
            ) || eleicaoList[0].detalhes[0];
          setDetalhes(matched);
        } else {
          setDetalhes(null);
        }

        setResultados(resList);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Erro na consulta de resultados:', err);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [ano, cargo]);

  const handleRefreshResultados = () => {
    setLoading(true);
    Promise.all([getEleicoes(ano, cargo), getResultados(ano, cargo)])
      .then(([eleicaoList, resList]) => {
        if (eleicaoList.length > 0 && eleicaoList[0].detalhes.length > 0) {
          const matched =
            eleicaoList[0].detalhes.find(
              (d) => d.cargo.toLowerCase() === cargo.toLowerCase()
            ) || eleicaoList[0].detalhes[0];
          setDetalhes(matched);
        }
        setResultados(resList);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Erro ao recarregar:', err);
        setLoading(false);
      });
  };

  return (
    <div className="space-y-6">
      <PleitoOverview
        ano={ano}
        setAno={setAno}
        cargo={cargo}
        setCargo={setCargo}
        detalhes={detalhes}
        resultados={resultados}
        loading={loading}
        onSelectCandidato={openCandidato}
        onRefreshResultados={handleRefreshResultados}
      />
    </div>
  );
};
