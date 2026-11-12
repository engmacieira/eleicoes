import { RawElectionDataset, TableSchema } from '../types/election';

export const SCHEMA_TABLES: TableSchema[] = [
  {
    id: 'dados_candidato',
    name: 'dados_candidato',
    category: 'dimensao',
    description: 'Representa a pessoa física de forma única e perene, independente de pleitos ou trocas de partido.',
    columns: [
      {
        name: 'titulo_eleitor',
        type: 'VARCHAR(12)',
        isPk: true,
        nullable: false,
        constraint: 'CHECK (titulo_eleitor ~ \'^[0-9]{10,12}$\')',
        description: 'Chave Primária. Título de eleitor do TSE com preenchimento de zeros à esquerda.',
      },
      {
        name: 'nome_completo',
        type: 'VARCHAR(150)',
        nullable: false,
        description: 'Nome civil registrado na Justiça Eleitoral.',
      },
      {
        name: 'data_nascimento',
        type: 'DATE',
        nullable: true,
        description: 'Data de nascimento do indivíduo (padrão ISO YYYY-MM-DD).',
      },
      {
        name: 'criado_em',
        type: 'TIMESTAMPTZ',
        nullable: false,
        constraint: 'DEFAULT CURRENT_TIMESTAMP',
        description: 'Auditoria de inserção no banco.',
      },
    ],
    indexes: [
      'CREATE INDEX idx_dados_candidato_nome ON dados_candidato(nome_completo);',
    ],
    constraints: [
      'PRIMARY KEY (titulo_eleitor)',
      'CONSTRAINT chk_titulo_numerico CHECK (titulo_eleitor ~ \'^[0-9]{10,12}$\')',
    ],
  },
  {
    id: 'eleicao',
    name: 'eleicao',
    category: 'dimensao',
    description: 'Representa o evento eleitoral municipal periódico (pleito).',
    columns: [
      {
        name: 'id',
        type: 'INTEGER GENERATED ALWAYS AS IDENTITY',
        isPk: true,
        nullable: false,
        description: 'Identificador sequencial único do pleito.',
      },
      {
        name: 'ano',
        type: 'SMALLINT',
        nullable: false,
        constraint: 'UNIQUE, CHECK (ano >= 1980 AND ano <= 2100)',
        description: 'Ano de realização das eleições municipais (ex: 2000, 2004, 2008, 2012, 2016, 2020, 2024).',
      },
      {
        name: 'municipio_nome',
        type: 'VARCHAR(100)',
        nullable: false,
        constraint: "DEFAULT 'Braúnas'",
        description: 'Nome do município da circunscrição.',
      },
      {
        name: 'municipio_uf',
        type: 'CHAR(2)',
        nullable: false,
        constraint: "DEFAULT 'MG'",
        description: 'Unidade Federativa.',
      },
      {
        name: 'codigo_tse',
        type: 'INTEGER',
        nullable: false,
        constraint: 'DEFAULT 41750',
        description: 'Código do município segundo a tabela de municípios do TSE.',
      },
      {
        name: 'criado_em',
        type: 'TIMESTAMPTZ',
        nullable: false,
        constraint: 'DEFAULT CURRENT_TIMESTAMP',
        description: 'Timestamp de cadastro.',
      },
    ],
    indexes: [
      'CREATE UNIQUE INDEX uq_eleicao_ano ON eleicao(ano);',
    ],
    constraints: [
      'PRIMARY KEY (id)',
      'CONSTRAINT uq_eleicao_ano UNIQUE (ano)',
      'CONSTRAINT chk_ano_valido CHECK (ano >= 1980 AND ano <= 2100)',
    ],
  },
  {
    id: 'partidos',
    name: 'partidos',
    category: 'dimensao',
    description: 'Catálogo mestre dos partidos políticos indexado pelo número eleitoral perene do TSE.',
    columns: [
      {
        name: 'id',
        type: 'INTEGER GENERATED ALWAYS AS IDENTITY',
        isPk: true,
        nullable: false,
        description: 'Identificador único do partido.',
      },
      {
        name: 'numero',
        type: 'INTEGER',
        nullable: false,
        constraint: 'UNIQUE, CHECK (numero >= 10 AND numero <= 99)',
        description: 'Número eleitoral oficial atribuído pelo TSE (identificador perene da agremiação, ex: 70, 15, 45, 13, 22).',
      },
      {
        name: 'sigla',
        type: 'VARCHAR(20)',
        nullable: false,
        description: 'Sigla oficial atual registrada no TSE (ex: AVANTE, MDB, PT, PSDB, PL).',
      },
      {
        name: 'nome_completo',
        type: 'VARCHAR(150)',
        nullable: true,
        description: 'Nome por extenso atual da agremiação partidária (ex: Avante, Movimento Democrático Brasileiro).',
      },
      {
        name: 'is_active',
        type: 'BOOLEAN',
        nullable: false,
        constraint: 'DEFAULT TRUE',
        description: 'Universal Soft Delete.',
      },
      {
        name: 'is_deleted',
        type: 'BOOLEAN',
        nullable: false,
        constraint: 'DEFAULT FALSE',
        description: 'Universal Soft Delete.',
      },
      {
        name: 'criado_em',
        type: 'TIMESTAMPTZ',
        nullable: false,
        constraint: 'DEFAULT CURRENT_TIMESTAMP',
        description: 'Timestamp de cadastro.',
      },
    ],
    indexes: [
      'CREATE UNIQUE INDEX idx_partidos_numero ON partidos(numero);',
      'CREATE INDEX idx_partidos_sigla ON partidos(sigla);',
    ],
    constraints: [
      'PRIMARY KEY (id)',
      'CONSTRAINT uq_partidos_numero UNIQUE (numero)',
    ],
  },
  {
    id: 'partido_historico',
    name: 'partido_historico',
    category: 'dimensao',
    description: 'Tabela auxiliar de histórico de denominações, siglas antigas e rebrandings partidários ao longo do tempo (ex: 70 era PTdoB e virou AVANTE).',
    columns: [
      {
        name: 'id',
        type: 'BIGINT GENERATED ALWAYS AS IDENTITY',
        isPk: true,
        nullable: false,
        description: 'Identificador único da denominação histórica.',
      },
      {
        name: 'id_partido',
        type: 'INTEGER',
        isFk: true,
        fkTarget: 'partidos(id)',
        nullable: false,
        description: 'Chave estrangeira do partido perene.',
      },
      {
        name: 'numero',
        type: 'INTEGER',
        nullable: false,
        description: 'Número oficial do partido no TSE.',
      },
      {
        name: 'sigla',
        type: 'VARCHAR(20)',
        nullable: false,
        description: 'Sigla utilizada no período (ex: PTdoB, PMDB, PFL, PRB, PPB, PTN).',
      },
      {
        name: 'nome_completo',
        type: 'VARCHAR(150)',
        nullable: true,
        description: 'Nome por extenso da legenda na época (ex: Partido Trabalhista do Brasil).',
      },
      {
        name: 'ano_inicio',
        type: 'SMALLINT',
        nullable: true,
        description: 'Ano de início da denominação.',
      },
      {
        name: 'ano_fim',
        type: 'SMALLINT',
        nullable: true,
        description: 'Ano final da denominação (NULL se for a denominação vigente).',
      },
      {
        name: 'is_atual',
        type: 'BOOLEAN',
        nullable: false,
        constraint: 'DEFAULT FALSE',
        description: 'Indica se esta é a denominação oficial corrente.',
      },
      {
        name: 'is_active',
        type: 'BOOLEAN',
        nullable: false,
        constraint: 'DEFAULT TRUE',
        description: 'Universal Soft Delete.',
      },
      {
        name: 'is_deleted',
        type: 'BOOLEAN',
        nullable: false,
        constraint: 'DEFAULT FALSE',
        description: 'Universal Soft Delete.',
      },
      {
        name: 'criado_em',
        type: 'TIMESTAMPTZ',
        nullable: false,
        constraint: 'DEFAULT CURRENT_TIMESTAMP',
        description: 'Timestamp de inserção.',
      },
    ],
    indexes: [
      'CREATE INDEX idx_partido_hist_partido ON partido_historico(id_partido);',
      'CREATE INDEX idx_partido_hist_numero ON partido_historico(numero);',
      'CREATE INDEX idx_partido_hist_sigla ON partido_historico(sigla);',
    ],
    constraints: [
      'PRIMARY KEY (id)',
      'CONSTRAINT fk_partido_hist_partido FOREIGN KEY (id_partido) REFERENCES partidos(id) ON DELETE CASCADE',
    ],
  },
  {
    id: 'detalhes_votacao',
    name: 'detalhes_votacao',
    category: 'estatistica',
    description: 'Estatísticas consolidadas da urna por pleito e por cargo (abstenção, comparecimento, brancos, nulos).',
    columns: [
      {
        name: 'id',
        type: 'BIGINT GENERATED ALWAYS AS IDENTITY',
        isPk: true,
        nullable: false,
        description: 'Identificador sequencial único do registro estatístico.',
      },
      {
        name: 'id_eleicao',
        type: 'INTEGER',
        isFk: true,
        fkTarget: 'eleicao(id)',
        nullable: false,
        description: 'Chave estrangeira referenciando o pleito.',
      },
      {
        name: 'cargo',
        type: 'VARCHAR(20)',
        nullable: false,
        constraint: "CHECK (cargo IN ('Prefeito', 'Vereador'))",
        description: 'Cargo eleitoral apurado.',
      },
      {
        name: 'aptos',
        type: 'INTEGER',
        nullable: false,
        constraint: 'CHECK (aptos >= 0)',
        description: 'Total de eleitores aptos a votar no município.',
      },
      {
        name: 'comparecimento',
        type: 'INTEGER',
        nullable: false,
        constraint: 'CHECK (comparecimento >= 0)',
        description: 'Total de eleitores que compareceram à votação.',
      },
      {
        name: 'abstencoes',
        type: 'INTEGER',
        nullable: false,
        constraint: 'CHECK (abstencoes >= 0)',
        description: 'Total de eleitores que se abstiveram.',
      },
      {
        name: 'validos',
        type: 'INTEGER',
        nullable: false,
        constraint: 'CHECK (validos >= 0)',
        description: 'Total de votos válidos (nominais + legenda).',
      },
      {
        name: 'brancos',
        type: 'INTEGER',
        nullable: false,
        constraint: 'CHECK (brancos >= 0)',
        description: 'Total de votos em branco apurados.',
      },
      {
        name: 'nulos',
        type: 'INTEGER',
        nullable: false,
        constraint: 'CHECK (nulos >= 0)',
        description: 'Total de votos nulos apurados.',
      },
      {
        name: 'criado_em',
        type: 'TIMESTAMPTZ',
        nullable: false,
        constraint: 'DEFAULT CURRENT_TIMESTAMP',
        description: 'Auditoria de inserção.',
      },
    ],
    indexes: [
      'CREATE UNIQUE INDEX uq_detalhes_eleicao_cargo ON detalhes_votacao(id_eleicao, cargo);',
      'CREATE INDEX idx_detalhes_votacao_eleicao ON detalhes_votacao(id_eleicao);',
    ],
    constraints: [
      'PRIMARY KEY (id)',
      'CONSTRAINT fk_detalhes_votacao_eleicao FOREIGN KEY (id_eleicao) REFERENCES eleicao(id) ON DELETE CASCADE',
      'CONSTRAINT uq_detalhes_eleicao_cargo UNIQUE (id_eleicao, cargo)',
      'CONSTRAINT chk_cargo_detalhes CHECK (cargo IN (\'Prefeito\', \'Vereador\'))',
      'CONSTRAINT chk_detalhes_positivos CHECK (aptos >= 0 AND comparecimento >= 0 AND abstencoes >= 0 AND validos >= 0 AND brancos >= 0 AND nulos >= 0)',
    ],
  },
  {
    id: 'partidos_eleicao',
    name: 'partidos_eleicao',
    category: 'estatistica',
    description: 'Desempenho eleitoral consolidado do partido em determinado pleito para a câmara de vereadores.',
    columns: [
      {
        name: 'id',
        type: 'BIGINT GENERATED ALWAYS AS IDENTITY',
        isPk: true,
        nullable: false,
        description: 'Identificador sequencial único do desempenho partidário.',
      },
      {
        name: 'id_eleicao',
        type: 'INTEGER',
        isFk: true,
        fkTarget: 'eleicao(id)',
        nullable: false,
        description: 'Chave estrangeira do pleito.',
      },
      {
        name: 'partido_numero',
        type: 'INTEGER',
        isFk: true,
        fkTarget: 'partidos(numero)',
        nullable: false,
        description: 'Chave estrangeira apontando para o número oficial canônico do partido no TSE.',
      },
      {
        name: 'votos_nominais',
        type: 'INTEGER',
        nullable: false,
        constraint: 'DEFAULT 0, CHECK (votos_nominais >= 0)',
        description: 'Votos atribuídos diretamente aos candidatos do partido.',
      },
      {
        name: 'votos_legenda',
        type: 'INTEGER',
        nullable: false,
        constraint: 'DEFAULT 0, CHECK (votos_legenda >= 0)',
        description: 'Votos dados apenas à legenda partidária.',
      },
      {
        name: 'total_votos',
        type: 'INTEGER',
        nullable: false,
        constraint: 'DEFAULT 0, CHECK (total_votos >= 0)',
        description: 'Soma dos votos nominais e votos de legenda.',
      },
      {
        name: 'criado_em',
        type: 'TIMESTAMPTZ',
        nullable: false,
        constraint: 'DEFAULT CURRENT_TIMESTAMP',
        description: 'Auditoria de inserção.',
      },
    ],
    indexes: [
      'CREATE UNIQUE INDEX uq_partidos_eleicao_legenda ON partidos_eleicao(id_eleicao, partido_numero);',
      'CREATE INDEX idx_partidos_eleicao_busca ON partidos_eleicao(id_eleicao, total_votos DESC);',
    ],
    constraints: [
      'PRIMARY KEY (id)',
      'CONSTRAINT fk_partidos_eleicao_eleicao FOREIGN KEY (id_eleicao) REFERENCES eleicao(id) ON DELETE CASCADE',
      'CONSTRAINT fk_partidos_eleicao_partido FOREIGN KEY (partido_numero) REFERENCES partidos(numero) ON DELETE RESTRICT',
      'CONSTRAINT uq_partidos_eleicao_legenda UNIQUE (id_eleicao, partido_numero)',
      'CONSTRAINT chk_partidos_eleicao_votos CHECK (votos_nominais >= 0 AND votos_legenda >= 0 AND total_votos >= 0)',
    ],
  },
  {
    id: 'candidatos_eleicao',
    name: 'candidatos_eleicao',
    category: 'fato',
    description: 'Tabela fato central: histórico de participação e resultado de cada candidatura em cada pleito.',
    columns: [
      {
        name: 'id',
        type: 'BIGINT GENERATED ALWAYS AS IDENTITY',
        isPk: true,
        nullable: false,
        description: 'Identificador sequencial único da candidatura.',
      },
      {
        name: 'titulo_eleitor',
        type: 'VARCHAR(12)',
        isFk: true,
        fkTarget: 'dados_candidato(titulo_eleitor)',
        nullable: false,
        description: 'Chave estrangeira referenciando a pessoa física.',
      },
      {
        name: 'id_eleicao',
        type: 'INTEGER',
        isFk: true,
        fkTarget: 'eleicao(id)',
        nullable: false,
        description: 'Chave estrangeira do pleito.',
      },
      {
        name: 'partido_numero',
        type: 'INTEGER',
        isFk: true,
        fkTarget: 'partidos(numero)',
        nullable: false,
        description: 'Chave estrangeira canônica para o número oficial do partido no TSE.',
      },
      {
        name: 'sigla_epoca',
        type: 'VARCHAR(20)',
        nullable: true,
        description: 'Sigla descritiva vigente utilizada pelo candidato naquele pleito específico (ex: PT do B, PFL).',
      },
      {
        name: 'cargo',
        type: 'VARCHAR(20)',
        nullable: false,
        constraint: "CHECK (cargo IN ('Prefeito', 'Vereador', 'Vice-Prefeito'))",
        description: 'Cargo concorrido (Prefeito, Vereador).',
      },
      {
        name: 'numero_urna',
        type: 'INTEGER',
        nullable: false,
        constraint: 'CHECK (numero_urna > 0)',
        description: 'Número oficial na urna eletrônica (ex: 70123, 15).',
      },
      {
        name: 'nome_urna',
        type: 'VARCHAR(100)',
        nullable: false,
        description: 'Nome registrado para exibição na tela da urna eletrônica.',
      },
      {
        name: 'votos',
        type: 'INTEGER',
        nullable: false,
        constraint: 'DEFAULT 0, CHECK (votos >= 0)',
        description: 'Quantidade de votos nominais recebidos.',
      },
      {
        name: 'situacao',
        type: 'VARCHAR(50)',
        nullable: false,
        description: 'Desfecho da candidatura (Eleito, Suplente, Não eleito).',
      },
      {
        name: 'posicao',
        type: 'SMALLINT',
        nullable: true,
        constraint: 'CHECK (posicao > 0)',
        description: 'Colocação final na apuração do cargo.',
      },
      {
        name: 'criado_em',
        type: 'TIMESTAMPTZ',
        nullable: false,
        constraint: 'DEFAULT CURRENT_TIMESTAMP',
        description: 'Timestamp de auditoria.',
      },
    ],
    indexes: [
      'CREATE INDEX idx_candidatos_eleicao_titulo ON candidatos_eleicao(titulo_eleitor);',
      'CREATE INDEX idx_candidatos_eleicao_pleito_cargo ON candidatos_eleicao(id_eleicao, cargo);',
      'CREATE INDEX idx_candidatos_eleicao_ranking ON candidatos_eleicao(id_eleicao, cargo, votos DESC);',
      'CREATE INDEX idx_candidatos_eleicao_partido ON candidatos_eleicao(partido_numero);',
      'CREATE UNIQUE INDEX uq_candidato_eleicao_cargo ON candidatos_eleicao(id_eleicao, cargo, titulo_eleitor);',
    ],
    constraints: [
      'PRIMARY KEY (id)',
      'CONSTRAINT fk_cand_eleicao_candidato FOREIGN KEY (titulo_eleitor) REFERENCES dados_candidato(titulo_eleitor) ON UPDATE CASCADE ON DELETE RESTRICT',
      'CONSTRAINT fk_cand_eleicao_eleicao FOREIGN KEY (id_eleicao) REFERENCES eleicao(id) ON DELETE CASCADE',
      'CONSTRAINT fk_cand_eleicao_partido FOREIGN KEY (partido_numero) REFERENCES partidos(numero) ON DELETE RESTRICT',
      'CONSTRAINT uq_candidato_eleicao_cargo UNIQUE (id_eleicao, cargo, titulo_eleitor)',
      'CONSTRAINT chk_cargo_candidato CHECK (cargo IN (\'Prefeito\', \'Vereador\', \'Vice-Prefeito\'))',
      'CONSTRAINT chk_votos_candidato CHECK (votos >= 0)',
    ],
  },
  {
    id: 'coligacoes',
    name: 'coligacoes',
    category: 'fato',
    description: 'Registro das coligações partidárias e chapas majoritárias formadas por pleito.',
    columns: [
      { name: 'id', type: 'BIGINT GENERATED ALWAYS AS IDENTITY', isPk: true, nullable: false, description: 'Chave primária.' },
      { name: 'id_eleicao', type: 'INTEGER', isFk: true, fkTarget: 'eleicao(id)', nullable: false, description: 'Pleito eleitoral.' },
      { name: 'cargo', type: 'VARCHAR(20)', nullable: false, constraint: "DEFAULT 'Prefeito'", description: 'Cargo da chapa (Prefeito).' },
      { name: 'numero_urna', type: 'INTEGER', nullable: false, description: 'Número oficial da chapa nas urnas.' },
      { name: 'nome_coligacao', type: 'VARCHAR(150)', nullable: false, description: 'Nome de registro da coligação ou partido isolado.' },
      { name: 'partido_numero_titular', type: 'INTEGER', isFk: true, fkTarget: 'partidos(numero)', nullable: true, description: 'Número TSE do partido cabeça de chapa.' },
      { name: 'sigla_partido_titular', type: 'VARCHAR(20)', nullable: false, description: 'Sigla do partido cabeça de chapa.' },
      { name: 'composicao_siglas', type: 'VARCHAR(200)', nullable: false, description: 'Composição completa das siglas participantes.' },
      { name: 'is_active', type: 'BOOLEAN', nullable: false, constraint: 'DEFAULT TRUE', description: 'Registro ativo no sistema.' },
      { name: 'is_deleted', type: 'BOOLEAN', nullable: false, constraint: 'DEFAULT FALSE', description: 'Soft Delete universal.' },
      { name: 'criado_em', type: 'TIMESTAMPTZ', nullable: false, constraint: 'DEFAULT CURRENT_TIMESTAMP', description: 'Auditoria de inserção.' },
    ],
    indexes: [
      'CREATE INDEX idx_coligacoes_eleicao ON coligacoes(id_eleicao);',
      'CREATE INDEX idx_coligacoes_numero ON coligacoes(id_eleicao, numero_urna);',
    ],
    constraints: [
      'PRIMARY KEY (id)',
      'CONSTRAINT fk_coligacoes_eleicao FOREIGN KEY (id_eleicao) REFERENCES eleicao(id) ON DELETE CASCADE',
      'CONSTRAINT fk_coligacoes_titular FOREIGN KEY (partido_numero_titular) REFERENCES partidos(numero) ON DELETE RESTRICT',
    ],
  },
  {
    id: 'coligacao_partidos',
    name: 'coligacao_partidos',
    category: 'fato',
    description: 'Tabela associativa relacionando quais agremiações partidárias compõem cada coligação pelo seu número canônico.',
    columns: [
      { name: 'id', type: 'BIGINT GENERATED ALWAYS AS IDENTITY', isPk: true, nullable: false, description: 'Chave primária associativa.' },
      { name: 'id_coligacao', type: 'BIGINT', isFk: true, fkTarget: 'coligacoes(id)', nullable: false, description: 'Chave estrangeira da coligação.' },
      { name: 'partido_numero', type: 'INTEGER', isFk: true, fkTarget: 'partidos(numero)', nullable: false, description: 'Número TSE do partido membro.' },
      { name: 'sigla_epoca', type: 'VARCHAR(20)', nullable: true, description: 'Sigla do partido na época do pleito.' },
      { name: 'papel', type: 'VARCHAR(50)', nullable: false, constraint: "DEFAULT 'Partido Apoiador'", description: 'Papel na chapa: Cabeça de Chapa, Vice-Prefeito, Partido Apoiador.' },
      { name: 'is_active', type: 'BOOLEAN', nullable: false, constraint: 'DEFAULT TRUE', description: 'Registro ativo no sistema.' },
      { name: 'is_deleted', type: 'BOOLEAN', nullable: false, constraint: 'DEFAULT FALSE', description: 'Soft Delete universal.' },
      { name: 'criado_em', type: 'TIMESTAMPTZ', nullable: false, constraint: 'DEFAULT CURRENT_TIMESTAMP', description: 'Auditoria de inserção.' },
    ],
    indexes: [
      'CREATE INDEX idx_coligacao_partidos_coligacao ON coligacao_partidos(id_coligacao);',
      'CREATE INDEX idx_coligacao_partidos_partido ON coligacao_partidos(partido_numero);',
      'CREATE UNIQUE INDEX uq_coligacao_partido ON coligacao_partidos(id_coligacao, partido_numero);',
    ],
    constraints: [
      'PRIMARY KEY (id)',
      'CONSTRAINT fk_cp_coligacao FOREIGN KEY (id_coligacao) REFERENCES coligacoes(id) ON DELETE CASCADE',
      'CONSTRAINT fk_cp_partido FOREIGN KEY (partido_numero) REFERENCES partidos(numero) ON DELETE RESTRICT',
      'CONSTRAINT uq_coligacao_partido UNIQUE (id_coligacao, partido_numero)',
    ],
  },
];

