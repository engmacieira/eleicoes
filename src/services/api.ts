import {
  EleicaoResumoDto,
  ResultadoCandidatoDto,
  CandidatoHistoricoDto,
  PartidosAnoDto,
  CloudSqlHealthDto,
  RawElectionDataset,
} from '../types/election';

let cachedDataset: RawElectionDataset | null = null;
let isBackendLive: boolean | null = null;

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
  try {
    const res = await fetch(`/api/resultados?ano=${ano}&cargo=${encodeURIComponent(cargo)}`, {
      signal: AbortSignal.timeout(2500),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // fallback
  }

  // Fallback computation
  const ds = await loadFallbackDataset();
  const el = ds.eleicoes[String(ano)];
  if (!el) return [];

  const normCargo = cargo.toLowerCase();
  const filtered = el.resultados.filter((r) => r.cargo.toLowerCase() === normCargo);

  const totalVotos = filtered.reduce((acc, curr) => acc + curr.votos, 0) || 1;

  return filtered.map((r) => {
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
  const base = ds.candidatos_base[tituloEleitor];
  if (!base) {
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
    const disputa = el.resultados.find((r) => r.titulo_eleitor === tituloEleitor);
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
      });
    }
  }

  return {
    titulo_eleitor: base.titulo_eleitor,
    nome_completo: base.nome_completo,
    data_nascimento: base.data_nascimento,
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

  const totalGeral = el.partidos_vereador.reduce((acc, p) => acc + p.total_votos, 0) || 1;

  const partidos = el.partidos_vereador.map((p) => ({
    sigla: p.partido,
    votos_nominais: p.votos_nominais,
    votos_legenda: p.votos_legenda,
    total_votos: p.total_votos,
    percentual_total: Number(((p.total_votos / totalGeral) * 100).toFixed(2)),
  })).sort((a, b) => b.total_votos - a.total_votos);

  return {
    ano,
    partidos,
    total_geral_votos: totalGeral,
  };
}
