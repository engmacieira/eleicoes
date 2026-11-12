import {
  EleicaoResumoDto,
  ResultadoCandidatoDto,
  CandidatoHistoricoDto,
  PartidosAnoDto,
  CloudSqlHealthDto,
  RawElectionDataset,
  ViceCandidatoDto,
  ChapaParceiroDto,
} from '../types/election';

let cachedDataset: RawElectionDataset | null = null;
let isBackendLive: boolean | null = null;

// Registro oficial das Chapas Majoritárias de Braúnas/MG (2000 a 2024)
export interface ChapaRegistro {
  ano: number;
  numero: number;
  partido: string;
  prefeito: {
    titulo_eleitor: string;
    nome_urna: string;
    nome_completo: string;
    data_nascimento?: string;
  };
  vice: {
    titulo_eleitor: string;
    nome_urna: string;
    nome_completo: string;
    sigla_partido: string;
    data_nascimento?: string;
  };
}

export const CHAPAS_MAJORITARIAS: ChapaRegistro[] = [
  // 2024
  {
    ano: 2024,
    numero: 12,
    partido: 'PDT',
    prefeito: {
      titulo_eleitor: '086430000299',
      nome_urna: 'Weyne',
      nome_completo: 'WEYNE VIRGILIO DE CARVALHO',
      data_nascimento: '22/06/1967',
    },
    vice: {
      titulo_eleitor: '132490240221',
      nome_urna: 'Prof. Alison Glória',
      nome_completo: 'ALISON MARCONI GLORIA',
      sigla_partido: 'PDT',
      data_nascimento: '07/08/1980',
    },
  },
  {
    ano: 2024,
    numero: 55,
    partido: 'PSD',
    prefeito: {
      titulo_eleitor: '033484791414',
      nome_urna: 'Luis Artur',
      nome_completo: 'LUIS ARTUR BATISTA DE ANDRADE',
      data_nascimento: '07/06/1993',
    },
    vice: {
      titulo_eleitor: '195765200265',
      nome_urna: 'Hugo Ibrahim',
      nome_completo: 'HUGO IBRAHIM LOURENÇO',
      sigla_partido: 'REDE',
      data_nascimento: '14/04/1998',
    },
  },
  {
    ano: 2024,
    numero: 13,
    partido: 'PT',
    prefeito: {
      titulo_eleitor: '007117751422',
      nome_urna: 'Diusa',
      nome_completo: 'RAIMUNDA PEREIRA DE ANDRADE',
      data_nascimento: '11/04/1976',
    },
    vice: {
      titulo_eleitor: '130251280230',
      nome_urna: 'Renato do Padim',
      nome_completo: 'RENATO DOS REIS SILVA',
      sigla_partido: 'PT',
      data_nascimento: '16/09/1979',
    },
  },

  // 2020
  {
    ano: 2020,
    numero: 77,
    partido: 'SOLIDARIEDADE',
    prefeito: {
      titulo_eleitor: '042526470272',
      nome_urna: 'Jovani',
      nome_completo: 'JOVANI DUARTE MENEZES',
      data_nascimento: '20/03/1967',
    },
    vice: {
      titulo_eleitor: '091405140299',
      nome_urna: 'Ibrahim',
      nome_completo: 'IBRAHIM LOURENCO DA SILVA',
      sigla_partido: 'SOLIDARIEDADE',
      data_nascimento: '16/07/1972',
    },
  },
  {
    ano: 2020,
    numero: 14,
    partido: 'PTB',
    prefeito: {
      titulo_eleitor: '086430000299',
      nome_urna: 'Weyne',
      nome_completo: 'WEYNE VIRGILIO DE CARVALHO',
      data_nascimento: '22/06/1967',
    },
    vice: {
      titulo_eleitor: '195765200264',
      nome_urna: 'Marcone Caldeira',
      nome_completo: 'MARCONE CALDEIRA',
      sigla_partido: 'CIDADANIA',
      data_nascimento: '05/01/1980',
    },
  },

  // 2016
  {
    ano: 2016,
    numero: 90,
    partido: 'PROS',
    prefeito: {
      titulo_eleitor: '042526470272',
      nome_urna: 'Jovani',
      nome_completo: 'JOVANI DUARTE MENEZES',
      data_nascimento: '20/03/1967',
    },
    vice: {
      titulo_eleitor: '091405140299',
      nome_urna: 'Ibrahim',
      nome_completo: 'IBRAHIM LOURENCO DA SILVA',
      sigla_partido: 'PP',
      data_nascimento: '16/07/1972',
    },
  },
  {
    ano: 2016,
    numero: 31,
    partido: 'PHS',
    prefeito: {
      titulo_eleitor: '086430000299',
      nome_urna: 'Weyne',
      nome_completo: 'WEYNE VIRGILIO DE CARVALHO',
      data_nascimento: '22/06/1967',
    },
    vice: {
      titulo_eleitor: '004474820213',
      nome_urna: 'Jassy',
      nome_completo: 'JASSY GONCALVES DE SOUZA',
      sigla_partido: 'PSDB',
      data_nascimento: '07/11/1953',
    },
  },
  {
    ano: 2016,
    numero: 70,
    partido: 'PT do B',
    prefeito: {
      titulo_eleitor: '004500790221',
      nome_urna: 'Breno',
      nome_completo: 'BRENO BRANDÃO PINTO',
      data_nascimento: '15/05/1974',
    },
    vice: {
      titulo_eleitor: '037816720213',
      nome_urna: 'Clésio',
      nome_completo: 'CLÉSIO TEIXEIRA',
      sigla_partido: 'PMDB',
      data_nascimento: '10/08/1963',
    },
  },

  // 2012
  {
    ano: 2012,
    numero: 45,
    partido: 'PSDB',
    prefeito: {
      titulo_eleitor: '106688690230',
      nome_urna: 'Flávio',
      nome_completo: 'GERALDO FLAVIO DE ANDRADE',
      data_nascimento: '22/08/1965',
    },
    vice: {
      titulo_eleitor: '037808380299',
      nome_urna: 'Rosali',
      nome_completo: 'ROSALI DA SILVA AGUIAR GUIMARAES',
      sigla_partido: 'PSDB',
      data_nascimento: '02/09/1962',
    },
  },
  {
    ano: 2012,
    numero: 36,
    partido: 'PTC',
    prefeito: {
      titulo_eleitor: '091405140299',
      nome_urna: 'Ibrahim',
      nome_completo: 'IBRAHIM LOURENCO DA SILVA',
      data_nascimento: '16/07/1972',
    },
    vice: {
      titulo_eleitor: '084193480248',
      nome_urna: 'Dr. Kirk Glória',
      nome_completo: 'KIRK ARLEY GLÓRIA',
      sigla_partido: 'PTC',
      data_nascimento: '05/02/1970',
    },
  },

  // 2008
  {
    ano: 2008,
    numero: 43,
    partido: 'PV',
    prefeito: {
      titulo_eleitor: '042526470272',
      nome_urna: 'Jovani',
      nome_completo: 'JOVANI DUARTE MENEZES',
      data_nascimento: '20/03/1967',
    },
    vice: {
      titulo_eleitor: '004528960248',
      nome_urna: 'Noquinha',
      nome_completo: 'JOSE FORTUNATO CALDEIRA',
      sigla_partido: 'PSDB',
      data_nascimento: '30/10/1954',
    },
  },
  {
    ano: 2008,
    numero: 36,
    partido: 'PTC',
    prefeito: {
      titulo_eleitor: '091405140299',
      nome_urna: 'Ibrahim',
      nome_completo: 'IBRAHIM LOURENCO DA SILVA',
      data_nascimento: '16/07/1972',
    },
    vice: {
      titulo_eleitor: '084193480248',
      nome_urna: 'Dr. Kirk Glória',
      nome_completo: 'KIRK ARLEY GLÓRIA',
      sigla_partido: 'PTC',
      data_nascimento: '05/02/1970',
    },
  },
  {
    ano: 2008,
    numero: 70,
    partido: 'PT do B',
    prefeito: {
      titulo_eleitor: '004500790221',
      nome_urna: 'Breno',
      nome_completo: 'BRENO BRANDÃO PINTO',
      data_nascimento: '15/05/1974',
    },
    vice: {
      titulo_eleitor: '037816720213',
      nome_urna: 'Clésio',
      nome_completo: 'CLÉSIO TEIXEIRA',
      sigla_partido: 'PMDB',
      data_nascimento: '10/08/1963',
    },
  },
  {
    ano: 2008,
    numero: 25,
    partido: 'DEM',
    prefeito: {
      titulo_eleitor: '078042770213',
      nome_urna: 'João Samora',
      nome_completo: 'JOÃO BATISTA SAMORA',
      data_nascimento: '24/06/1950',
    },
    vice: {
      titulo_eleitor: '103529370230',
      nome_urna: 'José Ivanir',
      nome_completo: 'JOSÉ IVANIR DA SILVA',
      sigla_partido: 'DEM',
      data_nascimento: '28/11/1973',
    },
  },

  // 2004
  {
    ano: 2004,
    numero: 45,
    partido: 'PSDB',
    prefeito: {
      titulo_eleitor: '106688690230',
      nome_urna: 'Flávio',
      nome_completo: 'GERALDO FLAVIO DE ANDRADE',
      data_nascimento: '22/08/1965',
    },
    vice: {
      titulo_eleitor: '004474820213',
      nome_urna: 'Jassy',
      nome_completo: 'JASSY GONCALVES DE SOUZA',
      sigla_partido: 'PSDB',
      data_nascimento: '07/11/1953',
    },
  },
  {
    ano: 2004,
    numero: 25,
    partido: 'PFL',
    prefeito: {
      titulo_eleitor: '078042770213',
      nome_urna: 'João Samora',
      nome_completo: 'JOÃO BATISTA SAMORA',
      data_nascimento: '24/06/1950',
    },
    vice: {
      titulo_eleitor: '010955560299',
      nome_urna: 'Ivam Pereira',
      nome_completo: 'IVAM PEREIRA ALVES PINTO',
      sigla_partido: 'PFL',
      data_nascimento: '02/10/1952',
    },
  },

  // 2000
  {
    ano: 2000,
    numero: 45,
    partido: 'PSDB',
    prefeito: {
      titulo_eleitor: '106688690230',
      nome_urna: 'Flávio',
      nome_completo: 'GERALDO FLAVIO DE ANDRADE',
      data_nascimento: '22/08/1965',
    },
    vice: {
      titulo_eleitor: '004474820213',
      nome_urna: 'Jassy',
      nome_completo: 'JASSY GONCALVES DE SOUZA',
      sigla_partido: 'PSDB',
      data_nascimento: '07/11/1953',
    },
  },
  {
    ano: 2000,
    numero: 15,
    partido: 'PMDB',
    prefeito: {
      titulo_eleitor: '010955560299',
      nome_urna: 'Ivam Pereira',
      nome_completo: 'IVAM PEREIRA ALVES PINTO',
      data_nascimento: '02/10/1952',
    },
    vice: {
      titulo_eleitor: '063022750230',
      nome_urna: 'Lúcio Flávio',
      nome_completo: 'LUCIO FLÁVIO DE OLIVEIRA',
      sigla_partido: 'PMDB',
      data_nascimento: '21/12/1957',
    },
  },
];

