import React, { useState } from 'react';
import { Server, Terminal, Shield, CheckCircle2, Copy, Check, ExternalLink, Cpu, HardDrive, Lock } from 'lucide-react';

export const CloudSqlGuide: React.FC = () => {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const gcloudCreateCmd = `gcloud sql instances create eleicoes-db-instance \\
    --database-version=POSTGRES_15 \\
    --tier=db-custom-2-7680 \\
    --region=southamerica-east1 \\
    --storage-type=SSD \\
    --storage-size=20GB \\
    --storage-auto-increase \\
    --backup-start-time=04:00 \\
    --enable-point-in-time-recovery \\
    --availability-type=zonal \\
    --root-password="SEU_PASSWORD_SEGURO"`;

  const gcloudDatabaseCmd = `gcloud sql databases create eleicoes_municipais \\
    --instance=eleicoes-db-instance`;

  const gcloudProxyCmd = `# Instale e inicie o Cloud SQL Auth Proxy para conexão segura local
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.linux.amd64
chmod +x cloud-sql-proxy
./cloud-sql-proxy PROJECT_ID:southamerica-east1:eleicoes-db-instance --port 5432`;

  const psqlImportCmd = `# Importar o script DDL e a carga histórica via psql
psql -h 127.0.0.1 -p 5432 -U postgres -d eleicoes_municipais -f 01_schema_eleicoes_ddl.sql
psql -h 127.0.0.1 -p 5432 -U postgres -d eleicoes_municipais -f 02_indexes_eleicoes.sql
psql -h 127.0.0.1 -p 5432 -U postgres -d eleicoes_municipais -f 03_seed_eleicoes_braunas.sql`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Guia DBA: Instanciação no Google Cloud SQL (PostgreSQL)
            </h3>
            <p className="text-sm text-slate-500">
              Passo a passo no Console Web do GCP e comandos equivalentes via Google Cloud SDK (gcloud CLI).
            </p>
          </div>
        </div>
      </div>

      {/* Step by Step Console (Bullet Points as requested) */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
        <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
          <span>Passo a Passo via Google Cloud Console (Interface Gráfica)</span>
        </h4>

        <ol className="space-y-3 text-sm text-slate-700">
          <li className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              1
            </span>
            <div>
              <strong className="text-slate-900">Acessar o Cloud SQL:</strong> No Google Cloud Console, acesse o menu lateral ➔ <strong>Bancos de Dados</strong> ➔ <strong>Cloud SQL</strong> e clique em <span className="text-blue-700 font-semibold">"Criar instância"</span>.
            </div>
          </li>

          <li className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              2
            </span>
            <div>
              <strong className="text-slate-900">Selecionar o Mecanismo:</strong> Escolha <strong>PostgreSQL</strong> e selecione a versão <strong>PostgreSQL 15</strong> ou <strong>16</strong>.
            </div>
          </li>

          <li className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              3
            </span>
            <div>
              <strong className="text-slate-900">Identificação e Credenciais:</strong> Defina o ID da Instância (<code>eleicoes-db-instance</code>) e crie uma senha forte para o usuário master <code>postgres</code>.
            </div>
          </li>

          <li className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              4
            </span>
            <div>
              <strong className="text-slate-900">Região e Zona:</strong> Selecione <code>southamerica-east1</code> (São Paulo) para menor latência no Brasil. Escolha <em>Zona única</em> para desenvolvimento ou <em>Alta Disponibilidade (HA)</em> para produção.
            </div>
          </li>

          <li className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              5
            </span>
            <div>
              <strong className="text-slate-900">Configuração de Máquina & Disco:</strong> Escolha <strong>Shared-core</strong> para testes ou <strong>Standard</strong> (2 vCPUs / 7.5GB RAM). Em armazenamento, selecione <strong>SSD</strong> com aumento automático ativado.
            </div>
          </li>

          <li className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              6
            </span>
            <div>
              <strong className="text-slate-900">Segurança & Conectividade:</strong> Habilite preferencialmente o <strong className="text-blue-700">Cloud SQL Auth Proxy</strong> com túnel criptografado mTLS em vez de abrir portas para a Internet pública.
            </div>
          </li>

          <li className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              7
            </span>
            <div>
              <strong className="text-slate-900">Criar o Database e Executar DDL:</strong> Crie a base <code>eleicoes_db</code> e importe o DDL e o seeder via <code>psql</code> ou DBeaver.
            </div>
          </li>
        </ol>
      </div>

      {/* Alternative via gcloud CLI */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Terminal className="w-5 h-5 text-amber-600" />
            <h4 className="text-base font-bold text-slate-900">Automação Rápida via gcloud CLI (Google Cloud Shell)</h4>
          </div>
          <span className="text-xs text-slate-500 font-mono">Infraestrutura como Código</span>
        </div>

        {/* Command 1: Create instance */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>1. Criação da Instância Cloud SQL PostgreSQL 15:</span>
            <button
              onClick={() => copyToClipboard(gcloudCreateCmd, 'create')}
              className="text-blue-700 hover:text-blue-900 flex items-center gap-1 transition cursor-pointer font-semibold"
            >
              {copiedCmd === 'create' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCmd === 'create' ? 'Copiado!' : 'Copiar'}</span>
            </button>
          </div>
          <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs border border-slate-800 overflow-x-auto scrollbar-dark">
            {gcloudCreateCmd}
          </pre>
        </div>

        {/* Command 2: Create database */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>2. Criar o Banco de Dados no PostgreSQL:</span>
            <button
              onClick={() => copyToClipboard(gcloudDatabaseCmd, 'db')}
              className="text-blue-700 hover:text-blue-900 flex items-center gap-1 transition cursor-pointer font-semibold"
            >
              {copiedCmd === 'db' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCmd === 'db' ? 'Copiado!' : 'Copiar'}</span>
            </button>
          </div>
          <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs border border-slate-800 overflow-x-auto scrollbar-dark">
            {gcloudDatabaseCmd}
          </pre>
        </div>

        {/* Command 3: Connect via Auth Proxy */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>3. Conectar com Cloud SQL Auth Proxy & Executar Scripts:</span>
            <button
              onClick={() => copyToClipboard(psqlImportCmd, 'import')}
              className="text-blue-700 hover:text-blue-900 flex items-center gap-1 transition cursor-pointer font-semibold"
            >
              {copiedCmd === 'import' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCmd === 'import' ? 'Copiado!' : 'Copiar'}</span>
            </button>
          </div>
          <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs border border-slate-800 overflow-x-auto scrollbar-dark">
            {psqlImportCmd}
          </pre>
        </div>
      </div>

      {/* Cloud SQL Flags & Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-center space-x-2 text-blue-700 mb-2">
            <Cpu className="w-4 h-4" />
            <h5 className="font-bold text-sm text-slate-900">Database Flags Recomendadas</h5>
          </div>
          <ul className="text-xs text-slate-600 space-y-1.5 font-mono">
            <li><code>work_mem = 64MB</code> (acelera agregações e sorts)</li>
            <li><code>log_min_duration_statement = 200</code> (audita lentidão)</li>
            <li><code>track_io_timing = on</code> (telemetria de disco)</li>
          </ul>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-center space-x-2 text-emerald-700 mb-2">
            <HardDrive className="w-4 h-4" />
            <h5 className="font-bold text-sm text-slate-900">Rotina de Backup</h5>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Habilite <strong>Backups Diários Automatizados</strong> com retenção de 7 a 30 dias e ative <strong>Point-in-Time Recovery (PITR)</strong> via log write-ahead (WAL), permitindo restaurar a base em qualquer segundo dos últimos 7 dias.
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-center space-x-2 text-purple-700 mb-2">
            <Lock className="w-4 h-4" />
            <h5 className="font-bold text-sm text-slate-900">Governança & IAM</h5>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Em vez de senhas estáticas no código, configure <strong>Cloud SQL IAM Database Authentication</strong> para conectar serviços do GCP (Cloud Run, GKE) usando Service Accounts com permissões mínimas (<code>roles/cloudsql.client</code>).
          </p>
        </div>
      </div>
    </div>
  );
};
