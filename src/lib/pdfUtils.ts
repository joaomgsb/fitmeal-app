import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { pdf } from '@react-pdf/renderer';

// Detecta se está rodando no ambiente móvel do Capacitor
export const isMobile = Capacitor.isNativePlatform();

// Função auxiliar para converter ArrayBuffer para base64 (funciona com arquivos grandes)
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 8192; // Processar em chunks para evitar estouro de pilha
  let binary = '';
  
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return btoa(binary);
};

// Função alternativa usando FileReader (mais compatível)
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      // Remove o prefixo "data:application/pdf;base64,"
      const base64 = dataUrl.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Função para gerar PDF como blob
export const generatePDFBlob = async (document: React.ReactElement): Promise<Blob> => {
  const pdfBytes = await pdf(document).toBlob();
  return pdfBytes;
};

// Função para salvar PDF no dispositivo móvel
export const savePDFToDevice = async (
  document: React.ReactElement,
  fileName: string
): Promise<void> => {
  try {
    console.log('📄 Iniciando geração do PDF...');
    
    // Gerar o PDF como blob
    const pdfBlob = await generatePDFBlob(document);
    console.log('✅ PDF blob gerado, tamanho:', pdfBlob.size);
    
    // Converter blob para base64 usando FileReader (mais seguro para Android)
    let base64Data: string;
    try {
      base64Data = await blobToBase64(pdfBlob);
      console.log('✅ Conversão base64 concluída');
    } catch (conversionError) {
      console.log('⚠️ FileReader falhou, tentando método alternativo...');
      // Fallback para o método de chunks
      const arrayBuffer = await pdfBlob.arrayBuffer();
      base64Data = arrayBufferToBase64(arrayBuffer);
    }
    
    // Usar diretório Cache no Android (mais confiável para compartilhamento)
    const directory = Capacitor.getPlatform() === 'android' 
      ? Directory.Cache 
      : Directory.Documents;
    
    // Salvar no filesystem do dispositivo
    const result = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: directory,
      recursive: true
    });
    
    console.log('✅ PDF salvo em:', result.uri);
    
    // Compartilhar o arquivo
    await Share.share({
      title: 'Plano Alimentar FitMeal',
      text: 'Confira seu plano alimentar personalizado!',
      url: result.uri,
      dialogTitle: 'Compartilhar ou salvar PDF'
    });
    
    console.log('✅ Compartilhamento aberto com sucesso');
    
  } catch (error) {
    console.error('❌ Erro ao salvar PDF:', error);
    throw error;
  }
};

// Função principal para exportar PDF
export const exportPDF = async (
  document: React.ReactElement,
  fileName: string
): Promise<void> => {
  if (isMobile) {
    // No ambiente móvel, salvar no dispositivo e compartilhar
    await savePDFToDevice(document, fileName);
  } else {
    // No web, usar o comportamento padrão do PDFDownloadLink
    // Esta função será chamada apenas como fallback no web
    console.log('No ambiente web, use PDFDownloadLink diretamente');
  }
}; 