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
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 rounded-lg bg-blue-950 text-blue-400 border border-blue-900">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              Guia DBA: Instanciação no Google Cloud SQL (PostgreSQL)
            </h2>
            <p className="text-sm text-slate-400">
              Passo a passo direto via Console GCP e comandos equivalentes via Google Cloud SDK (gcloud CLI).
            </p>
          </div>
        </div>
      </div>

      {/* Step by Step Console (Bullet Points as requested) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span>Passo a Passo via Google Cloud Console (Interface Web)</span>
        </h3>

        <ol className="space-y-3 text-sm text-slate-300">
          <li className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <span className="w-6 h-6 rounded-full bg-blue-900/80 text-blue-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              1
            </span>
            <div>
              <strong className="text-white">Acessar o Serviço Cloud SQL:</strong> No Google Cloud Console, acesse o menu de navegação lateral ➔ <strong>Bancos de Dados</strong> ➔ <strong>Cloud SQL</strong> (ou busque por "SQL" na barra superior) e clique em <span className="text-blue-400 font-medium">"Criar instância"</span>.
            </div>
          </li>

          <li className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <span className="w-6 h-6 rounded-full bg-blue-900/80 text-blue-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              2
            </span>
            <div>
              <strong className="text-white">Selecionar o Mecanismo:</strong> Escolha <strong>PostgreSQL</strong>. Na tela seguinte, selecione a versão <strong>PostgreSQL 15</strong> ou <strong>PostgreSQL 16</strong>.
            </div>
          </li>

          <li className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <span className="w-6 h-6 rounded-full bg-blue-900/80 text-blue-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              3
            </span>
            <div>
              <strong className="text-white">Identificação e Credenciais:</strong> Defina o <em>ID da Instância</em> (ex: <code>eleicoes-db-instance</code>) e crie uma senha forte para o usuário administrador <code>postgres</code> (ou gere uma aleatória e guarde no Secret Manager).
            </div>
          </li>

          <li className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <span className="w-6 h-6 rounded-full bg-blue-900/80 text-blue-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              4
            </span>
            <div>
              <strong className="text-white">Região e Zona:</strong> Selecione a região mais próxima da aplicação (ex: <code>southamerica-east1</code> em São Paulo para menor latência no Brasil). Escolha <em>Zona única (Zonal)</em> para desenvolvimento/estudos ou <em>Alta Disponibilidade (Regional HA)</em> para produção crítica com failover automático.
            </div>
          </li>

          <li className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <span className="w-6 h-6 rounded-full bg-blue-900/80 text-blue-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              5
            </span>
            <div>
              <strong className="text-white">Tipo de Máquina e Armazenamento:</strong>
              <ul className="mt-1 space-y-0.5 list-disc list-inside text-xs text-slate-400">
                <li>Configuração recomendada: <strong>Shared-core</strong> (db-f1-micro / db-g1-small) para testes, ou <strong>Standard</strong> (2 vCPUs, 7.5 GB RAM) para carga de relatórios.</li>
                <li>Armazenamento: Escolha <strong>SSD</strong> (mínimo 20 GB) e marque a opção <span className="text-emerald-400 font-medium">"Habilitar aumento automático do armazenamento"</span> para evitar interrupções de serviço caso os dados cresçam.</li>
              </ul>
            </div>
          </li>

          <li className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <span className="w-6 h-6 rounded-full bg-blue-900/80 text-blue-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              6
            </span>
            <div>
              <strong className="text-white">Conectividade e Segurança:</strong>
              <ul className="mt-1 space-y-0.5 list-disc list-inside text-xs text-slate-400">
                <li><strong>Redes Privadas (VPC):</strong> Recomendado marcar <em>IP privado</em> para tráfego interno no GCP sem transitar pela Internet.</li>
                <li><strong>Redes Autorizadas:</strong> Caso use IP público, cadastre o IP estático do seu escritório ou utilize preferencialmente o <strong className="text-blue-300">Cloud SQL Auth Proxy</strong> (que dispensa autorizar IPs manuais e criptografa a conexão mTLS).</li>
              </ul>
            </div>
          </li>

          <li className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <span className="w-6 h-6 rounded-full bg-blue-900/80 text-blue-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              7
            </span>
            <div>
              <strong className="text-white">Criar o Banco de Dados e Importar o DDL:</strong>
              Após a instância atingir o status <em>Pronta (Checkmark verde)</em>:
              <ul className="mt-1 space-y-0.5 list-disc list-inside text-xs text-slate-400">
                <li>Vá na aba lateral <strong>"Bancos de dados"</strong> ➔ clique em <strong>"Criar banco de dados"</strong> ➔ nomeie como <code>eleicoes_municipais</code>.</li>
                <li>Execute o script DDL fornecido via Cloud Shell (<code>psql</code>) ou via ferramenta cliente (DBeaver, pgAdmin) conectada através do Cloud SQL Proxy.</li>
              </ul>
            </div>
          </li>
        </ol>
      </div>

      {/* Alternative via gcloud CLI */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Terminal className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Automação Rápida via gcloud CLI (Google Cloud Shell)</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Infraestrutura como Código (IaC)</span>
        </div>

        {/* Command 1: Create instance */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>1. Criação da Instância Cloud SQL PostgreSQL 15:</span>
            <button
              onClick={() => copyToClipboard(gcloudCreateCmd, 'create')}
              className="text-slate-400 hover:text-white flex items-center gap-1 transition cursor-pointer"
            >
              {copiedCmd === 'create' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCmd === 'create' ? 'Copiado!' : 'Copiar'}</span>
            </button>
          </div>
          <pre className="p-3 bg-slate-950 rounded-lg font-mono text-xs text-slate-300 border border-slate-800 overflow-x-auto">
            {gcloudCreateCmd}
          </pre>
        </div>

        {/* Command 2: Create database */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>2. Criar o Banco de Dados no PostgreSQL:</span>
            <button
              onClick={() => copyToClipboard(gcloudDatabaseCmd, 'db')}
              className="text-slate-400 hover:text-white flex items-center gap-1 transition cursor-pointer"
            >
              {copiedCmd === 'db' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCmd === 'db' ? 'Copiado!' : 'Copiar'}</span>
            </button>
          </div>
          <pre className="p-3 bg-slate-950 rounded-lg font-mono text-xs text-slate-300 border border-slate-800 overflow-x-auto">
            {gcloudDatabaseCmd}
          </pre>
        </div>

        {/* Command 3: Connect via Auth Proxy */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>3. Conectar com Cloud SQL Auth Proxy & Executar Scripts:</span>
            <button
              onClick={() => copyToClipboard(psqlImportCmd, 'import')}
              className="text-slate-400 hover:text-white flex items-center gap-1 transition cursor-pointer"
            >
              {copiedCmd === 'import' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCmd === 'import' ? 'Copiado!' : 'Copiar'}</span>
            </button>
          </div>
          <pre className="p-3 bg-slate-950 rounded-lg font-mono text-xs text-slate-300 border border-slate-800 overflow-x-auto">
            {psqlImportCmd}
          </pre>
        </div>
      </div>

      {/* Cloud SQL Flags & Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center space-x-2 text-blue-400 mb-2">
            <Cpu className="w-4 h-4" />
            <h4 className="font-semibold text-sm text-white">Database Flags Recomendadas</h4>
          </div>
          <ul className="text-xs text-slate-400 space-y-1.5 font-mono">
            <li><code>work_mem = 64MB</code> (acelera queries com agregações pesadas e ordenações)</li>
            <li><code>log_min_duration_statement = 200</code> (audita consultas acima de 200ms)</li>
            <li><code>track_io_timing = on</code> (habilita telemetria no Cloud Monitoring)</li>
          </ul>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center space-x-2 text-emerald-400 mb-2">
            <HardDrive className="w-4 h-4" />
            <h4 className="font-semibold text-sm text-white">Rotina de Backup</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Habilite <strong>Backups Diários Automatizados</strong> com retenção de 7 a 30 dias e ative <strong>Point-in-Time Recovery (PITR)</strong> via log write-ahead (WAL), permitindo restaurar a base em qualquer segundo dos últimos 7 dias.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center space-x-2 text-purple-400 mb-2">
            <Lock className="w-4 h-4" />
            <h4 className="font-semibold text-sm text-white">Governança & IAM</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Em vez de senhas estáticas no código, configure <strong>Cloud SQL IAM Database Authentication</strong> para conectar serviços do GCP (Cloud Run, GKE) usando Service Accounts com permissões mínimas (<code>roles/cloudsql.client</code>).
          </p>
        </div>
      </div>
    </div>
  );
};
