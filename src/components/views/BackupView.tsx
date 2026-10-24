/**
 * Tela de backup e restauração de dados do usuário (SPEC-M-024 D5).
 *
 * Exporta o banco do usuário (apenas dados próprios — catálogos fixos nunca
 * entram) como arquivo JSON BackupV2, e restaura a partir de um arquivo
 * previamente exportado. Não exige login nem conta em nuvem.
 *
 * `exportData`/`importData` podem ser injetados via props para teste; quando
 * ausentes, vêm de `useDataClient()`.
 */
import { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { useDataClient } from '../../context/DataClientProvider';
import { Button } from '../ui/button';

interface BackupViewProps {
  exportData?: () => Promise<void>;
  importData?: (json: string) => void;
}

export function BackupView(props: BackupViewProps = {}) {
  const { exportData: contextExportData, importData: contextImportData } = useDataClient();
  const exportData = props.exportData ?? contextExportData;
  const importData = props.importData ?? contextImportData;
  const [importing, setImporting] = useState(false);

  const handleExport = async () => {
    try {
      await exportData();
    } catch {
      console.error('backup: falha ao exportar');
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      await importData(text);
    } catch {
      console.error('backup: falha ao importar');
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  return (
    <section className="max-w-md sm:max-w-xl lg:max-w-2xl mx-auto pt-6 pb-10 space-y-6">
      <div className="rounded-[26px] bg-surface-default border border-ceci-border-subtle shadow-sm p-6">
        <h2 className="font-serif-academic text-xl sm:text-2xl text-ceci-primary">
          Backup do cantinho
        </h2>
        <p className="text-sm text-ceci-secondary mt-2">
          Seus dados próprios (perfil, disciplinas, tarefas, estágio, TCC, leituras, flashcards…)
          são exportados num arquivo JSON. Conteúdos fixos do app (templo, abordagens, questões) não
          entram — eles vêm do bundle.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Button onClick={handleExport} className="w-full sm:w-auto">
            Exportar backup
          </Button>
          <label className="flex items-center gap-2 w-full sm:w-auto cursor-pointer">
            <Button variant="outline" className="w-full sm:w-auto" aria-label="Importar backup">
              Importar backup
            </Button>
            <input
              type="file"
              accept=".json"
              disabled={importing}
              onChange={handleImport}
              className="sr-only"
            />
          </label>
        </div>

        {/* D4: aviso reforçado sobre perda de chave de criptografia. */}
        <div className="mt-6 rounded-2xl border border-status-danger/50 bg-status-danger/25 p-4">
          <div className="flex items-start gap-3">
            <ShieldAlert
              className="w-4 h-4 text-status-danger-strong shrink-0"
              aria-hidden="true"
            />
            <div>
              <p className="text-xs text-status-danger-strong font-semibold mb-1">
                se você perder a senha, perde o backup
              </p>
              <p className="text-xs text-ceci-muted leading-relaxed">
                um backup criptografado só pode ser aberto com a senha que você escolher. se
                esquecer a senha, não há como recuperar os dados — nem pelo cecistudy, nem por
                ninguém. guarde a senha num lugar seguro ou use o botão abaixo para exportar uma
                cópia sem senha.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleExport}
            className="mt-3 w-full sm:w-auto text-xs"
          >
            exportar cópia sem senha (não criptografada)
          </Button>
        </div>
      </div>
    </section>
  );
}