export async function loadFallbackDataset(): Promise<RawElectionDataset> {
  if (cachedDataset) return cachedDataset;
  const res = await fetch('/assets/aistudio/eleicoes_braunas_ed52d128.json');
  if (!res.ok) throw new Error('Falha ao carregar dataset de eleições');
  const data = await res.json();
  cachedDataset = data;
  return data;
}

export async function checkBackendHealth(): Promise<CloudSqlHealthDto> {
  const start = performance.now();
  try {
    const res = await fetch('/api/health', { signal: AbortSignal.timeout(2000) });
    if (res.ok) {
      const data = await res.json();
      isBackendLive = true;
      return {
        status: 'healthy',
        database: data.database || 'eleicoes_db',
        server_ip: data.server_ip || '34.95.135.110',
        engine: data.engine || 'PostgreSQL 15 (Cloud SQL)',
        cloud_project: data.cloud_project || 'eleicoes-braunas',
        latency_ms: Math.round(performance.now() - start),
      };
    }
  } catch {
    // Backend offline / running standalone frontend
  }

  isBackendLive = false;
  return {
    status: 'fallback',
    database: 'eleicoes_db (Simulador Cloud SQL)',
    server_ip: '34.95.135.110',
    engine: 'PostgreSQL 15 (GCP Cloud SQL)',
    cloud_project: 'eleicoes-braunas',
    latency_ms: Math.round(performance.now() - start),
  };
}