export const FULL_DDL_SCRIPT = `-- =======================================================================
-- PROJETO: BANCO DE DADOS RELACIONAL HISTÓRICO DE ELEIÇÕES MUNICIPAIS
-- ALVO: GOOGLE CLOUD SQL (ENGINE: POSTGRESQL 15+)
-- AUTOR: Arquiteto de Banco de Dados & DBA Sênior GCP
-- =======================================================================

-- 0. CONFIGURAÇÕES INICIAIS DA SESSÃO POSTGRESQL
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

-- Opcional: Criar schema isolado para organização de governança
CREATE SCHEMA IF NOT EXISTS eleicoes;
SET search_path TO eleicoes, public;

-- =======================================================================
-- ORDEM DE EXECUÇÃO:
-- 1. Dimensões Puras (dados_candidato, eleicao, partidos)
-- 2. Tabelas Fato & Estatísticas Dependentes (detalhes_votacao, partidos_eleicao, candidatos_eleicao)
-- =======================================================================

-- 1. TABELA: dados_candidato (Dimensão Pessoa Física)
-- Representa o indivíduo de forma única, preservando seu histórico perene.
CREATE TABLE IF NOT EXISTS dados_candidato (
    titulo_eleitor  VARCHAR(12) NOT NULL,
    nome_completo   VARCHAR(150) NOT NULL,
    data_nascimento DATE NULL,
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_dados_candidato PRIMARY KEY (titulo_eleitor),
    CONSTRAINT chk_titulo_numerico CHECK (titulo_eleitor ~ '^[0-9]{10,12}$')
);

COMMENT ON TABLE dados_candidato IS 'Pessoas físicas que já concorreram a cargos eletivos municipais';
COMMENT ON COLUMN dados_candidato.titulo_eleitor IS 'Título de eleitor do TSE (10 a 12 dígitos com zeros à esquerda)';
COMMENT ON COLUMN dados_candidato.data_nascimento IS 'Data de nascimento da pessoa física';


-- 2. TABELA: eleicao (Dimensão de Tempo / Pleito)
-- Representa cada evento eleitoral municipal periódico.
CREATE TABLE IF NOT EXISTS eleicao (
    id              INTEGER GENERATED ALWAYS AS IDENTITY,
    ano             SMALLINT NOT NULL,
    municipio_nome  VARCHAR(100) NOT NULL DEFAULT 'Braúnas',
    municipio_uf    CHAR(2) NOT NULL DEFAULT 'MG',
    codigo_tse      INTEGER NOT NULL DEFAULT 41750,
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_eleicao PRIMARY KEY (id),
    CONSTRAINT uq_eleicao_ano UNIQUE (ano),
    CONSTRAINT chk_eleicao_ano_valido CHECK (ano >= 1980 AND ano <= 2100)
);

COMMENT ON TABLE eleicao IS 'Catálogo temporal de pleitos eleitorais municipais';
COMMENT ON COLUMN eleicao.ano IS 'Ano de realização da eleição municipal (ex: 2000, 2004, ..., 2024)';


-- 3. TABELA: partidos (Dimensão Partidária Perene)
-- Cadastro padronizado único dos partidos políticos indexado pelo número eleitoral perene do TSE.
CREATE TABLE IF NOT EXISTS partidos (
    id              INTEGER GENERATED ALWAYS AS IDENTITY,
    numero          INTEGER NOT NULL,
    sigla           VARCHAR(20) NOT NULL,
    nome_completo   VARCHAR(150) NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_partidos PRIMARY KEY (id),
    CONSTRAINT uq_partidos_numero UNIQUE (numero)
);

COMMENT ON TABLE partidos IS 'Catálogo perene de partidos políticos indexado pelo número eleitoral do TSE';
COMMENT ON COLUMN partidos.numero IS 'Número oficial de urna atribuído pelo TSE (ex: 70, 15, 45, 13, 22)';
COMMENT ON COLUMN partidos.sigla IS 'Sigla atual da agremiação registrada no TSE (ex: AVANTE, MDB, PT, PSDB)';


-- 3.1 TABELA: partido_historico (Tabela Auxiliar de Histórico de Nomes e Siglas Anteriores)
-- Registra as transformações, rebrandings e fusões (ex: 70 era PTdoB e virou AVANTE; 15 era PMDB e virou MDB).
CREATE TABLE IF NOT EXISTS partido_historico (
    id              BIGINT GENERATED ALWAYS AS IDENTITY,
    id_partido      INTEGER NOT NULL,
    numero          INTEGER NOT NULL,
    sigla           VARCHAR(20) NOT NULL,
    nome_completo   VARCHAR(150) NULL,
    ano_inicio      SMALLINT NULL,
    ano_fim         SMALLINT NULL,
    is_atual        BOOLEAN NOT NULL DEFAULT FALSE,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_partido_historico PRIMARY KEY (id),
    CONSTRAINT fk_partido_hist_partido 
        FOREIGN KEY (id_partido) 
        REFERENCES partidos(id) 
        ON DELETE CASCADE
);

COMMENT ON TABLE partido_historico IS 'Histórico de denominações, siglas antigas e rebrandings partidários';


-- 4. TABELA: detalhes_votacao (Estatísticas Gerais da Urna)
-- Representa o balanço de apuração por cargo e por pleito.
CREATE TABLE IF NOT EXISTS detalhes_votacao (
    id              BIGINT GENERATED ALWAYS AS IDENTITY,
    id_eleicao      INTEGER NOT NULL,
    cargo           VARCHAR(20) NOT NULL,
    aptos           INTEGER NOT NULL DEFAULT 0,
    comparecimento  INTEGER NOT NULL DEFAULT 0,
    abstencoes      INTEGER NOT NULL DEFAULT 0,
    validos         INTEGER NOT NULL DEFAULT 0,
    brancos         INTEGER NOT NULL DEFAULT 0,
    nulos           INTEGER NOT NULL DEFAULT 0,
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_detalhes_votacao PRIMARY KEY (id),
    CONSTRAINT fk_detalhes_votacao_eleicao 
        FOREIGN KEY (id_eleicao) 
        REFERENCES eleicao(id) 
        ON DELETE CASCADE,
    CONSTRAINT uq_detalhes_eleicao_cargo UNIQUE (id_eleicao, cargo),
    CONSTRAINT chk_detalhes_cargo CHECK (cargo IN ('Prefeito', 'Vereador')),
    CONSTRAINT chk_detalhes_valores_positivos CHECK (
        aptos >= 0 AND 
        comparecimento >= 0 AND 
        abstencoes >= 0 AND 
        validos >= 0 AND 
        brancos >= 0 AND 
        nulos >= 0
    )
);

COMMENT ON TABLE detalhes_votacao IS 'Totais de comparecimento, abstenção e votos brancos/nulos por cargo';


-- 5. TABELA: partidos_eleicao (Desempenho Partidário em Vereador)
-- Representa a somatória de votos nominais e de legenda de cada partido no pleito proporcional.
CREATE TABLE IF NOT EXISTS partidos_eleicao (
    id              BIGINT GENERATED ALWAYS AS IDENTITY,
    id_eleicao      INTEGER NOT NULL,
    partido_numero  INTEGER NOT NULL,
    votos_nominais  INTEGER NOT NULL DEFAULT 0,
    votos_legenda   INTEGER NOT NULL DEFAULT 0,
    total_votos     INTEGER NOT NULL DEFAULT 0,
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_partidos_eleicao PRIMARY KEY (id),
    CONSTRAINT fk_partidos_eleicao_eleicao 
        FOREIGN KEY (id_eleicao) 
        REFERENCES eleicao(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_partidos_eleicao_partido 
        FOREIGN KEY (partido_numero) 
        REFERENCES partidos(numero) 
        ON DELETE RESTRICT,
    CONSTRAINT uq_partidos_eleicao UNIQUE (id_eleicao, partido_numero),
    CONSTRAINT chk_partidos_eleicao_votos CHECK (
        votos_nominais >= 0 AND 
        votos_legenda >= 0 AND 
        total_votos >= 0
    )
);

COMMENT ON TABLE partidos_eleicao IS 'Desempenho da bancada e votos de legenda por partido em cada pleito';


-- 6. TABELA: candidatos_eleicao (Fato - A Candidatura em si)
-- Histórico de participação do candidato em um pleito determinado, cargo e legenda.
CREATE TABLE IF NOT EXISTS candidatos_eleicao (
    id              BIGINT GENERATED ALWAYS AS IDENTITY,
    titulo_eleitor  VARCHAR(12) NOT NULL,
    id_eleicao      INTEGER NOT NULL,
    partido_numero  INTEGER NOT NULL,
    sigla_epoca     VARCHAR(20) NULL,
    cargo           VARCHAR(20) NOT NULL,
    numero_urna     INTEGER NOT NULL,
    nome_urna       VARCHAR(100) NOT NULL,
    votos           INTEGER NOT NULL DEFAULT 0,
    situacao        VARCHAR(50) NOT NULL,
    posicao         SMALLINT NULL,
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_candidatos_eleicao PRIMARY KEY (id),
    CONSTRAINT fk_cand_eleicao_candidato 
        FOREIGN KEY (titulo_eleitor) 
        REFERENCES dados_candidato(titulo_eleitor) 
        ON UPDATE CASCADE 
        ON DELETE RESTRICT,
    CONSTRAINT fk_cand_eleicao_eleicao 
        FOREIGN KEY (id_eleicao) 
        REFERENCES eleicao(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_cand_eleicao_partido 
        FOREIGN KEY (partido_numero) 
        REFERENCES partidos(numero) 
        ON DELETE RESTRICT,
    CONSTRAINT uq_candidato_eleicao_cargo UNIQUE (id_eleicao, cargo, titulo_eleitor),
    CONSTRAINT chk_cargo_candidato CHECK (cargo IN ('Prefeito', 'Vereador', 'Vice-Prefeito')),
    CONSTRAINT chk_votos_candidato CHECK (votos >= 0),
    CONSTRAINT chk_posicao_candidato CHECK (posicao IS NULL OR posicao > 0)
);

COMMENT ON TABLE candidatos_eleicao IS 'Fato da candidatura: votos nominais recebidos, situação e número de urna';


-- 7. TABELA: coligacoes (Chapas e Alianças Partidárias)
-- Armazena o registro oficial de alianças eleitorais e candidaturas majoritárias.
CREATE TABLE IF NOT EXISTS coligacoes (
    id                      BIGINT GENERATED ALWAYS AS IDENTITY,
    id_eleicao              INTEGER NOT NULL,
    cargo                   VARCHAR(20) NOT NULL DEFAULT 'Prefeito',
    numero_urna             INTEGER NOT NULL,
    nome_coligacao          VARCHAR(150) NOT NULL,
    partido_numero_titular  INTEGER NULL,
    sigla_partido_titular   VARCHAR(20) NOT NULL,
    composicao_siglas       VARCHAR(200) NOT NULL,
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    is_deleted              BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em               TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_coligacoes PRIMARY KEY (id),
    CONSTRAINT fk_coligacoes_eleicao 
        FOREIGN KEY (id_eleicao) 
        REFERENCES eleicao(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_coligacoes_titular 
        FOREIGN KEY (partido_numero_titular) 
        REFERENCES partidos(numero) 
        ON DELETE RESTRICT
);

COMMENT ON TABLE coligacoes IS 'Alianças e chapas partidárias registradas por pleito com Soft Delete universal';


-- 8. TABELA: coligacao_partidos (Associação N:N de Partidos por Coligação)
-- Mapeia quais agremiações partidárias compõem a chapa e seu respectivo papel institucional.
CREATE TABLE IF NOT EXISTS coligacao_partidos (
    id                      BIGINT GENERATED ALWAYS AS IDENTITY,
    id_coligacao            BIGINT NOT NULL,
    partido_numero          INTEGER NOT NULL,
    sigla_epoca             VARCHAR(20) NULL,
    papel                   VARCHAR(50) NOT NULL DEFAULT 'Partido Apoiador',
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    is_deleted              BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em               TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_coligacao_partidos PRIMARY KEY (id),
    CONSTRAINT fk_cp_coligacao 
        FOREIGN KEY (id_coligacao) 
        REFERENCES coligacoes(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_cp_partido 
        FOREIGN KEY (partido_numero) 
        REFERENCES partidos(numero) 
        ON DELETE RESTRICT,
    CONSTRAINT uq_coligacao_partido UNIQUE (id_coligacao, partido_numero)
);

COMMENT ON TABLE coligacao_partidos IS 'Partidos integrantes de cada chapa/coligação com Soft Delete universal';
`;

