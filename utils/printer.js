import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import axios from 'axios';

const execAsync = promisify(exec);

/**
 * Lista todas as impressoras disponíveis no Windows
 */
export async function listPrinters() {
  try {
    // PowerShell command para listar impressoras
    const command = 'powershell.exe -Command "Get-Printer | Select-Object Name, DriverName, PortName, PrinterStatus | ConvertTo-Json"';
    const { stdout } = await execAsync(command);
    
    const printers = JSON.parse(stdout);
    return Array.isArray(printers) ? printers : [printers];
  } catch (error) {
    console.error('Erro ao listar impressoras:', error);
    return [];
  }
}

/**
 * Obtém a impressora padrão do Windows
 */
export async function getDefaultPrinter() {
  try {
    const command = 'powershell.exe -Command "(Get-WmiObject -Query \\"SELECT * FROM Win32_Printer WHERE Default = True\\").Name"';
    const { stdout } = await execAsync(command);
    return stdout.trim();
  } catch (error) {
    console.error('Erro ao obter impressora padrão:', error);
    return null;
  }
}

/**
 * Imprime um PDF usando comando Windows
 * @param {Object} params
 * @param {string} params.url - URL do arquivo para download
 * @param {string} params.name - Nome do arquivo
 * @param {string} params.printer - Nome da impressora (opcional - usa padrão)
 * @param {Object} params.options - Opções de impressão
 * @param {boolean} params.options.grayscale - Preto e branco
 * @param {boolean} params.options.duplex - Frente e verso
 * @param {number} params.options.copies - Número de cópias
 */
export async function printPDF({ url, name, printer, options = {} }) {
  let tempFilePath = null;

  try {
    // 1. Download do arquivo para pasta temporária
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000
    });

    const tempDir = os.tmpdir();
    const fileName = `print_${Date.now()}_${name}`;
    tempFilePath = path.join(tempDir, fileName);

    await fs.writeFile(tempFilePath, response.data);
    console.log(`📄 Arquivo baixado: ${tempFilePath}`);

    // 2. Determinar impressora
    const printerName = printer || (await getDefaultPrinter());
    
    if (!printerName) {
      throw new Error('Nenhuma impressora padrão configurada');
    }

    console.log(`🖨️ Enviando para impressora: ${printerName}`);

    // 3. Construir comando de impressão
    // Usando PowerShell para mais controle sobre opções
    let printCommand = `Start-Process -FilePath "${tempFilePath}" -Verb Print -WindowStyle Hidden`;

    // Para PDFs, usar Adobe Reader ou sistema padrão
    // Alternativa: usar SumatraPDF ou outro leitor de linha de comando
    const { stdout, stderr } = await execAsync(`powershell.exe -Command "${printCommand}"`, {
      timeout: 60000
    });

    console.log(`✅ Impressão enviada com sucesso: ${name}`);

    // 4. Aguardar um pouco antes de deletar (impressora precisa capturar o arquivo)
    setTimeout(async () => {
      try {
        await fs.unlink(tempFilePath);
        console.log(`🗑️ Arquivo temporário removido: ${tempFilePath}`);
      } catch (err) {
        console.error('Erro ao remover arquivo temporário:', err);
      }
    }, 10000);

    return {
      success: true,
      printer: printerName,
      file: name,
      options
    };

  } catch (error) {
    // Limpar arquivo temporário em caso de erro
    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath);
      } catch (err) {
        // Ignorar erro de limpeza
      }
    }

    throw error;
  }
}

/**
 * Imprime um PDF com mais controle usando ferramentas de linha de comando
 * Requer SumatraPDF instalado
 */
export async function printPDFAdvanced({ url, name, printer, options = {} }) {
  let tempFilePath = null;

  try {
    // Download do arquivo
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000
    });

    const tempDir = os.tmpdir();
    const fileName = `print_${Date.now()}_${name}`;
    tempFilePath = path.join(tempDir, fileName);

    await fs.writeFile(tempFilePath, response.data);

    // Determinar impressora
    const printerName = printer || (await getDefaultPrinter());
    
    if (!printerName) {
      throw new Error('Nenhuma impressora padrão configurada');
    }

    // Verificar se SumatraPDF está instalado
    const sumatraPath = 'C:\\Program Files\\SumatraPDF\\SumatraPDF.exe';
    
    try {
      await fs.access(sumatraPath);
      
      // Construir comando SumatraPDF
      let command = `"${sumatraPath}" -print-to "${printerName}"`;
      
      if (options.grayscale) {
        command += ' -print-settings "monochrome"';
      }
      
      if (options.duplex) {
        command += ' -print-settings "duplex"';
      }
      
      command += ` "${tempFilePath}"`;

      await execAsync(command, { timeout: 60000 });
      
      console.log(`✅ Impressão enviada via SumatraPDF: ${name}`);
    } catch (err) {
      // SumatraPDF não disponível, usar método padrão
      console.warn('SumatraPDF não encontrado, usando método padrão');
      return await printPDF({ url, name, printer, options });
    }

    // Limpar arquivo temporário após delay
    setTimeout(async () => {
      try {
        await fs.unlink(tempFilePath);
      } catch (err) {
        console.error('Erro ao remover arquivo temporário:', err);
      }
    }, 10000);

    return {
      success: true,
      printer: printerName,
      file: name,
      options
    };

  } catch (error) {
    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath);
      } catch (err) {
        // Ignorar
      }
    }
    throw error;
  }
}