export async function getEleicoes(ano?: number, cargo?: string): Promise<EleicaoResumoDto[]> {
  try {
    const params = new URLSearchParams();
    if (ano) params.append('ano', String(ano));
    if (cargo) params.append('cargo', cargo);

    const res = await fetch(`/api/eleicoes?${params.toString()}`, { signal: AbortSignal.timeout(2500) });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // fallback
  }

  // Fallback computation matching FastAPI logic exactly
  const ds = await loadFallbackDataset();
  const anos = Object.keys(ds.eleicoes)
    .map(Number)
    .sort((a, b) => b - a);

  const filteredAnos = ano ? anos.filter((a) => a === ano) : anos;

  return filteredAnos.map((a, idx) => {
    const el = ds.eleicoes[String(a)];
    const detalhes = [];

    const cargos = cargo
      ? [cargo.toLowerCase()]
      : ['prefeito', 'vereador'];

    for (const c of cargos) {
      const det = c === 'prefeito' ? el.detalhes.prefeito : el.detalhes.vereador;
      if (det) {
        const taxaAbs = det.aptos > 0 ? (det.abstencoes / det.aptos) * 100 : 0;
        const taxaComp = det.aptos > 0 ? (det.comparecimento / det.aptos) * 100 : 0;
        detalhes.push({
          id: idx * 10 + (c === 'prefeito' ? 1 : 2),
          cargo: c === 'prefeito' ? 'Prefeito' : 'Vereador',
          aptos: det.aptos,
          comparecimento: det.comparecimento,
          abstencoes: det.abstencoes,
          validos: det.validos,
          brancos: det.brancos,
          nulos: det.nulos,
          taxa_abstencao_pct: Number(taxaAbs.toFixed(2)),
          taxa_comparecimento_pct: Number(taxaComp.toFixed(2)),
        });
      }
    }

    return {
      id: a,
      ano: a,
      detalhes,
    };
  });
}