export const FULL_INDEXES_SCRIPT = `-- =======================================================================
-- CRIAÇÃO DE ÍNDICES ESTRATÉGICOS PARA O GOOGLE CLOUD SQL (POSTGRESQL)
-- =======================================================================

-- 1. Consultas pelo Ano do Pleito (Filtros temporais e agregações históricas)
CREATE INDEX IF NOT EXISTS idx_eleicao_ano 
    ON eleicao(ano);

-- 2. Histórico de Vida Política do Candidato (Pessoa Física)
-- Otimiza pesquisas tipo: "Quais cargos fulano já disputou nos últimos 24 anos?"
CREATE INDEX IF NOT EXISTS idx_candidatos_eleicao_titulo 
    ON candidatos_eleicao(titulo_eleitor);

-- 3. Apuração por Pleito e Cargo
-- Acelera listagens completas da eleição municipal (ex: Prefeitos de 2024, Vereadores de 2012)
CREATE INDEX IF NOT EXISTS idx_candidatos_eleicao_pleito_cargo 
    ON candidatos_eleicao(id_eleicao, cargo);

-- 4. Ranking de Votação (Covering / Order by Votos DESC)
-- Otimiza consultas do tipo "TOP 10 vereadores mais votados da eleição X"
CREATE INDEX IF NOT EXISTS idx_candidatos_eleicao_ranking 
    ON candidatos_eleicao(id_eleicao, cargo, votos DESC);

-- 5. Análise de Bancadas Partidárias
-- Acelera agregações de votos e contagem de eleitos por partido
CREATE INDEX IF NOT EXISTS idx_candidatos_eleicao_partido 
    ON candidatos_eleicao(id_partido);

-- 6. Busca Rápida de Partidos por Número e Sigla
CREATE INDEX IF NOT EXISTS idx_partidos_numero 
    ON partidos(numero);
CREATE INDEX IF NOT EXISTS idx_partidos_sigla 
    ON partidos(sigla);

-- 6.1 Histórico de Denominações Partidárias (Rebrandings e Siglas Anteriores)
CREATE INDEX IF NOT EXISTS idx_partido_hist_partido 
    ON partido_historico(id_partido);
CREATE INDEX IF NOT EXISTS idx_partido_hist_numero 
    ON partido_historico(numero);
CREATE INDEX IF NOT EXISTS idx_partido_hist_sigla 
    ON partido_historico(sigla);

-- 7. Desempenho Partidário por Pleito
CREATE INDEX IF NOT EXISTS idx_partidos_eleicao_pleito 
    ON partidos_eleicao(id_eleicao);

-- 8. Estatísticas e Urna por Pleito
CREATE INDEX IF NOT EXISTS idx_detalhes_votacao_pleito 
    ON detalhes_votacao(id_eleicao);

-- 9. Coligações por Pleito e Número de Urna
CREATE INDEX IF NOT EXISTS idx_coligacoes_eleicao 
    ON coligacoes(id_eleicao);
CREATE INDEX IF NOT EXISTS idx_coligacoes_numero 
    ON coligacoes(id_eleicao, numero_urna);

-- 10. Membros Partidários da Coligação
CREATE INDEX IF NOT EXISTS idx_coligacao_partidos_coligacao 
    ON coligacao_partidos(id_coligacao);
CREATE INDEX IF NOT EXISTS idx_coligacao_partidos_partido 
    ON coligacao_partidos(id_partido);
`;

