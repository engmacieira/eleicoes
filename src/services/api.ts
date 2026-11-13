import {
  EleicaoResumoDto,
  ResultadoCandidatoDto,
  CandidatoHistoricoDto,
  PartidosAnoDto,
  CloudSqlHealthDto,
  RawElectionDataset,
  ViceCandidatoDto,
  ChapaParceiroDto,
  ColigacaoDto,
  ColigacaoMembroDto,
  CreateColigacaoPayload,
  UpdateColigacaoPayload,
  PartidoCadastroDto,
  PartidoHistoricoDto,
  CreatePartidoPayload,
  UpdatePartidoPayload,
  ParametrosQeDto,
  UpdateParametrosQePayload,
  ChapaProporcionalDto,
  CreateChapaProporcionalPayload,
  UpdateChapaProporcionalPayload,
  CalculoQeResponseDto,
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

const BASE_CHAPAS_MAJORITARIAS: ChapaRegistro[] = [
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

const CHAPAS_OVERRIDES_KEY = 'vigiminas_chapas_overrides_v1';
export const CANDIDATURA_OVERRIDES_KEY = 'vigiminas_candidaturas_overrides_v1';

export function getChapasMajoritarias(): ChapaRegistro[] {
  let overrides: Record<string, Partial<ChapaRegistro>> = {};
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(CHAPAS_OVERRIDES_KEY) : null;
    if (raw) overrides = JSON.parse(raw);
  } catch {}

  return BASE_CHAPAS_MAJORITARIAS.map((base) => {
    const key = `${base.ano}_${base.numero}`;
    const ov = overrides[key];
    if (!ov) return base;

    return {
      ...base,
      ...ov,
      prefeito: {
        ...base.prefeito,
        ...(ov.prefeito || {}),
      },
      vice: {
        ...base.vice,
        ...(ov.vice || {}),
      },
    };
  });
}

export let CHAPAS_MAJORITARIAS: ChapaRegistro[] = getChapasMajoritarias();

export function refreshChapasMajoritarias(): ChapaRegistro[] {
  CHAPAS_MAJORITARIAS = getChapasMajoritarias();
  return CHAPAS_MAJORITARIAS;
}

export interface CorrigirVinculoPayload {
  ano: number;
  cargo: 'Prefeito' | 'Vereador';
  numero_urna: number;
  // Titular
  titular_novo_titulo?: string;
  titular_novo_nome_completo?: string;
  titular_novo_nome_urna?: string;
  // Vice (para Prefeito)
  vice_novo_titulo?: string;
  vice_novo_nome_completo?: string;
  vice_novo_nome_urna?: string;
  vice_nova_sigla?: string;
}

export async function corrigirVinculoCandidatura(payload: CorrigirVinculoPayload): Promise<void> {
  const normCargo = payload.cargo.toLowerCase();

  // If Prefeito / Vice
  if (normCargo === 'prefeito') {
    let overrides: Record<string, any> = {};
    try {
      const raw = localStorage.getItem(CHAPAS_OVERRIDES_KEY);
      if (raw) overrides = JSON.parse(raw);
    } catch {}

    const key = `${payload.ano}_${payload.numero_urna}`;
    const current = overrides[key] || {};

    const updatedPrefeito = {
      ...(current.prefeito || {}),
    };
    if (payload.titular_novo_titulo) updatedPrefeito.titulo_eleitor = payload.titular_novo_titulo.trim();
    if (payload.titular_novo_nome_completo) updatedPrefeito.nome_completo = payload.titular_novo_nome_completo.trim().toUpperCase();
    if (payload.titular_novo_nome_urna) updatedPrefeito.nome_urna = payload.titular_novo_nome_urna.trim();

    const updatedVice = {
      ...(current.vice || {}),
    };
    if (payload.vice_novo_titulo) updatedVice.titulo_eleitor = payload.vice_novo_titulo.trim();
    if (payload.vice_novo_nome_completo) updatedVice.nome_completo = payload.vice_novo_nome_completo.trim().toUpperCase();
    if (payload.vice_novo_nome_urna) updatedVice.nome_urna = payload.vice_novo_nome_urna.trim();
    if (payload.vice_nova_sigla) updatedVice.sigla_partido = payload.vice_nova_sigla.trim().toUpperCase();

    overrides[key] = {
      ...current,
      ano: payload.ano,
      numero: payload.numero_urna,
      prefeito: updatedPrefeito,
      vice: updatedVice,
    };

    localStorage.setItem(CHAPAS_OVERRIDES_KEY, JSON.stringify(overrides));
    refreshChapasMajoritarias();

    // Register / update Person records in dynamic cadastros so they exist in DadosCandidato
    if (payload.titular_novo_titulo && payload.titular_novo_nome_completo) {
      createCandidato({
        titulo_eleitor: payload.titular_novo_titulo,
        nome_completo: payload.titular_novo_nome_completo,
      }).catch(() => {});
    }

    if (payload.vice_novo_titulo && payload.vice_novo_nome_completo) {
      createCandidato({
        titulo_eleitor: payload.vice_novo_titulo,
        nome_completo: payload.vice_novo_nome_completo,
      }).catch(() => {});
    }
  } else {
    // General candidacy (e.g. Vereador)
    let candOverrides: Record<string, any> = {};
    try {
      const raw = localStorage.getItem(CANDIDATURA_OVERRIDES_KEY);
      if (raw) candOverrides = JSON.parse(raw);
    } catch {}

    const key = `${payload.ano}_${payload.cargo}_${payload.numero_urna}`;
    candOverrides[key] = {
      ano: payload.ano,
      cargo: payload.cargo,
      numero_urna: payload.numero_urna,
      titulo_eleitor: payload.titular_novo_titulo?.trim(),
      nome_completo: payload.titular_novo_nome_completo?.trim().toUpperCase(),
      nome_urna: payload.titular_novo_nome_urna?.trim(),
    };

    localStorage.setItem(CANDIDATURA_OVERRIDES_KEY, JSON.stringify(candOverrides));

    if (payload.titular_novo_titulo && payload.titular_novo_nome_completo) {
      createCandidato({
        titulo_eleitor: payload.titular_novo_titulo,
        nome_completo: payload.titular_novo_nome_completo,
      }).catch(() => {});
    }
  }
}


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
  const dynamic = loadDynamicCadastros();

  const baseAnos = Object.keys(ds.eleicoes).map(Number);
  const customAnos = dynamic.eleicoesCustom
    .filter((e) => !e.is_deleted && e.is_active && e.ano > 0)
    .map((e) => e.ano);

  const anosSet = new Set<number>([...baseAnos, ...customAnos]);
  const anos = Array.from(anosSet).sort((a, b) => b - a);

  const filteredAnos = ano ? anos.filter((a) => a === ano) : anos;

  return filteredAnos.map((a, idx) => {
    const el = ds.eleicoes[String(a)];
    const detalhes = [];

    const cargos = cargo
      ? [cargo.toLowerCase()]
      : ['prefeito', 'vereador'];

    if (!el) {
      // Pleito futuro ou cadastrado recentemente
      for (const c of cargos) {
        detalhes.push({
          id: idx * 10 + (c === 'prefeito' ? 1 : 2),
          cargo: c === 'prefeito' ? 'Prefeito' : 'Vereador',
          aptos: 4100, // Estimativa demográfica média de eleitores para Braúnas
          comparecimento: 0,
          abstencoes: 0,
          validos: 0,
          brancos: 0,
          nulos: 0,
          taxa_abstencao_pct: 0,
          taxa_comparecimento_pct: 0,
        });
      }
    } else {
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
    }

    return {
      id: a,
      ano: a,
      detalhes,
    };
  });
}