export async function getResultados(ano: number, cargo: string): Promise<ResultadoCandidatoDto[]> {
  const normCargo = cargo.toLowerCase();

  try {
    const res = await fetch(`/api/resultados?ano=${ano}&cargo=${encodeURIComponent(cargo)}`, {
      signal: AbortSignal.timeout(2500),
    });
    if (res.ok) {
      const data: ResultadoCandidatoDto[] = await res.json();
      if (normCargo === 'prefeito') {
        // Enrich with official vice candidates
        return data.map((cand) => {
          const chapa = CHAPAS_MAJORITARIAS.find(
            (ch) => ch.ano === ano && (ch.numero === cand.numero_urna || ch.prefeito.nome_urna.toLowerCase() === cand.nome_urna.toLowerCase())
          );
          if (chapa) {
            return {
              ...cand,
              titulo_eleitor: chapa.prefeito.titulo_eleitor,
              nome_completo: chapa.prefeito.nome_completo,
              vice: {
                nome_urna: chapa.vice.nome_urna,
                nome_completo: chapa.vice.nome_completo,
                titulo_eleitor: chapa.vice.titulo_eleitor,
                sigla_partido: chapa.vice.sigla_partido,
              },
            };
          }
          return cand;
        });
      }
      return data;
    }
  } catch {
    // fallback
  }

  // Fallback computation
  const ds = await loadFallbackDataset();
  const el = ds.eleicoes[String(ano)];
  if (!el) return [];

  const filtered = el.resultados.filter((r) => r.cargo.toLowerCase() === normCargo);
  const totalVotos = filtered.reduce((acc, curr) => acc + curr.votos, 0) || 1;

  return filtered.map((r) => {
    if (normCargo === 'prefeito') {
      const chapa = CHAPAS_MAJORITARIAS.find(
        (ch) =>
          ch.ano === ano &&
          (ch.numero === r.numero ||
            ch.prefeito.nome_urna.toLowerCase() === r.nome_urna.toLowerCase() ||
            ch.prefeito.titulo_eleitor === r.titulo_eleitor ||
            ch.vice.titulo_eleitor === r.titulo_eleitor)
      );

      if (chapa) {
        return {
          posicao: r.posicao,
          numero_urna: r.numero,
          nome_urna: chapa.prefeito.nome_urna,
          nome_completo: chapa.prefeito.nome_completo,
          titulo_eleitor: chapa.prefeito.titulo_eleitor,
          sigla_partido: r.partido,
          cargo: 'Prefeito',
          votos: r.votos,
          situacao: r.situacao,
          percentual_validos: Number(((r.votos / totalVotos) * 100).toFixed(2)),
          vice: {
            nome_urna: chapa.vice.nome_urna,
            nome_completo: chapa.vice.nome_completo,
            titulo_eleitor: chapa.vice.titulo_eleitor,
            sigla_partido: chapa.vice.sigla_partido,
          },
        };
      }
    }

    const base = ds.candidatos_base[r.titulo_eleitor] || {
      nome_completo: r.nome_urna,
      titulo_eleitor: r.titulo_eleitor,
      data_nascimento: '',
    };

    return {
      posicao: r.posicao,
      numero_urna: r.numero,
      nome_urna: r.nome_urna,
      nome_completo: base.nome_completo,
      titulo_eleitor: r.titulo_eleitor,
      sigla_partido: r.partido,
      cargo: r.cargo,
      votos: r.votos,
      situacao: r.situacao,
      percentual_validos: Number(((r.votos / totalVotos) * 100).toFixed(2)),
      vice: null,
    };
  });
}

