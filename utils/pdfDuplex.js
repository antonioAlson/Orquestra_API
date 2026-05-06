import { PDFDocument } from 'pdf-lib';

/**
 * Aplica a regra de impressão frente-e-verso em um PDF de um único card.
 *
 * Regras:
 *  - A página 1 é sempre a "frente" (capa) da primeira folha.
 *  - A página 2 é sempre o "verso" da capa — deve ficar em branco.
 *  - Se o card tiver número ÍMPAR de páginas, insere uma página em branco
 *    na posição 2 (logo após a capa) e mantém o restante na ordem original.
 *  - Se o card tiver número PAR de páginas, nenhuma alteração é feita.
 *  - Nenhuma página em branco é adicionada no final.
 *
 * Resultado: o card sempre ocupa um número par de páginas, garantindo que
 * o próximo card (no merge final) comece sempre na frente de uma nova folha.
 *
 * @param {Buffer | Uint8Array} pdfBytes  Bytes do PDF original do card
 * @returns {Promise<Buffer>}             Bytes do PDF ajustado para duplex
 */
export async function prepararCardParaDuplex(pdfBytes) {
  const src = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const pageCount = src.getPageCount();

  // Número par de páginas: nenhum ajuste necessário
  if (pageCount % 2 === 0) {
    return Buffer.isBuffer(pdfBytes) ? pdfBytes : Buffer.from(pdfBytes);
  }

  // Número ímpar: constrói novo documento com página em branco na posição 2
  const out = await PDFDocument.create();

  // Posição 1: capa (frente da primeira folha)
  const [capa] = await out.copyPages(src, [0]);
  out.addPage(capa);

  // Posição 2: verso em branco (mesmas dimensões da capa)
  const { width, height } = capa.getSize();
  out.addPage([width, height]);

  // Posições 3..N: restante das páginas originais (índices 1..pageCount-1)
  if (pageCount > 1) {
    const restanteIndices = Array.from({ length: pageCount - 1 }, (_, i) => i + 1);
    const paginas = await out.copyPages(src, restanteIndices);
    paginas.forEach((p) => out.addPage(p));
  }

  return Buffer.from(await out.save());
}

/**
 * Processa múltiplos cards e gera um único PDF pronto para impressão duplex.
 *
 * Cada buffer em `cardBuffers` representa o PDF completo de um card.
 * A função aplica `prepararCardParaDuplex` em cada um antes de uni-los,
 * garantindo que nenhum conteúdo de um card "invada" o verso de outro.
 *
 * @param {Array<Buffer | Uint8Array>} cardBuffers  Um buffer por card, em ordem de impressão
 * @returns {Promise<Buffer>}                        PDF final pronto para impressão
 */
export async function mesclarCardsParaImpressao(cardBuffers) {
  const final = await PDFDocument.create();

  for (const buf of cardBuffers) {
    const duplexBytes = await prepararCardParaDuplex(buf);
    const src = await PDFDocument.load(duplexBytes, { ignoreEncryption: true });
    const paginas = await final.copyPages(src, src.getPageIndices());
    paginas.forEach((p) => final.addPage(p));
  }

  return Buffer.from(await final.save());
}
