export interface RawMunicipio {
  nome: string;
  uf: string;
  codigo_tse: number;
}

export interface RawDetalhesCargo {
  aptos: number;
  comparecimento: number;
  abstencoes: number;
  validos: number;
  brancos: number;
  nulos: number;
}

export interface RawPartidoVereador {
  partido: string;
  votos_nominais: number;
  votos_legenda: number;
  total_votos: number;
}

export interface RawResultado {
  cargo: string;
  posicao: number;
  nome_urna: string;
  numero: number;
  partido: string;
  votos: number;
  situacao: string;
  titulo_eleitor: string;
}

export interface RawEleicaoAno {
  ano: number;
  detalhes: {
    prefeito: RawDetalhesCargo;
    vereador: RawDetalhesCargo;
  };
  partidos_vereador: RawPartidoVereador[];
  resultados: RawResultado[];
}

export interface RawCandidatoBase {
  titulo_eleitor: string;
  nome_completo: string;
  data_nascimento: string;
}

export interface RawElectionDataset {
  municipio: RawMunicipio;
  eleicoes: Record<string, RawEleicaoAno>;
  candidatos_base: Record<string, RawCandidatoBase>;
}

export interface TableColumn {
  name: string;
  type: string;
  isPk?: boolean;
  isFk?: boolean;
  fkTarget?: string;
  nullable: boolean;
  constraint?: string;
  description: string;
}

export interface TableSchema {
  id: string;
  name: string;
  category: 'dimensao' | 'fato' | 'estatistica';
  description: string;
  columns: TableColumn[];
  indexes: string[];
  constraints: string[];
}