export const ANALYTICS_VIEWS_SCRIPT = `-- =======================================================================
-- VIEWS ANALÍTICAS E CONSULTAS AVANÇADAS (BUSINESS INTELLIGENCE)
-- =======================================================================

-- View 1: Apuração Completa Consolidada
CREATE OR REPLACE VIEW vw_apuracao_candidatos AS
SELECT 
    e.ano,
    ce.cargo,
    ce.posicao,
    ce.nome_urna,
    dc.nome_completo,
    p.sigla AS partido,
    ce.numero_urna,
    ce.votos,
    ce.situacao,
    dc.data_nascimento,
    ce.titulo_eleitor
FROM candidatos_eleicao ce
JOIN eleicao e ON e.id = ce.id_eleicao
JOIN partidos p ON p.id = ce.id_partido
JOIN dados_candidato dc ON dc.titulo_eleitor = ce.titulo_eleitor
ORDER BY e.ano DESC, ce.cargo, ce.posicao ASC;

-- View 2: Histórico de Votos e Mandatos por Pessoa Física
CREATE OR REPLACE VIEW vw_historico_politico AS
SELECT 
    dc.titulo_eleitor,
    dc.nome_completo,
    COUNT(ce.id) AS total_disputas,
    COUNT(CASE WHEN ce.situacao ILIKE 'Eleito%' THEN 1 END) AS total_mandatos,
    SUM(ce.votos) AS total_votos_acumulados,
    MIN(e.ano) AS primeira_eleicao,
    MAX(e.ano) AS ultima_eleicao,
    STRING_AGG(DISTINCT p.sigla, ', ' ORDER BY p.sigla) AS partidos_disputados
FROM dados_candidato dc
JOIN candidatos_eleicao ce ON ce.titulo_eleitor = dc.titulo_eleitor
JOIN eleicao e ON e.id = ce.id_eleicao
JOIN partidos p ON p.id = ce.id_partido
GROUP BY dc.titulo_eleitor, dc.nome_completo
ORDER BY total_votos_acumulados DESC;

-- View 3: Evolução do Comparecimento e Abstenção
CREATE OR REPLACE VIEW vw_evolucao_comparecimento AS
SELECT 
    e.ano,
    dv.cargo,
    dv.aptos,
    dv.comparecimento,
    ROUND((dv.comparecimento::NUMERIC / NULLIF(dv.aptos, 0)) * 100, 2) AS pct_comparecimento,
    dv.abstencoes,
    ROUND((dv.abstencoes::NUMERIC / NULLIF(dv.aptos, 0)) * 100, 2) AS pct_abstencao,
    dv.brancos,
    dv.nulos
FROM detalhes_votacao dv
JOIN eleicao e ON e.id = dv.id_eleicao
ORDER BY e.ano ASC, dv.cargo;
`;