export async function getCandidatoHistorico(tituloEleitor: string): Promise<CandidatoHistoricoDto> {
  try {
    const res = await fetch(`/api/candidatos/${tituloEleitor}/historico`, { signal: AbortSignal.timeout(2500) });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // fallback
  }

  // Fallback computation
  const ds = await loadFallbackDataset();

  // Find candidate profile either in base or in chapas
  let baseNome = '';
  let baseData = '';
  if (ds.candidatos_base[tituloEleitor]) {
    baseNome = ds.candidatos_base[tituloEleitor].nome_completo;
    baseData = ds.candidatos_base[tituloEleitor].data_nascimento;
  } else {
    // Check in chapas
    for (const ch of CHAPAS_MAJORITARIAS) {
      if (ch.prefeito.titulo_eleitor === tituloEleitor) {
        baseNome = ch.prefeito.nome_completo;
        baseData = ch.prefeito.data_nascimento || '';
        break;
      }
      if (ch.vice.titulo_eleitor === tituloEleitor) {
        baseNome = ch.vice.nome_completo;
        baseData = ch.vice.data_nascimento || '';
        break;
      }
    }
  }

  if (!baseNome) {
    throw new Error('Candidato não encontrado');
  }

  const historico = [];
  let totalVotos = 0;
  let totalMandatos = 0;

  const anos = Object.keys(ds.eleicoes)
    .map(Number)
    .sort((a, b) => a - b);

  for (const a of anos) {
    const el = ds.eleicoes[String(a)];

    // 1. Check if candidate was in a Majoritarian ticket (as Mayor or as Vice-Mayor)
    const chapaPrefeito = CHAPAS_MAJORITARIAS.find(
      (ch) => ch.ano === a && ch.prefeito.titulo_eleitor === tituloEleitor
    );
    const chapaVice = CHAPAS_MAJORITARIAS.find(
      (ch) => ch.ano === a && ch.vice.titulo_eleitor === tituloEleitor
    );

    if (chapaPrefeito) {
      const resultadoPrefeito = el.resultados.find(
        (r) =>
          r.cargo.toLowerCase() === 'prefeito' &&
          (r.numero === chapaPrefeito.numero || r.partido === chapaPrefeito.partido)
      );

      const votos = resultadoPrefeito ? resultadoPrefeito.votos : 0;
      const situacao = resultadoPrefeito ? resultadoPrefeito.situacao : 'Não eleito';
      const posicao = resultadoPrefeito ? resultadoPrefeito.posicao : null;

      totalVotos += votos;
      if (situacao.toLowerCase().includes('eleito') && !situacao.toLowerCase().includes('não')) {
        totalMandatos++;
      }

      historico.push({
        ano: a,
        cargo: 'Prefeito',
        numero_urna: chapaPrefeito.numero,
        nome_urna: chapaPrefeito.prefeito.nome_urna,
        sigla_partido: chapaPrefeito.partido,
        votos,
        situacao,
        posicao,
        chapa_parceiro: {
          papel: 'Vice-Prefeito' as const,
          nome_urna: chapaPrefeito.vice.nome_urna,
          nome_completo: chapaPrefeito.vice.nome_completo,
          titulo_eleitor: chapaPrefeito.vice.titulo_eleitor,
        },
      });
      continue;
    }

    if (chapaVice) {
      const resultadoPrefeito = el.resultados.find(
        (r) =>
          r.cargo.toLowerCase() === 'prefeito' &&
          (r.numero === chapaVice.numero || r.partido === chapaVice.partido)
      );

      const votos = resultadoPrefeito ? resultadoPrefeito.votos : 0;
      const situacao = resultadoPrefeito ? resultadoPrefeito.situacao : 'Não eleito';
      const posicao = resultadoPrefeito ? resultadoPrefeito.posicao : null;

      totalVotos += votos;
      if (situacao.toLowerCase().includes('eleito') && !situacao.toLowerCase().includes('não')) {
        totalMandatos++;
      }

      historico.push({
        ano: a,
        cargo: 'Vice-Prefeito',
        numero_urna: chapaVice.numero,
        nome_urna: chapaVice.vice.nome_urna,
        sigla_partido: chapaVice.vice.sigla_partido,
        votos,
        situacao,
        posicao,
        chapa_parceiro: {
          papel: 'Prefeito' as const,
          nome_urna: chapaVice.prefeito.nome_urna,
          nome_completo: chapaVice.prefeito.nome_completo,
          titulo_eleitor: chapaVice.prefeito.titulo_eleitor,
        },
      });
      continue;
    }

    // 2. Check if candidate ran for Vereador
    const disputa = el.resultados.find(
      (r) => r.titulo_eleitor === tituloEleitor && r.cargo.toLowerCase() === 'vereador'
    );
    if (disputa) {
      totalVotos += disputa.votos;
      if (disputa.situacao.toLowerCase().includes('eleito') && !disputa.situacao.toLowerCase().includes('não')) {
        totalMandatos++;
      }
      historico.push({
        ano: a,
        cargo: disputa.cargo,
        numero_urna: disputa.numero,
        nome_urna: disputa.nome_urna,
        sigla_partido: disputa.partido,
        votos: disputa.votos,
        situacao: disputa.situacao,
        posicao: disputa.posicao,
        chapa_parceiro: null,
      });
    }
  }

  return {
    titulo_eleitor: tituloEleitor,
    nome_completo: baseNome,
    data_nascimento: baseData || null,
    total_eleicoes_disputadas: historico.length,
    total_mandatos_conquistados: totalMandatos,
    total_votos_acumulados: totalVotos,
    historico,
  };
}