export async function getAnosDisponiveis(): Promise<number[]> {
  try {
    const eleicoes = await getEleicoesCadastradas();
    return eleicoes.map((e) => e.ano).sort((a, b) => b - a);
  } catch {
    return [2028, 2024, 2020, 2016, 2012, 2008, 2004, 2000];
  }
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
  refreshChapasMajoritarias();
  const ds = await loadFallbackDataset();
  const el = ds.eleicoes[String(ano)];
  if (!el) return [];

  let candOverrides: Record<string, any> = {};
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(CANDIDATURA_OVERRIDES_KEY) : null;
    if (raw) candOverrides = JSON.parse(raw);
  } catch {}

  const filtered = el.resultados.filter((r) => r.cargo.toLowerCase() === normCargo);
  const totalVotos = filtered.reduce((acc, curr) => acc + curr.votos, 0) || 1;

  return filtered.map((r) => {
    // Check if there is a manual override for this candidate
    const ovKey = `${ano}_${r.cargo}_${r.numero}`;
    const candOv = candOverrides[ovKey];

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
      nome_urna: candOv?.nome_urna || r.nome_urna,
      nome_completo: candOv?.nome_completo || base.nome_completo,
      titulo_eleitor: candOv?.titulo_eleitor || r.titulo_eleitor,
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
  refreshChapasMajoritarias();
  const ds = await loadFallbackDataset();
  const dynamic = loadDynamicCadastros();

  // Find candidate profile either in base, dynamic cadastros, or in chapas
  let baseNome = '';
  let baseData = '';
  if (dynamic.candidatosCustom[tituloEleitor]) {
    baseNome = dynamic.candidatosCustom[tituloEleitor].nome_completo;
    baseData = dynamic.candidatosCustom[tituloEleitor].data_nascimento || '';
  } else if (ds.candidatos_base[tituloEleitor]) {
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

// =======================================================================
// GESTÃO DE CADASTROS (CANDIDATOS, PARTIDOS, ELEIÇÕES) COM SYNC & FALLBACK
// =======================================================================

// In-memory / localStorage store for dynamic CRUD operations
const CADASTRO_STORAGE_KEY = 'vigiminas_cadastros_v1';

interface DynamicCadastrosState {
  candidatosCustom: Record<string, { titulo_eleitor: string; nome_completo: string; data_nascimento?: string | null; is_active: boolean; is_deleted: boolean }>;
  partidosCustom: PartidoCadastroDto[];
  eleicoesCustom: Array<{ id: number; ano: number; is_active: boolean; is_deleted: boolean }>;
}

export const PARTIDOS_BASE_TSE: PartidoCadastroDto[] = [
  {
    id: 10,
    numero: 10,
    sigla: 'REPUBLICANOS',
    nome: 'Republicanos',
    is_active: true,
    is_deleted: false,
    historico: [
      { id: 1001, id_partido: 10, numero: 10, sigla: 'PRB', nome: 'Partido Republicano Brasileiro', ano_inicio: 2005, ano_fim: 2019, is_atual: false, is_active: true, is_deleted: false },
      { id: 1002, id_partido: 10, numero: 10, sigla: 'REPUBLICANOS', nome: 'Republicanos', ano_inicio: 2019, is_atual: true, is_active: true, is_deleted: false },
    ],
  },
  {
    id: 11,
    numero: 11,
    sigla: 'PP',
    nome: 'Progressistas',
    is_active: true,
    is_deleted: false,
    historico: [
      { id: 1101, id_partido: 11, numero: 11, sigla: 'PPB', nome: 'Partido Progressista Brasileiro', ano_inicio: 1995, ano_fim: 2003, is_atual: false, is_active: true, is_deleted: false },
      { id: 1102, id_partido: 11, numero: 11, sigla: 'PP', nome: 'Progressistas', ano_inicio: 2003, is_atual: true, is_active: true, is_deleted: false },
    ],
  },
  {
    id: 12,
    numero: 12,
    sigla: 'PDT',
    nome: 'Partido Democrático Trabalhista',
    is_active: true,
    is_deleted: false,
    historico: [
      { id: 1201, id_partido: 12, numero: 12, sigla: 'PDT', nome: 'Partido Democrático Trabalhista', ano_inicio: 1979, is_atual: true, is_active: true, is_deleted: false },
    ],
  },
  {
    id: 13,
    numero: 13,
    sigla: 'PT',
    nome: 'Partido dos Trabalhadores',
    is_active: true,
    is_deleted: false,
    historico: [
      { id: 1301, id_partido: 13, numero: 13, sigla: 'PT', nome: 'Partido dos Trabalhadores', ano_inicio: 1980, is_atual: true, is_active: true, is_deleted: false },
    ],
  },
  {
    id: 14,
    numero: 14,
    sigla: 'PTB',
    nome: 'Partido Trabalhista Brasileiro',
    is_active: true,
    is_deleted: false,
    historico: [
      { id: 1401, id_partido: 14, numero: 14, sigla: 'PTB', nome: 'Partido Trabalhista Brasileiro', ano_inicio: 1979, ano_fim: 2023, is_atual: true, is_active: true, is_deleted: false },
    ],
  },
  {
    id: 15,
    numero: 15,
    sigla: 'MDB',
    nome: 'Movimento Democrático Brasileiro',
    is_active: true,
    is_deleted: false,
    historico: [
      { id: 1501, id_partido: 15, numero: 15, sigla: 'PMDB', nome: 'Partido do Movimento Democrático Brasileiro', ano_inicio: 1980, ano_fim: 2017, is_atual: false, is_active: true, is_deleted: false },
      { id: 1502, id_partido: 15, numero: 15, sigla: 'MDB', nome: 'Movimento Democrático Brasileiro', ano_inicio: 2017, is_atual: true, is_active: true, is_deleted: false },
    ],
  },
  {
    id: 17,
    numero: 17,
    sigla: 'PSL',
    nome: 'Partido Social Liberal',
    is_active: true,
    is_deleted: false,
    historico: [
      { id: 1701, id_partido: 17, numero: 17, sigla: 'PSL', nome: 'Partido Social Liberal', ano_inicio: 1994, ano_fim: 2022, is_atual: false, is_active: true, is_deleted: false },
      { id: 1702, id_partido: 17, numero: 17, sigla: 'UNIÃO', nome: 'União Brasil (Fusão DEM/PSL)', ano_inicio: 2022, is_atual: true, is_active: true, is_deleted: false },
    ],
  },
  {
    id: 19,
    numero: 19,
    sigla: 'PODE',
    nome: 'Podemos',
    is_active: true,
    is_deleted: false,
    historico: [
      { id: 1901, id_partido: 19, numero: 19, sigla: 'PTN', nome: 'Partido Trabalhista Nacional', ano_inicio: 1995, ano_fim: 2016, is_atual: false, is_active: true, is_deleted: false },
      { id: 1902, id_partido: 19, numero: 19, sigla: 'PODE', nome: 'Podemos', ano_inicio: 2016, is_atual: true, is_active: true, is_deleted: false },
    ],
  },
  {
    id: 20,
    numero: 20,
    sigla: 'PSC',
    nome: 'Partido Social Cristão',
    is_active: true,
    is_deleted: false,
    historico: [
      { id: 2001, id_partido: 20, numero: 20, sigla: 'PSC', nome: 'Partido Social Cristão', ano_inicio: 1985, ano_fim: 2023, is_atual: true, is_active: true, is_deleted: false },
    ],
  },
  {
    id: 22,
    numero: 22,
    sigla: 'PL',
    nome: 'Partido Liberal',
    is_active: true,
    is_deleted: false,
    historico: [
      { id: 2201, id_partido: 22, numero: 22, sigla: 'PL', nome: 'Partido Liberal', ano_inicio: 1985, ano_fim: 2006, is_atual: false, is_active: true, is_deleted: false },
      { id: 2202, id_partido: 22, numero: 22, sigla: 'PR', nome: 'Partido da República', ano_inicio: 2006, ano_fim: 2019, is_atual: false, is_active: true, is_deleted: false },
      { id: 2203, id_partido: 22, numero: 22, sigla: 'PL', nome: 'Partido Liberal', ano_inicio: 2019, is_atual: true, is_active: true, is_deleted: false },
    ],
  },
  {
    id: 23,
    numero: 23,
    sigla: 'CIDADANIA',
    nome: 'Cidadania',
    is_active: true,
    is_deleted: false,
    historico: [
      { id: 2301, id_partido: 23, numero: 23, sigla: 'PPS', nome: 'Partido Popular Socialista', ano_inicio: 1992, ano_fim: 2019, is_atual: false, is_active: true, is_deleted: false },
      { id: 2302, id_partido: 23, numero: 23, sigla: 'CIDADANIA', nome: 'Cidadania', ano_inicio: 2019, is_atual: true, is_active: true, is_deleted: false },
    ],
  },
  {
    id: 25,
    numero: 25,
    sigla: 'DEM',
    nome: 'Democratas / União Brasil',
    is_active: true,
    is_deleted: false,
    historico: [
      { id: 2501, id_partido: 25, numero: 25, sigla: 'PFL', nome: 'Partido da Frente Liberal', ano_inicio: 1985, ano_fim: 2007, is_atual: false, is_active: true, is_deleted: false },
      { id: 2502, id_partido: 25, numero: 25, sigla: 'DEM', nome: 'Democratas', ano_inicio: 2007, ano_fim: 2022, is_atual: true, is_active: true, is_deleted: false },
    ],
  },
  {
    id: 27,
    numero: 27,
    sigla: 'DC',
    nome: 'Democracia Cristã',
    is_active: true,
    is_deleted: false,
    historico: [
      { id: 2701, id_partido: 27, numero: 27, sigla: 'PSDC', nome: 'Partido Social Democrata Cristão', ano_inicio: 1997, ano_fim: 2018, is_atual: false, is_active: true, is_deleted: false },
      { id: 2702, id_partido: 27, numero: 27, sigla: 'DC', nome: 'Democracia Cristã', ano_inicio: 2018, is_atual: true, is_active: true, is_deleted: false },
    ],
  },
  {
    id: 31,
    numero: 31,
    sigla: 'PHS',
    nome: 'Partido Humanista da Solidariedade',
    is_active: true,
    is_deleted: false,
    historico: [
      { id: 3101, id_partido: 31, numero: 31, sigla: 'PHS', nome: 'Partido Humanista da Solidariedade', ano_inicio: 1997, ano_fim: 2019, is_atual: false, is_active: true, is_deleted: false },
      { id: 3102, id_partido: 31, numero: 31, sigla: 'PODE', nome: 'Podemos (Incorporou PHS)', ano_inicio: 2019, is_atual: true, is_active: true, is_deleted: false },
    ],
  },
  {
    id: 36,
    numero: 36,
    sigla: 'AGIR',
    nome: 'Agir',
    is_active: true,
    is_deleted: false,
    historico: [
      { id: 3601, id_partido: 36, numero: 36, sigla: 'PRN', nome: 'Partido da Reconstrução Nacional', ano_inicio: 1989, ano_fim: 2000, is_atual: false, is_active: true, is_deleted: false },
      { id: 3602, id_partido: 36, numero: 36, sigla: 'PTC', nome: 'Partido Trabalhista Cristão', ano_inicio: 2000, ano_fim: 2022, is_atual: false, is_active: true, is_deleted: false },
      { id: 3603, id_partido: 36, numero: 36, sigla: 'AGIR', nome: 'Agir', ano_inicio: 2022, is_atual: true, is_active: true, is_deleted: false },
    ],
  },
  {
    id: 40,
    numero: 40,
    sigla: 'PSB',
    nome: 'Partido Socialista Brasileiro',
    is_active: true,
    is_deleted: false,
    historico: [
      { id: 4001, id_partido: 40, numero: 40, sigla: 'PSB', nome: 'Partido Socialista Brasileiro', ano_inicio: 1985, is_atual: true, is_active: true, is_deleted: false },
    ],
  },
  {
    id: 43,
    numero: 43,
    sigla: 'PV',
    nome: 'Partido Verde',
    is_active: true,
    is_deleted: false,
    historico: [
      { id: 4301, id_partido: 43, numero: 43, sigla: 'PV', nome: 'Partido Verde', ano_inicio: 1986, is_atual: true, is_active: true, is_deleted: false },
    ],
  },
  {
    id: 44,
    numero: 44,
    sigla: 'UNIÃO',
    nome: 'União Brasil',
    is_active: true,
    is_deleted: false,
    historico: [
      { id: 4401, id_partido: 44, numero: 44, sigla: 'DEM', nome: 'Democratas (Fusão em 2022)', ano_inicio: 2007, ano_fim: 2022, is_atual: false, is_active: true, is_deleted: false },
      { id: 4402, id_partido: 44, numero: 44, sigla: 'PSL', nome: 'Partido Social Liberal (Fusão em 2022)', ano_inicio: 1994, ano_fim: 2022, is_atual: false, is_active: true, is_deleted: false },
      { id: 4403, id_partido: 44, numero: 44, sigla: 'UNIÃO', nome: 'União Brasil', ano_inicio: 2022, is_atual: true, is_active: true, is_deleted: false },
    ],
  },
  {
    id: 45,
    numero: 45,
    sigla: 'PSDB',
    nome: 'Partido da Social Democracia Brasileira',
    is_active: true,
    is_deleted: false,
    historico: [
      { id: 4501, id_partido: 45, numero: 45, sigla: 'PSDB', nome: 'Partido da Social Democracia Brasileira', ano_inicio: 1988, is_atual: true, is_active: true, is_deleted: false },
    ],
  },
  {
    id: 55,
    numero: 55,
    sigla: 'PSD',
    nome: 'Partido Social Democrático',
    is_active: true,
    is_deleted: false,
    historico: [
      { id: 5501, id_partido: 55, numero: 55, sigla: 'PSD', nome: 'Partido Social Democrático', ano_inicio: 2011, is_atual: true, is_active: true, is_deleted: false },
    ],
  },
  {
    id: 65,
    numero: 65,
    sigla: 'PCdoB',
    nome: 'Partido Comunista do Brasil',
    is_active: true,
    is_deleted: false,
    historico: [
      { id: 6501, id_partido: 65, numero: 65, sigla: 'PCdoB', nome: 'Partido Comunista do Brasil', ano_inicio: 1962, is_atual: true, is_active: true, is_deleted: false },
    ],
  },
  {
    id: 70,
    numero: 70,
    sigla: 'AVANTE',
    nome: 'Avante',
    is_active: true,
    is_deleted: false,
    historico: [
      { id: 7001, id_partido: 70, numero: 70, sigla: 'PTdoB', nome: 'Partido Trabalhista do Brasil', ano_inicio: 1989, ano_fim: 2017, is_atual: false, is_active: true, is_deleted: false },
      { id: 7002, id_partido: 70, numero: 70, sigla: 'AVANTE', nome: 'Avante', ano_inicio: 2017, is_atual: true, is_active: true, is_deleted: false },
    ],
  },
  {
    id: 77,
    numero: 77,
    sigla: 'SOLIDARIEDADE',
    nome: 'Solidariedade',
    is_active: true,
    is_deleted: false,
    historico: [
      { id: 7701, id_partido: 77, numero: 77, sigla: 'SD', nome: 'Solidariedade', ano_inicio: 2013, ano_fim: 2023, is_atual: false, is_active: true, is_deleted: false },
      { id: 7702, id_partido: 77, numero: 77, sigla: 'SOLIDARIEDADE', nome: 'Solidariedade', ano_inicio: 2023, is_atual: true, is_active: true, is_deleted: false },
    ],
  },
  {
    id: 90,
    numero: 90,
    sigla: 'PROS',
    nome: 'Partido Republicano da Ordem Social',
    is_active: true,
    is_deleted: false,
    historico: [
      { id: 9001, id_partido: 90, numero: 90, sigla: 'PROS', nome: 'Partido Republicano da Ordem Social', ano_inicio: 2010, ano_fim: 2023, is_atual: false, is_active: true, is_deleted: false },
      { id: 9002, id_partido: 90, numero: 90, sigla: 'SOLIDARIEDADE', nome: 'Solidariedade (Incorporou PROS)', ano_inicio: 2023, is_atual: true, is_active: true, is_deleted: false },
    ],
  },
];

function loadDynamicCadastros(): DynamicCadastrosState {
  try {
    const raw = localStorage.getItem(CADASTRO_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    candidatosCustom: {},
    partidosCustom: [],
    eleicoesCustom: [],
  };
}

function saveDynamicCadastros(state: DynamicCadastrosState) {
  try {
    localStorage.setItem(CADASTRO_STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export async function getCandidatosCadastrados(params?: {
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ total: number; items: Array<{ titulo_eleitor: string; nome_completo: string; data_nascimento?: string | null; is_active: boolean; is_deleted: boolean }> }> {
  const dynamic = loadDynamicCadastros();
  const ds = await loadFallbackDataset();

  // Combine dataset base with dynamic custom candidates
  const mapAll = new Map<string, { titulo_eleitor: string; nome_completo: string; data_nascimento?: string | null; is_active: boolean; is_deleted: boolean }>();

  // Base dataset
  Object.values(ds.candidatos_base).forEach((c) => {
    mapAll.set(c.titulo_eleitor, {
      titulo_eleitor: c.titulo_eleitor,
      nome_completo: c.nome_completo,
      data_nascimento: c.data_nascimento || null,
      is_active: true,
      is_deleted: false,
    });
  });

  // Apply custom dynamic additions or soft deletes
  Object.values(dynamic.candidatosCustom).forEach((c) => {
    mapAll.set(c.titulo_eleitor, c);
  });

  let list = Array.from(mapAll.values()).filter((c) => !c.is_deleted);

  if (params?.search) {
    const s = params.search.toLowerCase().trim();
    list = list.filter(
      (c) =>
        c.nome_completo.toLowerCase().includes(s) ||
        c.titulo_eleitor.includes(s)
    );
  }

  // Sort alphabetically by name
  list.sort((a, b) => a.nome_completo.localeCompare(b.nome_completo));

  const total = list.length;
  const offset = params?.offset || 0;
  const limit = params?.limit || 50;
  const paginated = list.slice(offset, offset + limit);

  return { total, items: paginated };
}

export async function updateCandidato(
  titulo_eleitor: string,
  payload: { nome_completo?: string; data_nascimento?: string | null; is_active?: boolean }
): Promise<void> {
  try {
    await fetch(`/api/candidatos/${titulo_eleitor}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(3000),
    });
  } catch {}

  const dynamic = loadDynamicCadastros();
  const existing = dynamic.candidatosCustom[titulo_eleitor] || {
    titulo_eleitor,
    nome_completo: payload.nome_completo || '',
    data_nascimento: payload.data_nascimento || null,
    is_active: payload.is_active !== undefined ? payload.is_active : true,
    is_deleted: false,
  };

  if (payload.nome_completo !== undefined) existing.nome_completo = payload.nome_completo.toUpperCase();
  if (payload.data_nascimento !== undefined) existing.data_nascimento = payload.data_nascimento;
  if (payload.is_active !== undefined) existing.is_active = payload.is_active;

  dynamic.candidatosCustom[titulo_eleitor] = existing;
  saveDynamicCadastros(dynamic);
}

export async function deleteCandidato(titulo_eleitor: string): Promise<void> {
  try {
    await fetch(`/api/candidatos/${titulo_eleitor}`, {
      method: 'DELETE',
      signal: AbortSignal.timeout(3000),
    });
  } catch {}

  const dynamic = loadDynamicCadastros();
  const existing = dynamic.candidatosCustom[titulo_eleitor] || {
    titulo_eleitor,
    nome_completo: '',
    is_active: false,
    is_deleted: true,
  };
  existing.is_deleted = true;
  existing.is_active = false;
  dynamic.candidatosCustom[titulo_eleitor] = existing;
  saveDynamicCadastros(dynamic);
}

export async function getPartidosCadastrados(q?: string): Promise<PartidoCadastroDto[]> {
  // Try backend first
  try {
    const url = q ? `/api/partidos?q=${encodeURIComponent(q)}` : '/api/partidos';
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const backendPartidos: PartidoCadastroDto[] = await res.json();
      if (backendPartidos && backendPartidos.length > 0) {
        return backendPartidos.sort((a, b) => a.numero - b.numero);
      }
    }
  } catch {}

  const dynamic = loadDynamicCadastros();

  // Merge canonical TSE parties with local storage custom overrides
  const mapPartidos = new Map<number, PartidoCadastroDto>();

  // Base TSE
  PARTIDOS_BASE_TSE.forEach((p) => {
    mapPartidos.set(p.numero, {
      ...p,
      sigla_atual: p.sigla,
      nome_atual: p.nome,
      siglas_anteriores: (p.historico || [])
        .filter((h) => !h.is_atual && h.sigla.toUpperCase() !== p.sigla.toUpperCase())
        .map((h) => h.sigla),
      historico: [...(p.historico || [])],
    });
  });

  // Custom / overrides from localStorage
  dynamic.partidosCustom.forEach((p) => {
    mapPartidos.set(p.numero, p);
  });

  let list = Array.from(mapPartidos.values())
    .filter((p) => !p.is_deleted);

  if (q) {
    const qTrim = q.trim();
    const qClean = qTrim.toUpperCase().replace(/\s+/g, '');
    const qUpper = qTrim.toUpperCase();
    list = list.filter((p) => {
      // 1. Busca por número eleitoral
      if (String(p.numero) === qTrim || String(p.numero).startsWith(qTrim)) return true;
      // 2. Busca por sigla atual
      if (p.sigla.toUpperCase().replace(/\s+/g, '').includes(qClean)) return true;
      if (p.sigla_atual && p.sigla_atual.toUpperCase().replace(/\s+/g, '').includes(qClean)) return true;
      // 3. Busca por nome atual oficial
      if (p.nome && p.nome.toUpperCase().includes(qUpper)) return true;
      if (p.nome_atual && p.nome_atual.toUpperCase().includes(qUpper)) return true;
      // 4. Busca por siglas históricas anteriores
      if (p.siglas_anteriores?.some((s) => s.toUpperCase().replace(/\s+/g, '').includes(qClean))) return true;
      // 5. Busca por nomes antigos e siglas antigas no histórico
      if (p.historico?.some((h) =>
        h.sigla.toUpperCase().replace(/\s+/g, '').includes(qClean) ||
        (h.nome && h.nome.toUpperCase().includes(qUpper))
      )) return true;
      return false;
    });
  }

  return list.sort((a, b) => a.numero - b.numero);
}

export function getDenominacaoNoAno(
  partido: PartidoCadastroDto,
  ano: number
): { sigla: string; nome: string; isHistorico: boolean } {
  const nomePadrao = partido.nome_atual || partido.nome || partido.sigla;
  if (!partido.historico || partido.historico.length === 0) {
    return { sigla: partido.sigla, nome: nomePadrao, isHistorico: false };
  }
  const hist = partido.historico.find((h) => {
    const inicio = h.ano_inicio ?? 1900;
    const fim = h.ano_fim ?? 2100;
    return ano >= inicio && ano <= fim;
  });
  if (hist) {
    const histNome = hist.nome || nomePadrao;
    const isDiferente = hist.sigla.toUpperCase() !== partido.sigla.toUpperCase() ||
      histNome.toUpperCase() !== nomePadrao.toUpperCase();
    return { sigla: hist.sigla, nome: histNome, isHistorico: isDiferente };
  }
  return { sigla: partido.sigla, nome: nomePadrao, isHistorico: false };
}

export function resolvePartido(siglaOuNumero: string | number): PartidoCadastroDto | null {
  const dynamic = loadDynamicCadastros();
  const all: PartidoCadastroDto[] = [];
  const mapPartidos = new Map<number, PartidoCadastroDto>();

  PARTIDOS_BASE_TSE.forEach((p) => mapPartidos.set(p.numero, {
    ...p,
    sigla_atual: p.sigla,
    nome_atual: p.nome,
    siglas_anteriores: (p.historico || [])
      .filter((h) => !h.is_atual && h.sigla.toUpperCase() !== p.sigla.toUpperCase())
      .map((h) => h.sigla),
    historico: [...(p.historico || [])],
  }));
  dynamic.partidosCustom.forEach((p) => mapPartidos.set(p.numero, p));
  all.push(...mapPartidos.values());

  const num = typeof siglaOuNumero === 'number' ? siglaOuNumero : parseInt(String(siglaOuNumero), 10);
  if (!isNaN(num) && num > 0) {
    const byNum = all.find((p) => p.numero === num);
    if (byNum) return byNum;
  }

  const rawStr = String(siglaOuNumero).trim().toUpperCase();
  const sClean = rawStr.replace(/\s+/g, '');

  // 1. Direct match with current acronym
  const direct = all.find((p) => p.sigla.toUpperCase().replace(/\s+/g, '') === sClean);
  if (direct) return direct;

  // 2. Match with historical names/acronyms in the auxiliary table
  for (const p of all) {
    if (p.historico && p.historico.some((h) =>
      h.sigla.toUpperCase().replace(/\s+/g, '') === sClean ||
      (h.nome && h.nome.toUpperCase().includes(rawStr))
    )) {
      return p;
    }
  }

  // 3. Match with party name
  const byName = all.find((p) => (p.nome && p.nome.toUpperCase().includes(rawStr)) || (p.nome_atual && p.nome_atual.toUpperCase().includes(rawStr)));
  if (byName) return byName;

  return null;
}

export async function fetchPartidoTimeline(termo: string | number): Promise<any> {
  const termoStr = String(termo).trim();
  try {
    const res = await fetch(`/api/partidos/timeline/${encodeURIComponent(termoStr)}`, {
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {}

  // Fallback offline reconstruction
  const partido = resolvePartido(termo);
  if (!partido) return null;

  const dataset = await loadFallbackDataset();
  const eleicoesTimeline: any[] = [];
  let totalVotos = 0;
  let totalCandidatos = 0;
  let totalEleitos = 0;
  let eleitosPrefeito = 0;
  let eleitosVereador = 0;

  for (const [anoStr, el] of Object.entries(dataset.eleicoes)) {
    const ano = parseInt(anoStr, 10);
    const candsEleicao = el.resultados.filter((r) => {
      const numPrefix = parseInt(String(r.numero).slice(0, 2), 10);
      return numPrefix === partido.numero || r.partido.toUpperCase() === partido.sigla.toUpperCase();
    });

    const desemp = el.partidos_vereador.find((pv) => {
      const pResolve = resolvePartido(pv.partido);
      return pResolve?.numero === partido.numero;
    });

    if (candsEleicao.length === 0 && !desemp) continue;

    const candidatosFormatted = candsEleicao.map((c) => {
      totalCandidatos++;
      const isEleito = c.situacao.toUpperCase().includes('ELEITO');
      if (isEleito) {
        totalEleitos++;
        if (c.cargo.toUpperCase().includes('PREFEITO')) eleitosPrefeito++;
        else if (c.cargo.toUpperCase().includes('VEREADOR')) eleitosVereador++;
      }
      return {
        titulo_eleitor: c.titulo_eleitor,
        nome_completo: c.nome_urna,
        nome_urna: c.nome_urna,
        numero_urna: c.numero,
        cargo: c.cargo,
        votos: c.votos,
        situacao: c.situacao,
        posicao: c.posicao,
        sigla_epoca: c.partido,
      };
    });

    const votosNominais = desemp ? desemp.votos_nominais : candsEleicao.reduce((acc, c) => acc + c.votos, 0);
    const votosLegenda = desemp ? desemp.votos_legenda : 0;
    const totalV = desemp ? desemp.total_votos : (votosNominais + votosLegenda);
    totalVotos += totalV;

    const siglaVigente = candsEleicao.length > 0 ? candsEleicao[0].partido : partido.sigla;

    eleicoesTimeline.push({
      ano,
      id_eleicao: ano,
      sigla_vigente: siglaVigente,
      is_rebranded: siglaVigente.toUpperCase() !== partido.sigla.toUpperCase(),
      votos_nominais: votosNominais,
      votos_legenda: votosLegenda,
      total_votos: totalV,
      total_candidatos: candidatosFormatted.length,
      candidatos: candidatosFormatted,
    });
  }

  return {
    partido,
    numero: partido.numero,
    sigla_atual: partido.sigla_atual || partido.sigla,
    nome_atual: partido.nome_atual || partido.nome,
    siglas_anteriores: partido.siglas_anteriores || [],
    estatisticas_gerais: {
      total_votos_historico: totalVotos,
      total_eleicoes_disputadas: eleicoesTimeline.length,
      total_candidatos_historico: totalCandidatos,
      total_eleitos_historico: totalEleitos,
      eleitos_prefeito: eleitosPrefeito,
      eleitos_vereador: eleitosVereador,
    },
    eleicoes: eleicoesTimeline.sort((a, b) => a.ano - b.ano),
  };
}

export async function updatePartido(
  id: number,
  payload: UpdatePartidoPayload
): Promise<PartidoCadastroDto> {
  try {
    const res = await fetch(`/api/partidos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {}

  const dynamic = loadDynamicCadastros();
  const allPartidos = await getPartidosCadastrados();
  let match = dynamic.partidosCustom.find((p) => p.id === id);

  if (!match) {
    const baseMatch = allPartidos.find((p) => p.id === id);
    if (baseMatch) {
      match = { ...baseMatch, historico: [...(baseMatch.historico || [])] };
      dynamic.partidosCustom.push(match);
    }
  }

  if (!match) {
    throw new Error(`Partido de ID ${id} não encontrado.`);
  }

  if (payload.numero !== undefined) match.numero = payload.numero;
  if (payload.sigla !== undefined) match.sigla = payload.sigla.trim().toUpperCase();
  if (payload.nome !== undefined) match.nome = payload.nome.trim();
  if (payload.is_active !== undefined) match.is_active = payload.is_active;

  if (payload.historico) {
    match.historico = payload.historico.map((h, idx) => ({
      id: h.id || match!.numero * 100 + idx + 1,
      id_partido: match!.id,
      numero: match!.numero,
      sigla: h.sigla.trim().toUpperCase(),
      nome: h.nome?.trim(),
      ano_inicio: h.ano_inicio,
      ano_fim: h.ano_fim,
      is_atual: h.is_atual || false,
      is_active: true,
      is_deleted: false,
    }));
  }

  saveDynamicCadastros(dynamic);
  return match;
}

export async function deletePartido(id: number): Promise<void> {
  try {
    await fetch(`/api/partidos/${id}`, {
      method: 'DELETE',
      signal: AbortSignal.timeout(3000),
    });
  } catch {}

  const dynamic = loadDynamicCadastros();
  const allPartidos = await getPartidosCadastrados();
  let match = dynamic.partidosCustom.find((p) => p.id === id);

  if (!match) {
    const baseMatch = allPartidos.find((p) => p.id === id);
    if (baseMatch) {
      match = { ...baseMatch, is_deleted: true, is_active: false };
      dynamic.partidosCustom.push(match);
    }
  } else {
    match.is_deleted = true;
    match.is_active = false;
  }
  saveDynamicCadastros(dynamic);
}

export async function getEleicoesCadastradas(): Promise<Array<{ id: number; ano: number; is_active: boolean; is_deleted: boolean }>> {
  const dynamic = loadDynamicCadastros();
  const ds = await loadFallbackDataset();

  const mapEleicoes = new Map<number, { id: number; ano: number; is_active: boolean; is_deleted: boolean }>();
  let idCounter = 1;

  Object.keys(ds.eleicoes).map(Number).sort((a, b) => b - a).forEach((ano) => {
    mapEleicoes.set(ano, {
      id: idCounter++,
      ano,
      is_active: true,
      is_deleted: false,
    });
  });

  dynamic.eleicoesCustom.forEach((e) => {
    mapEleicoes.set(e.ano, e);
  });

  return Array.from(mapEleicoes.values())
    .filter((e) => !e.is_deleted)
    .sort((a, b) => b.ano - a.ano);
}

export async function createCandidato(payload: {
  titulo_eleitor: string;
  nome_completo: string;
  data_nascimento?: string | null;
}): Promise<{
  titulo_eleitor: string;
  nome_completo: string;
  data_nascimento?: string | null;
  is_active: boolean;
  is_deleted: boolean;
}> {
  // Attempt backend API if live
  try {
    const res = await fetch(`/api/candidatos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {}

  const dynamic = loadDynamicCadastros();
  const tituloTrimmed = payload.titulo_eleitor.trim();
  const nomeUpper = payload.nome_completo.trim().toUpperCase();

  // Check if exists in base dataset or dynamic
  const ds = await loadFallbackDataset();
  const baseCand = ds.candidatos_base[tituloTrimmed];
  const customCand = dynamic.candidatosCustom[tituloTrimmed];

  if (customCand && !customCand.is_deleted) {
    throw new Error(`O título de eleitor ${tituloTrimmed} já se encontra cadastrado para: ${customCand.nome_completo}`);
  }
  if (baseCand && (!customCand || !customCand.is_deleted)) {
    throw new Error(`O título de eleitor ${tituloTrimmed} já existe na base de dados oficial (${baseCand.nome_completo}).`);
  }

  const newItem = {
    titulo_eleitor: tituloTrimmed,
    nome_completo: nomeUpper,
    data_nascimento: payload.data_nascimento ? payload.data_nascimento.trim() : null,
    is_active: true,
    is_deleted: false,
  };
  dynamic.candidatosCustom[tituloTrimmed] = newItem;
  saveDynamicCadastros(dynamic);
  return newItem;
}

export async function createPartido(payload: CreatePartidoPayload): Promise<PartidoCadastroDto> {
  // Attempt backend API if live
  try {
    const res = await fetch(`/api/partidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {}

  const dynamic = loadDynamicCadastros();
  const allPartidos = await getPartidosCadastrados();
  const siglaUpper = payload.sigla.trim().toUpperCase();
  const nomeTrimmed = payload.nome ? payload.nome.trim() : siglaUpper;
  const numeroNum = Number(payload.numero);

  // Check if numero or sigla already exists
  const existingNum = allPartidos.find((p) => p.numero === numeroNum);
  if (existingNum) {
    throw new Error(`O número eleitoral '${numeroNum}' já está atribuído ao partido ${existingNum.sigla} (${existingNum.nome}).`);
  }

  const existingSigla = allPartidos.find((p) => p.sigla.toUpperCase() === siglaUpper);
  if (existingSigla) {
    throw new Error(`A agremiação com sigla '${siglaUpper}' já existe (Nº ${existingSigla.numero}).`);
  }

  const newId = 1000 + dynamic.partidosCustom.length + 1;
  const newItem: PartidoCadastroDto = {
    id: newId,
    numero: numeroNum,
    sigla: siglaUpper,
    nome: nomeTrimmed,
    is_active: true,
    is_deleted: false,
    historico: (payload.historico || []).map((h, idx) => ({
      id: newId * 100 + idx + 1,
      id_partido: newId,
      numero: numeroNum,
      sigla: h.sigla.trim().toUpperCase(),
      nome: h.nome?.trim(),
      ano_inicio: h.ano_inicio,
      ano_fim: h.ano_fim,
      is_atual: h.is_atual || false,
      is_active: true,
      is_deleted: false,
    })),
  };

  dynamic.partidosCustom.push(newItem);
  saveDynamicCadastros(dynamic);
  return newItem;
}

export async function createEleicao(payload: { ano: number }): Promise<{ id: number; ano: number; is_active: boolean; is_deleted: boolean }> {
  // Attempt backend API if live
  try {
    const res = await fetch(`/api/eleicoes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {}

  const dynamic = loadDynamicCadastros();
  const existing = dynamic.eleicoesCustom.find((e) => e.ano === payload.ano);
  if (existing) {
    if (existing.is_deleted) {
      existing.is_deleted = false;
      existing.is_active = true;
      saveDynamicCadastros(dynamic);
      return existing;
    }
    throw new Error(`O pleito municipal de ${payload.ano} já se encontra cadastrado.`);
  }

  const ds = await loadFallbackDataset();
  if (ds.eleicoes[String(payload.ano)]) {
    const wasDeleted = dynamic.eleicoesCustom.find((e) => e.id === payload.ano && e.is_deleted);
    if (wasDeleted) {
      wasDeleted.is_deleted = false;
      wasDeleted.is_active = true;
      saveDynamicCadastros(dynamic);
      return wasDeleted;
    }
    throw new Error(`O pleito de ${payload.ano} já existe na série histórica oficial.`);
  }

  const newId = 2000 + dynamic.eleicoesCustom.length + 1;
  const newItem = {
    id: newId,
    ano: payload.ano,
    is_active: true,
    is_deleted: false,
  };
  dynamic.eleicoesCustom.push(newItem);
  saveDynamicCadastros(dynamic);
  return newItem;
}

export async function deleteEleicao(id: number): Promise<void> {
  const dynamic = loadDynamicCadastros();
  const match = dynamic.eleicoesCustom.find((e) => e.id === id);
  if (match) {
    match.is_deleted = true;
    match.is_active = false;
  } else {
    dynamic.eleicoesCustom.push({ id, ano: 0, is_active: false, is_deleted: true });
  }
  saveDynamicCadastros(dynamic);
}

// ==========================================
// MÓDULO DE COLIGAÇÕES PARTIDÁRIAS
// ==========================================

const COLIGACOES_STORAGE_KEY = 'vigiminas_coligacoes_v1';

const DEFAULT_COLIGACOES: ColigacaoDto[] = [
  // 2024
  {
    id: 1,
    id_eleicao: 2024,
    ano_eleicao: 2024,
    cargo: 'Prefeito',
    numero_urna: 55,
    nome_coligacao: 'União por Braúnas',
    sigla_partido_titular: 'PSD',
    composicao_siglas: 'PSD / AVANTE / MDB',
    is_active: true,
    is_deleted: false,
    partidos: [
      { id: 101, id_partido: 55, sigla_partido: 'PSD', papel: 'Cabeça de Chapa', is_active: true, is_deleted: false },
      { id: 102, id_partido: 70, sigla_partido: 'AVANTE', papel: 'Vice-Prefeito', is_active: true, is_deleted: false },
      { id: 103, id_partido: 15, sigla_partido: 'MDB', papel: 'Partido Apoiador', is_active: true, is_deleted: false },
    ],
  },
  {
    id: 2,
    id_eleicao: 2024,
    ano_eleicao: 2024,
    cargo: 'Prefeito',
    numero_urna: 12,
    nome_coligacao: 'Renovação e Trabalho',
    sigla_partido_titular: 'PDT',
    composicao_siglas: 'PDT',
    is_active: true,
    is_deleted: false,
    partidos: [
      { id: 104, id_partido: 12, sigla_partido: 'PDT', papel: 'Cabeça de Chapa', is_active: true, is_deleted: false },
    ],
  },
  // 2020
  {
    id: 3,
    id_eleicao: 2020,
    ano_eleicao: 2020,
    cargo: 'Prefeito',
    numero_urna: 43,
    nome_coligacao: 'Juntos por uma Braúnas Melhor',
    sigla_partido_titular: 'PV',
    composicao_siglas: 'PV / PSDB / PP',
    is_active: true,
    is_deleted: false,
    partidos: [
      { id: 105, id_partido: 43, sigla_partido: 'PV', papel: 'Cabeça de Chapa', is_active: true, is_deleted: false },
      { id: 106, id_partido: 45, sigla_partido: 'PSDB', papel: 'Vice-Prefeito', is_active: true, is_deleted: false },
      { id: 107, id_partido: 11, sigla_partido: 'PP', papel: 'Partido Apoiador', is_active: true, is_deleted: false },
    ],
  },
  {
    id: 4,
    id_eleicao: 2020,
    ano_eleicao: 2020,
    cargo: 'Prefeito',
    numero_urna: 10,
    nome_coligacao: 'Braúnas no Rumo Certo',
    sigla_partido_titular: 'REPUBLICANOS',
    composicao_siglas: 'REPUBLICANOS / MDB',
    is_active: true,
    is_deleted: false,
    partidos: [
      { id: 108, id_partido: 10, sigla_partido: 'REPUBLICANOS', papel: 'Cabeça de Chapa', is_active: true, is_deleted: false },
      { id: 109, id_partido: 15, sigla_partido: 'MDB', papel: 'Vice-Prefeito', is_active: true, is_deleted: false },
    ],
  },
  // 2016
  {
    id: 5,
    id_eleicao: 2016,
    ano_eleicao: 2016,
    cargo: 'Prefeito',
    numero_urna: 45,
    nome_coligacao: 'Unidos pelo Progresso de Braúnas',
    sigla_partido_titular: 'PSDB',
    composicao_siglas: 'PSDB / PMDB / PP',
    is_active: true,
    is_deleted: false,
    partidos: [
      { id: 110, id_partido: 45, sigla_partido: 'PSDB', papel: 'Cabeça de Chapa', is_active: true, is_deleted: false },
      { id: 111, id_partido: 15, sigla_partido: 'PMDB', papel: 'Vice-Prefeito', is_active: true, is_deleted: false },
      { id: 112, id_partido: 11, sigla_partido: 'PP', papel: 'Partido Apoiador', is_active: true, is_deleted: false },
    ],
  },
  {
    id: 6,
    id_eleicao: 2016,
    ano_eleicao: 2016,
    cargo: 'Prefeito',
    numero_urna: 43,
    nome_coligacao: 'Por Amor a Braúnas',
    sigla_partido_titular: 'PV',
    composicao_siglas: 'PV / PT',
    is_active: true,
    is_deleted: false,
    partidos: [
      { id: 113, id_partido: 43, sigla_partido: 'PV', papel: 'Cabeça de Chapa', is_active: true, is_deleted: false },
      { id: 114, id_partido: 13, sigla_partido: 'PT', papel: 'Vice-Prefeito', is_active: true, is_deleted: false },
    ],
  },
  // 2012
  {
    id: 7,
    id_eleicao: 2012,
    ano_eleicao: 2012,
    cargo: 'Prefeito',
    numero_urna: 43,
    nome_coligacao: 'Trabalho, Respeito e Desenvolvimento',
    sigla_partido_titular: 'PV',
    composicao_siglas: 'PV / PT / PMDB',
    is_active: true,
    is_deleted: false,
    partidos: [
      { id: 115, id_partido: 43, sigla_partido: 'PV', papel: 'Cabeça de Chapa', is_active: true, is_deleted: false },
      { id: 116, id_partido: 13, sigla_partido: 'PT', papel: 'Vice-Prefeito', is_active: true, is_deleted: false },
      { id: 117, id_partido: 15, sigla_partido: 'PMDB', papel: 'Partido Apoiador', is_active: true, is_deleted: false },
    ],
  },
  {
    id: 8,
    id_eleicao: 2012,
    ano_eleicao: 2012,
    cargo: 'Prefeito',
    numero_urna: 45,
    nome_coligacao: 'O Povo no Coração',
    sigla_partido_titular: 'PSDB',
    composicao_siglas: 'PSDB / DEM',
    is_active: true,
    is_deleted: false,
    partidos: [
      { id: 118, id_partido: 45, sigla_partido: 'PSDB', papel: 'Cabeça de Chapa', is_active: true, is_deleted: false },
      { id: 119, id_partido: 25, sigla_partido: 'DEM', papel: 'Vice-Prefeito', is_active: true, is_deleted: false },
    ],
  },
  // 2008
  {
    id: 9,
    id_eleicao: 2008,
    ano_eleicao: 2008,
    cargo: 'Prefeito',
    numero_urna: 43,
    nome_coligacao: 'Unidos para Vencer',
    sigla_partido_titular: 'PV',
    composicao_siglas: 'PV / PSDB / PTB',
    is_active: true,
    is_deleted: false,
    partidos: [
      { id: 120, id_partido: 43, sigla_partido: 'PV', papel: 'Cabeça de Chapa', is_active: true, is_deleted: false },
      { id: 121, id_partido: 45, sigla_partido: 'PSDB', papel: 'Vice-Prefeito', is_active: true, is_deleted: false },
      { id: 122, id_partido: 14, sigla_partido: 'PTB', papel: 'Partido Apoiador', is_active: true, is_deleted: false },
    ],
  },
  {
    id: 10,
    id_eleicao: 2008,
    ano_eleicao: 2008,
    cargo: 'Prefeito',
    numero_urna: 25,
    nome_coligacao: 'Compromisso com Braúnas',
    sigla_partido_titular: 'DEM',
    composicao_siglas: 'DEM / PMDB',
    is_active: true,
    is_deleted: false,
    partidos: [
      { id: 123, id_partido: 25, sigla_partido: 'DEM', papel: 'Cabeça de Chapa', is_active: true, is_deleted: false },
      { id: 124, id_partido: 15, sigla_partido: 'PMDB', papel: 'Vice-Prefeito', is_active: true, is_deleted: false },
    ],
  },
  // 2004
  {
    id: 11,
    id_eleicao: 2004,
    ano_eleicao: 2004,
    cargo: 'Prefeito',
    numero_urna: 45,
    nome_coligacao: 'Aliança por Braúnas',
    sigla_partido_titular: 'PSDB',
    composicao_siglas: 'PSDB / PFL',
    is_active: true,
    is_deleted: false,
    partidos: [
      { id: 125, id_partido: 45, sigla_partido: 'PSDB', papel: 'Cabeça de Chapa', is_active: true, is_deleted: false },
      { id: 126, id_partido: 25, sigla_partido: 'PFL', papel: 'Vice-Prefeito', is_active: true, is_deleted: false },
    ],
  },
  {
    id: 12,
    id_eleicao: 2004,
    ano_eleicao: 2004,
    cargo: 'Prefeito',
    numero_urna: 13,
    nome_coligacao: 'Frente Popular de Braúnas',
    sigla_partido_titular: 'PT',
    composicao_siglas: 'PT / PL',
    is_active: true,
    is_deleted: false,
    partidos: [
      { id: 127, id_partido: 13, sigla_partido: 'PT', papel: 'Cabeça de Chapa', is_active: true, is_deleted: false },
      { id: 128, id_partido: 22, sigla_partido: 'PL', papel: 'Vice-Prefeito', is_active: true, is_deleted: false },
    ],
  },
  // 2000
  {
    id: 13,
    id_eleicao: 2000,
    ano_eleicao: 2000,
    cargo: 'Prefeito',
    numero_urna: 15,
    nome_coligacao: 'União e Vitória',
    sigla_partido_titular: 'PMDB',
    composicao_siglas: 'PMDB / PFL / PTB',
    is_active: true,
    is_deleted: false,
    partidos: [
      { id: 129, id_partido: 15, sigla_partido: 'PMDB', papel: 'Cabeça de Chapa', is_active: true, is_deleted: false },
      { id: 130, id_partido: 25, sigla_partido: 'PFL', papel: 'Vice-Prefeito', is_active: true, is_deleted: false },
      { id: 131, id_partido: 14, sigla_partido: 'PTB', papel: 'Partido Apoiador', is_active: true, is_deleted: false },
    ],
  },
  {
    id: 14,
    id_eleicao: 2000,
    ano_eleicao: 2000,
    cargo: 'Prefeito',
    numero_urna: 45,
    nome_coligacao: 'Braúnas para Todos',
    sigla_partido_titular: 'PSDB',
    composicao_siglas: 'PSDB / PPB',
    is_active: true,
    is_deleted: false,
    partidos: [
      { id: 132, id_partido: 45, sigla_partido: 'PSDB', papel: 'Cabeça de Chapa', is_active: true, is_deleted: false },
      { id: 133, id_partido: 11, sigla_partido: 'PPB', papel: 'Vice-Prefeito', is_active: true, is_deleted: false },
    ],
  },
];

function loadStoredColigacoes(): ColigacaoDto[] {
  try {
    const raw = localStorage.getItem(COLIGACOES_STORAGE_KEY);
    if (!raw) return DEFAULT_COLIGACOES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_COLIGACOES;
  } catch {
    return DEFAULT_COLIGACOES;
  }
}

function saveStoredColigacoes(list: ColigacaoDto[]): void {
  try {
    localStorage.setItem(COLIGACOES_STORAGE_KEY, JSON.stringify(list));
  } catch {}
}

export async function getColigacoes(ano?: number): Promise<ColigacaoDto[]> {
  let coligacoes: ColigacaoDto[] = [];

  // Try backend first
  try {
    const url = ano ? `/api/coligacoes?ano=${ano}` : '/api/coligacoes';
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      coligacoes = await res.json();
    }
  } catch {}

  // If backend returned nothing or failed, use local storage
  if (coligacoes.length === 0) {
    const all = loadStoredColigacoes();
    coligacoes = ano ? all.filter((c) => c.ano_eleicao === ano) : all;
  }

  // Filter out soft-deleted
  coligacoes = coligacoes.filter((c) => !c.is_deleted);

  // Enrich with candidate details and votes
  for (const c of coligacoes) {
    try {
      const resultados: ResultadoCandidatoDto[] = await getResultados(c.ano_eleicao, c.cargo || 'Prefeito');
      const match = resultados.find((r: ResultadoCandidatoDto) => r.numero_urna === c.numero_urna);
      if (match) {
        c.candidato_nome = match.nome_urna;
        c.vice_nome = match.vice?.nome_urna;
        c.situacao = match.situacao;
        c.votos = match.votos;
        c.percentual_validos = match.percentual_validos;
      }
    } catch {}
  }

  return coligacoes;
}

export async function createColigacao(payload: CreateColigacaoPayload): Promise<ColigacaoDto> {
  // Try backend first
  try {
    const res = await fetch('/api/coligacoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const created: ColigacaoDto = await res.json();
      const all = loadStoredColigacoes();
      all.push(created);
      saveStoredColigacoes(all);
      return created;
    }
  } catch {}

  // Fallback to local storage
  const all = loadStoredColigacoes();
  const maxId = all.reduce((max, c) => Math.max(max, c.id), 0);
  const newId = maxId + 1;

  const composicao = payload.composicao_siglas || (payload.partidos && payload.partidos.length > 0
    ? payload.partidos.map((p) => p.sigla_partido).join(' / ')
    : payload.sigla_partido_titular);

  const partidosMembros: ColigacaoMembroDto[] = (payload.partidos || []).map((p, idx) => ({
    id: newId * 100 + idx + 1,
    id_partido: p.id_partido || 0,
    sigla_partido: p.sigla_partido,
    papel: p.papel,
    is_active: true,
    is_deleted: false,
  }));

  // If no parties provided in payload, default to titular party
  if (partidosMembros.length === 0) {
    partidosMembros.push({
      id: newId * 100 + 1,
      id_partido: payload.numero_urna,
      sigla_partido: payload.sigla_partido_titular,
      papel: 'Cabeça de Chapa',
      is_active: true,
      is_deleted: false,
    });
  }

  const newColigacao: ColigacaoDto = {
    id: newId,
    id_eleicao: payload.ano_eleicao,
    ano_eleicao: payload.ano_eleicao,
    cargo: payload.cargo || 'Prefeito',
    numero_urna: payload.numero_urna,
    nome_coligacao: payload.nome_coligacao,
    sigla_partido_titular: payload.sigla_partido_titular,
    composicao_siglas: composicao,
    is_active: true,
    is_deleted: false,
    partidos: partidosMembros,
  };

  all.push(newColigacao);
  saveStoredColigacoes(all);
  return newColigacao;
}

export async function updateColigacao(id: number, payload: UpdateColigacaoPayload): Promise<ColigacaoDto> {
  // Try backend first
  try {
    const res = await fetch(`/api/coligacoes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const updated: ColigacaoDto = await res.json();
      const all = loadStoredColigacoes();
      const idx = all.findIndex((c) => c.id === id);
      if (idx >= 0) {
        all[idx] = updated;
        saveStoredColigacoes(all);
      }
      return updated;
    }
  } catch {}

  // Fallback to local storage
  const all = loadStoredColigacoes();
  const idx = all.findIndex((c) => c.id === id);
  if (idx < 0) {
    throw new Error(`Coligação com ID ${id} não encontrada.`);
  }

  const existing = all[idx];
  if (payload.cargo !== undefined) existing.cargo = payload.cargo;
  if (payload.numero_urna !== undefined) existing.numero_urna = payload.numero_urna;
  if (payload.nome_coligacao !== undefined) existing.nome_coligacao = payload.nome_coligacao;
  if (payload.sigla_partido_titular !== undefined) existing.sigla_partido_titular = payload.sigla_partido_titular;
  if (payload.composicao_siglas !== undefined) existing.composicao_siglas = payload.composicao_siglas;
  if (payload.is_active !== undefined) existing.is_active = payload.is_active;

  if (payload.partidos) {
    existing.partidos = payload.partidos.map((p, pIdx) => ({
      id: existing.id * 100 + pIdx + 1,
      id_partido: p.id_partido,
      sigla_partido: p.sigla_partido,
      papel: p.papel,
      is_active: true,
      is_deleted: false,
    }));
    existing.composicao_siglas = payload.composicao_siglas || existing.partidos.map((p) => p.sigla_partido).join(' / ');
  }

  all[idx] = existing;
  saveStoredColigacoes(all);
  return existing;
}

export async function deleteColigacao(id: number): Promise<void> {
  // Try backend first
  try {
    await fetch(`/api/coligacoes/${id}`, {
      method: 'DELETE',
      signal: AbortSignal.timeout(3000),
    });
  } catch {}

  const all = loadStoredColigacoes();
  const match = all.find((c) => c.id === id);
  if (match) {
    match.is_deleted = true;
    match.is_active = false;
    saveStoredColigacoes(all);
  }
}

// =======================================================================
// MÓDULO DE QUOCIENTE ELEITORAL (VEREADOR) & CHAPAS PROPORCIONAIS
// =======================================================================

export async function getParametrosQe(eleicaoId: number): Promise<ParametrosQeDto> {
  const res = await fetch(`/api/eleicoes/${eleicaoId}/parametros-qe`, {
    signal: AbortSignal.timeout(3000),
  });
  if (!res.ok) {
    throw new Error(`Falha ao obter parâmetros do QE da eleição ${eleicaoId}`);
  }
  return res.json();
}

export async function updateParametrosQe(
  eleicaoId: number,
  payload: UpdateParametrosQePayload
): Promise<ParametrosQeDto> {
  const res = await fetch(`/api/eleicoes/${eleicaoId}/parametros-qe`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(3000),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Falha ao atualizar parâmetros do QE.');
  }
  return res.json();
}

export async function getChapasProporcionais(eleicaoId: number): Promise<ChapaProporcionalDto[]> {
  const res = await fetch(`/api/eleicoes/${eleicaoId}/chapas-proporcionais`, {
    signal: AbortSignal.timeout(3000),
  });
  if (!res.ok) {
    throw new Error(`Falha ao carregar chapas proporcionais da eleição ${eleicaoId}`);
  }
  return res.json();
}

export async function createChapaProporcional(
  eleicaoId: number,
  payload: CreateChapaProporcionalPayload
): Promise<ChapaProporcionalDto> {
  const res = await fetch(`/api/eleicoes/${eleicaoId}/chapas-proporcionais`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(3000),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Falha ao criar chapa proporcional.');
  }
  return res.json();
}

export async function updateChapaProporcional(
  chapaId: number,
  payload: UpdateChapaProporcionalPayload
): Promise<ChapaProporcionalDto> {
  const res = await fetch(`/api/chapas-proporcionais/${chapaId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(3000),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Falha ao atualizar chapa proporcional.');
  }
  return res.json();
}

export async function deleteChapaProporcional(chapaId: number): Promise<void> {
  const res = await fetch(`/api/chapas-proporcionais/${chapaId}`, {
    method: 'DELETE',
    signal: AbortSignal.timeout(3000),
  });
  if (!res.ok) {
    throw new Error(`Falha ao excluir chapa proporcional ${chapaId}`);
  }
}

export async function gerarChapasIsoladas(eleicaoId: number): Promise<ChapaProporcionalDto[]> {
  const res = await fetch(`/api/eleicoes/${eleicaoId}/chapas-proporcionais/gerar-isoladas`, {
    method: 'POST',
    signal: AbortSignal.timeout(3000),
  });
  if (!res.ok) {
    throw new Error('Falha ao gerar chapas isoladas automaticamente.');
  }
  return res.json();
}

export async function getCalculoQe(eleicaoId: number): Promise<CalculoQeResponseDto> {
  const res = await fetch(`/api/eleicoes/${eleicaoId}/calculo-qe`, {
    signal: AbortSignal.timeout(4000),
  });
  if (!res.ok) {
    throw new Error(`Falha ao calcular Quociente Eleitoral da eleição ${eleicaoId}`);
  }
  return res.json();
}


