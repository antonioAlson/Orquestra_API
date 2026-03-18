import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JiraService } from '../../services/jira.service';
import { finalize, take, timeout } from 'rxjs/operators';

@Component({
  selector: 'app-ordens-producao',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ordens-producao.component.html',
  styleUrl: './ordens-producao.component.scss'
})
export class OrdensProducaoComponent implements OnInit {
  showReprogramModal = false;
  idsInput = '';
  dateInput = '';
  isProcessing = false;
  resultMessage = '';
  resultType: 'success' | 'error' | '' = '';
  dateIsValid = true;
  parsedIdsCount = 0;
  private readonly feedbackDelayMs = 3000;
  private readonly requestTimeoutMs = 120000; // 2 minutos para operações longas
  private processingGuardTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private jiraService: JiraService) {}

  ngOnInit(): void {
  }

  openRoutine(routineName: string): void {
    console.log('Abrindo rotina:', routineName);
    
    if (routineName === 'reprogramar-massa') {
      this.openReprogramModal();
    } else {
      // TODO: Implementar outras rotinas
      alert(`Rotina "${routineName}" em desenvolvimento`);
    }
  }

  openReprogramModal(): void {
    this.showReprogramModal = true;
    this.idsInput = '';
    this.dateInput = '';
    this.resultMessage = '';
    this.resultType = '';
    this.dateIsValid = true;
    this.parsedIdsCount = 0;
  }

  closeReprogramModal(): void {
    this.showReprogramModal = false;
    this.isProcessing = false;
    this.clearProcessingGuard();
  }

  private startProcessingGuard(): void {
    this.clearProcessingGuard();
    const guardTimeout = this.requestTimeoutMs + 10000; // 10s após o timeout da requisição
    console.log(`⏰ Watchdog iniciado: ${guardTimeout / 1000}s`);
    
    this.processingGuardTimer = setTimeout(() => {
      if (!this.isProcessing) {
        console.log('✅ Watchdog: operação já finalizada');
        return;
      }

      console.log('⚠️ Watchdog: forçando parada do loading');
      this.isProcessing = false;
      this.resultType = 'error';
      this.resultMessage = 'A operação demorou mais do que o esperado. Verifique no Jira se as alterações foram aplicadas e tente novamente se necessário.';
    }, guardTimeout);
  }

  private clearProcessingGuard(): void {
    if (this.processingGuardTimer) {
      clearTimeout(this.processingGuardTimer);
      this.processingGuardTimer = null;
    }
  }

  private scheduleResetAfterFeedback(): void {
    setTimeout(() => {
      this.closeReprogramModal();
      this.idsInput = '';
      this.dateInput = '';
      this.resultMessage = '';
      this.resultType = '';
    }, this.feedbackDelayMs);
  }

  /**
   * Atualiza contador de IDs detectados
   */
  onIdsInput(): void {
    const ids = this.parseIds(this.idsInput);
    this.parsedIdsCount = ids.length;
  }

  /**
   * Aplica máscara de data DD/MM/AAAA enquanto o usuário digita
   */
  onDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, ''); // Remove tudo que não é número
    
    // Aplicar máscara DD/MM/AAAA
    if (value.length > 0) {
      if (value.length <= 2) {
        value = value;
      } else if (value.length <= 4) {
        value = value.slice(0, 2) + '/' + value.slice(2);
      } else {
        value = value.slice(0, 2) + '/' + value.slice(2, 4) + '/' + value.slice(4, 8);
      }
    }
    
    this.dateInput = value;

    input.value = value;
    
    // Validar data se estiver completa
    if (value.length === 10) {
      // Permitir 00/00/0000 como comando para limpar no envio
      this.dateIsValid = value === '00/00/0000' || this.isValidDate(value);
    } else {
      this.dateIsValid = true; // Não marcar erro enquanto digita
    }
  }

  /**
   * Valida se a data está no formato correto e é uma data válida
   */
  private isValidDate(dateStr: string): boolean {
    const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return false;
    
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);
    
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    if (year < 2000 || year > 2100) return false;
    
    // Verificar dias válidos por mês
    const daysInMonth = new Date(year, month, 0).getDate();
    return day <= daysInMonth;
  }

  parseIds(rawInput: string): string[] {
    if (!rawInput) return [];
    
    // Separar por vírgula, ponto e vírgula, espaço ou quebra de linha
    return rawInput
      .split(/[,;\s\n]+/)
      .map(id => id.trim())
      .filter(id => id.length > 0);
  }

  normalizeDate(rawDate: string): string | null {
    if (!rawDate) return null;

    const cleaned = rawDate.trim();
    
    // Tentar diferentes formatos (priorizar DD/MM/YYYY da máscara)
    const formats = [
      { regex: /^(\d{2})\/(\d{2})\/(\d{4})$/, format: (m: RegExpMatchArray) => `${m[3]}-${m[2]}-${m[1]}` }, // DD/MM/YYYY
      { regex: /^(\d{4})-(\d{2})-(\d{2})$/, format: (m: RegExpMatchArray) => `${m[1]}-${m[2]}-${m[3]}` }, // YYYY-MM-DD
      { regex: /^(\d{2})-(\d{2})-(\d{4})$/, format: (m: RegExpMatchArray) => `${m[3]}-${m[2]}-${m[1]}` }  // DD-MM-YYYY
    ];

    for (const fmt of formats) {
      const match = cleaned.match(fmt.regex);
      if (match) {
        return fmt.format(match);
      }
    }

    return null;
  }

  canReprogramWithDate(): boolean {
    const trimmedDate = this.dateInput.trim();

    // Reprogramar só com data preenchida, completa e válida
    if (!trimmedDate || trimmedDate === '00/00/0000') {
      return false;
    }

    return this.dateIsValid && trimmedDate.length === 10;
  }

  removerDatas(): void {
    this.dateInput = '00/00/0000';
    this.dateIsValid = true;
    this.reprogramar(true);
  }

  reprogramar(forceRemoveDates = false): void {
    console.log('🚀 Iniciando reprogramação...');
    
    // Parse IDs
    const ids = this.parseIds(this.idsInput);
    if (ids.length === 0) {
      this.resultType = 'error';
      this.resultMessage = 'Por favor, informe pelo menos um ID';
      return;
    }

    const isRemovingDates = forceRemoveDates || this.dateInput.trim() === '00/00/0000';

    // Normalize date (permitir vazio para limpar o campo)
    let date: string | null = null;
    if (this.dateInput && this.dateInput.trim().length > 0) {
      const cleanedDateInput = this.dateInput.trim();

      // 00/00/0000 significa limpar a data no Jira
      if (isRemovingDates || cleanedDateInput === '00/00/0000') {
        date = null;
      } else {
        date = this.normalizeDate(cleanedDateInput);
        if (!date) {
          this.resultType = 'error';
          this.resultMessage = 'Data inválida. Use YYYY-MM-DD, DD/MM/YYYY ou DD-MM-YYYY';
          return;
        }
      }
    }

    this.isProcessing = true;
    this.resultMessage = isRemovingDates
      ? `Removendo data de ${ids.length} ${ids.length === 1 ? 'card' : 'cards'}... Aguarde.`
      : `Processando ${ids.length} ${ids.length === 1 ? 'card' : 'cards'}... Aguarde.`;
    this.resultType = '';
    this.startProcessingGuard();

    console.log('📡 Enviando requisição para backend...');
    console.log('⏱️ Timeout configurado:', this.requestTimeoutMs / 1000, 'segundos');
    
    this.jiraService.reprogramarEmMassa(ids, date)
      .pipe(
        timeout(this.requestTimeoutMs),
        take(1),
        finalize(() => {
          console.log('🏁 Finalize executado - parando loading');
          this.isProcessing = false;
          this.clearProcessingGuard();
        })
      )
      .subscribe({
        next: (response) => {
          console.log('✅ Resposta completa recebida:', JSON.stringify(response, null, 2));
          console.log('✅ Response type:', typeof response);
          console.log('✅ Response.success:', response?.success);

          if (response?.success) {
            this.resultType = 'success';
            this.resultMessage = response.message || 'Reprogramação concluída com sucesso.';

            if (response.data) {
              const { successCount, errorCount, total } = response.data;
              this.resultMessage += `\n\nTotal: ${total} | Sucesso: ${successCount} | Erros: ${errorCount}`;
            }
          } else {
            this.resultType = 'error';
            this.resultMessage = response?.message || 'Erro ao reprogramar';
          }

          this.scheduleResetAfterFeedback();
        },
        error: (error) => {
          console.error('❌ Erro capturado:', error);
          console.error('❌ Error name:', error?.name);
          console.error('❌ Error message:', error?.message);
          this.resultType = 'error';

          if (error?.name === 'TimeoutError') {
            console.error('⏱️ TIMEOUT: Operação excedeu', this.requestTimeoutMs / 1000, 'segundos');
            this.resultMessage = `Tempo limite excedido (${this.requestTimeoutMs / 1000}s). A operação pode ainda estar em andamento no servidor. Verifique o Jira.`;
          } else if (error?.status === 0) {
            console.error('🔌 CONEXÃO: Sem resposta do servidor');
            this.resultMessage = 'Não foi possível conectar ao servidor. Verifique sua conexão.';
          } else {
            this.resultMessage = error.error?.message || error?.message || 'Erro ao conectar com o servidor';
          }

          this.scheduleResetAfterFeedback();
        }
      });
  }
}