export async function getPartidosAno(ano: number): Promise<PartidosAnoDto> {
  try {
    const res = await fetch(`/api/partidos/${ano}`, { signal: AbortSignal.timeout(2500) });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // fallback
  }

  // Fallback computation
  const ds = await loadFallbackDataset();
  const el = ds.eleicoes[String(ano)];
  if (!el || !el.partidos_vereador) {
    return { ano, partidos: [], total_geral_votos: 0 };
  }

  // Deduplicate and aggregate by partido in case of multiple entries in raw data
  const mapPartidos = new Map<string, { sigla: string; votos_nominais: number; votos_legenda: number; total_votos: number }>();
  for (const p of el.partidos_vereador) {
    const existing = mapPartidos.get(p.partido);
    if (existing) {
      existing.votos_nominais += p.votos_nominais;
      existing.votos_legenda += p.votos_legenda;
      existing.total_votos += p.total_votos;
    } else {
      mapPartidos.set(p.partido, {
        sigla: p.partido,
        votos_nominais: p.votos_nominais,
        votos_legenda: p.votos_legenda,
        total_votos: p.total_votos,
      });
    }
  }

  const list = Array.from(mapPartidos.values());
  const totalGeral = list.reduce((acc, p) => acc + p.total_votos, 0) || 1;

  const partidos = list.map((p) => ({
    ...p,
    percentual_total: Number(((p.total_votos / totalGeral) * 100).toFixed(2)),
  })).sort((a, b) => b.total_votos - a.total_votos);

  return {
    ano,
    partidos,
    total_geral_votos: totalGeral,
  };
}