export function generateSeedSql(dataset: RawElectionDataset): string {
  const lines: string[] = [
    '-- =======================================================================',
    '-- CARGA DE DADOS HISTÓRICOS (2000 A 2024) - MUNICÍPIO DE BRAÚNAS / MG',
    '-- Extraído da API de Dados Abertos do TSE',
    '-- =======================================================================',
    'BEGIN;',
    '',
  ];

  // 1. Inserir dados_candidato
  lines.push('-- 1. INSERINDO DADOS_CANDIDATO');
  const candidatos = Object.values(dataset.candidatos_base);
  for (const c of candidatos) {
    let dateStr = 'NULL';
    if (c.data_nascimento && c.data_nascimento.includes('/')) {
      const parts = c.data_nascimento.split('/');
      if (parts.length === 3) {
        // DD/MM/YYYY -> YYYY-MM-DD
        dateStr = `'${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}'::DATE`;
      }
    }
    const safeName = c.nome_completo.replace(/'/g, "''");
    lines.push(
      `INSERT INTO dados_candidato (titulo_eleitor, nome_completo, data_nascimento) ` +
        `VALUES ('${c.titulo_eleitor}', '${safeName}', ${dateStr}) ` +
        `ON CONFLICT (titulo_eleitor) DO NOTHING;`
    );
  }
  lines.push('');

  // 2. Inserir catálogo mestre de partidos com número TSE canônico
  lines.push('-- 2. INSERINDO CATÁLOGO CANÔNICO DE PARTIDOS (CHAVE: NÚMERO TSE)');
  const CANONICAL_PARTIES = [
    { numero: 10, sigla: 'REPUBLICANOS', nome: 'Republicanos' },
    { numero: 11, sigla: 'PP', nome: 'Progressistas' },
    { numero: 12, sigla: 'PDT', nome: 'Partido Democrático Trabalhista' },
    { numero: 13, sigla: 'PT', nome: 'Partido dos Trabalhadores' },
    { numero: 14, sigla: 'PTB', nome: 'Partido Trabalhista Brasileiro' },
    { numero: 15, sigla: 'MDB', nome: 'Movimento Democrático Brasileiro' },
    { numero: 18, sigla: 'REDE', nome: 'Rede Sustentabilidade' },
    { numero: 19, sigla: 'PODE', nome: 'Podemos' },
    { numero: 20, sigla: 'PSC', nome: 'Partido Social Cristão' },
    { numero: 22, sigla: 'PL', nome: 'Partido Liberal' },
    { numero: 23, sigla: 'CIDADANIA', nome: 'Cidadania' },
    { numero: 25, sigla: 'PRD', nome: 'Partido Renovação Democrática' },
    { numero: 27, sigla: 'DC', nome: 'Democracia Cristã' },
    { numero: 31, sigla: 'PHS', nome: 'Partido Humanista da Solidariedade' },
    { numero: 36, sigla: 'AGIR', nome: 'Agir' },
    { numero: 40, sigla: 'PSB', nome: 'Partido Socialista Brasileiro' },
    { numero: 43, sigla: 'PV', nome: 'Partido Verde' },
    { numero: 44, sigla: 'UNIÃO', nome: 'União Brasil' },
    { numero: 45, sigla: 'PSDB', nome: 'Partido da Social Democracia Brasileira' },
    { numero: 51, sigla: 'PATRIOTA', nome: 'Patriota' },
    { numero: 55, sigla: 'PSD', nome: 'Partido Social Democrático' },
    { numero: 70, sigla: 'AVANTE', nome: 'Avante' },
    { numero: 77, sigla: 'SOLIDARIEDADE', nome: 'Solidariedade' },
    { numero: 90, sigla: 'PROS', nome: 'Partido Republicano da Ordem Social' },
  ];

  for (const p of CANONICAL_PARTIES) {
    lines.push(
      `INSERT INTO partidos (numero, sigla, nome_completo) VALUES (${p.numero}, '${p.sigla}', '${p.nome}') ` +
        `ON CONFLICT (numero) DO UPDATE SET sigla = EXCLUDED.sigla, nome_completo = EXCLUDED.nome_completo;`
    );
  }
  lines.push('');

  // 3. Inserir eleicao
  lines.push('-- 3. INSERINDO ELEIÇÕES');
  const anos = Object.keys(dataset.eleicoes).sort();
  for (const anoStr of anos) {
    const ano = parseInt(anoStr, 10);
    lines.push(
      `INSERT INTO eleicao (ano, municipio_nome, municipio_uf, codigo_tse) ` +
        `VALUES (${ano}, '${dataset.municipio.nome}', '${dataset.municipio.uf}', ${dataset.municipio.codigo_tse}) ` +
        `ON CONFLICT (ano) DO NOTHING;`
    );
  }
  lines.push('');

  // 4. Inserir detalhes_votacao
  lines.push('-- 4. INSERINDO DETALHES DE VOTAÇÃO (ESTATÍSTICAS DA URNA)');
  for (const anoStr of anos) {
    const el = dataset.eleicoes[anoStr];
    const { prefeito, vereador } = el.detalhes;

    if (prefeito) {
      lines.push(
        `INSERT INTO detalhes_votacao (id_eleicao, cargo, aptos, comparecimento, abstencoes, validos, brancos, nulos) ` +
          `SELECT e.id, 'Prefeito', ${prefeito.aptos}, ${prefeito.comparecimento}, ${prefeito.abstencoes}, ${prefeito.validos}, ${prefeito.brancos}, ${prefeito.nulos} ` +
          `FROM eleicao e WHERE e.ano = ${el.ano} ` +
          `ON CONFLICT (id_eleicao, cargo) DO UPDATE SET aptos = EXCLUDED.aptos, comparecimento = EXCLUDED.comparecimento, abstencoes = EXCLUDED.abstencoes, validos = EXCLUDED.validos, brancos = EXCLUDED.brancos, nulos = EXCLUDED.nulos;`
      );
    }

    if (vereador) {
      lines.push(
        `INSERT INTO detalhes_votacao (id_eleicao, cargo, aptos, comparecimento, abstencoes, validos, brancos, nulos) ` +
          `SELECT e.id, 'Vereador', ${vereador.aptos}, ${vereador.comparecimento}, ${vereador.abstencoes}, ${vereador.validos}, ${vereador.brancos}, ${vereador.nulos} ` +
          `FROM eleicao e WHERE e.ano = ${el.ano} ` +
          `ON CONFLICT (id_eleicao, cargo) DO UPDATE SET aptos = EXCLUDED.aptos, comparecimento = EXCLUDED.comparecimento, abstencoes = EXCLUDED.abstencoes, validos = EXCLUDED.validos, brancos = EXCLUDED.brancos, nulos = EXCLUDED.nulos;`
      );
    }
  }
  lines.push('');

  const SIGLA_NUM_MAP: Record<string, number> = {
    'PT DO B': 70,
    PTDOB: 70,
    AVANTE: 70,
    PMDB: 15,
    MDB: 15,
    PFL: 25,
    DEM: 25,
    PRD: 25,
    PPB: 11,
    PP: 11,
    PDT: 12,
    PT: 13,
    PTB: 14,
    REDE: 18,
    PODE: 19,
    PTN: 19,
    PSC: 20,
    PR: 22,
    PL: 22,
    PPS: 23,
    CIDADANIA: 23,
    DC: 27,
    PSDC: 27,
    PHS: 31,
    PTC: 36,
    AGIR: 36,
    PSB: 40,
    PV: 43,
    PSDB: 45,
    PATRIOTA: 51,
    PEN: 51,
    PSD: 55,
    SD: 77,
    SOLIDARIEDADE: 77,
    PROS: 90,
  };

  // 5. Inserir partidos_eleicao
  lines.push('-- 5. INSERINDO PARTIDOS_ELEICAO (DESEMPENHO PARTIDÁRIO VEREADOR COM PARTIDO_NUMERO)');
  for (const anoStr of anos) {
    const el = dataset.eleicoes[anoStr];
    for (const pv of el.partidos_vereador) {
      const siglaUp = pv.partido.trim().toUpperCase();
      const numTse = SIGLA_NUM_MAP[siglaUp] || 0;
      if (numTse > 0) {
        lines.push(
          `INSERT INTO partidos_eleicao (id_eleicao, partido_numero, votos_nominais, votos_legenda, total_votos) ` +
            `SELECT e.id, ${numTse}, ${pv.votos_nominais}, ${pv.votos_legenda}, ${pv.total_votos} ` +
            `FROM eleicao e ` +
            `WHERE e.ano = ${el.ano} ` +
            `ON CONFLICT (id_eleicao, partido_numero) DO UPDATE SET votos_nominais = EXCLUDED.votos_nominais, votos_legenda = EXCLUDED.votos_legenda, total_votos = EXCLUDED.total_votos;`
        );
      }
    }
  }
  lines.push('');

  // 6. Inserir candidatos_eleicao com dedução automática via 2 primeiros dígitos do número de urna
  lines.push('-- 6. INSERINDO CANDIDATOS_ELEICAO (VALIDAÇÃO CANÔNICA VIA 2 PRIMEIROS DÍGITOS DO NÚMERO)');
  for (const anoStr of anos) {
    const el = dataset.eleicoes[anoStr];
    for (const res of el.resultados) {
      const safeNomeUrna = res.nome_urna.replace(/'/g, "''");
      const safeSituacao = res.situacao.replace(/'/g, "''");
      const safeSiglaEpoca = res.partido.replace(/'/g, "''");
      const posicaoVal = res.posicao ? res.posicao : 'NULL';
      const numPartidoDeduzido = parseInt(String(res.numero).slice(0, 2), 10);

      lines.push(
        `INSERT INTO candidatos_eleicao (titulo_eleitor, id_eleicao, partido_numero, sigla_epoca, cargo, numero_urna, nome_urna, votos, situacao, posicao) ` +
          `SELECT '${res.titulo_eleitor}', e.id, ${numPartidoDeduzido}, '${safeSiglaEpoca}', '${res.cargo}', ${res.numero}, '${safeNomeUrna}', ${res.votos}, '${safeSituacao}', ${posicaoVal} ` +
          `FROM eleicao e ` +
          `WHERE e.ano = ${el.ano} ` +
          `ON CONFLICT (id_eleicao, cargo, titulo_eleitor) DO UPDATE ` +
          `SET votos = EXCLUDED.votos, situacao = EXCLUDED.situacao, posicao = EXCLUDED.posicao, numero_urna = EXCLUDED.numero_urna, partido_numero = EXCLUDED.partido_numero, sigla_epoca = EXCLUDED.sigla_epoca;`
      );
    }
  }

  lines.push('');
  lines.push('COMMIT;');
  lines.push('');
  lines.push('-- FIM DA CARGA INICIAL DE DADOS HISTÓRICOS');

  return lines.join('\n');
}
