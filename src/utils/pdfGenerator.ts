import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { OrderItem } from '../types';

interface DocumentData {
  nomeCliente: string;
  cpfCliente: string;
  evento: string;
  localEvento: string;
  dataEvento: string;
  formaPagamento: string;
  telefone: string;
  itens: OrderItem[];
  total: number;
}

const PRIMARY_COLOR = [139, 69, 19]; // #8B4513
const SECONDARY_COLOR = [212, 175, 55]; // #D4AF37
const TEXT_COLOR = [47, 79, 79]; // #2F4F4F
const LIGHT_BG = [245, 245, 220]; // #F5F5DC

const formatCurrency = (value: number) => {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
};

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

// Helper for image loading
const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
};

export const generateClientPDF = async (type: 'orcamento' | 'contrato', data: DocumentData): Promise<{ fileName: string, blobUrl: string }> => {
  const doc = new jsPDF();
  let y = 20;

  // Add Logo
  try {
    const img = await loadImage('https://i.imgur.com/HnA5zoC.png');
    // center image
    const imgWidth = 40;
    const imgHeight = (img.height * imgWidth) / img.width;
    doc.addImage(img, 'PNG', 105 - imgWidth / 2, y, imgWidth, imgHeight);
    y += imgHeight + 5;
  } catch (e) {
    // Fallback if image fails
    doc.setFont('times', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
    doc.text('Regina Ribas', 105, y, { align: 'center' });
    y += 10;
  }

  // Subtitle
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(160, 82, 45); // #A0522D
  doc.text('DOCES FINOS', 105, y, { align: 'center' });
  y += 5;

  // Decorative line
  doc.setDrawColor(SECONDARY_COLOR[0], SECONDARY_COLOR[1], SECONDARY_COLOR[2]);
  doc.setLineWidth(0.5);
  doc.line(60, y + 2, 150, y + 2);
  y += 15;

  // Title
  doc.setFont('times', 'bold');
  doc.setFontSize(type === 'orcamento' ? 20 : 16);
  doc.setTextColor(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
  doc.text(type === 'orcamento' ? 'ORÇAMENTO' : 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS', 105, y, { align: 'center' });
  y += 10;

  if (type === 'orcamento') {
    doc.setFont('times', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(105, 105, 105);
    doc.text('Obrigado por escolher nossos serviços de doces finos.', 105, y, { align: 'center' });
    y += 5;
    doc.text('Segue abaixo o orçamento detalhado para seu evento especial.', 105, y, { align: 'center' });
    y += 15;

    // Client Info Box
    doc.setFillColor(LIGHT_BG[0], LIGHT_BG[1], LIGHT_BG[2]);
    doc.rect(14, y, 182, 35, 'F');
    y += 8;

    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
    doc.text('DADOS DO CLIENTE', 20, y);
    y += 7;

    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
    doc.text(`Cliente: ${data.nomeCliente || 'N/A'}`, 20, y);
    doc.text(`Evento: ${data.evento || 'N/A'}`, 105, y);
    y += 6;
    doc.text(`Data: ${formatDate(data.dataEvento)}`, 20, y);
    doc.text(`Local: ${data.localEvento || 'N/A'}`, 105, y);
    y += 6;
    doc.text(`Telefone: ${data.telefone || 'N/A'}`, 20, y);
    y += 15;

  } else {
    // Contrato Specifics
    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
    doc.text('CONTRATANTE', 14, y);
    y += 6;

    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
    doc.text(`Nome: ${data.nomeCliente || 'N/A'}`, 14, y);
    y += 5;
    doc.text(`CPF: ${data.cpfCliente || 'N/A'}`, 14, y);
    y += 5;
    doc.text(`Endereço: ${data.localEvento || 'N/A'}`, 14, y);
    y += 5;
    doc.text(`Telefone: ${data.telefone || 'N/A'}`, 14, y);
    y += 10;

    doc.setFont('times', 'bold');
    doc.text('CONTRATADA', 14, y);
    y += 6;

    doc.setFont('times', 'normal');
    doc.text('Nome: Regina Ribas', 14, y);
    y += 5;
    doc.text('CPF: 515.433.547-34', 14, y);
    y += 5;
    doc.text('Endereço: Rua Madre Mary Marceline 175, Itaipu, Niterói - RJ', 14, y);
    y += 10;

    const contratoText = "Por este instrumento, as partes têm entre si, justo e contratado o que segue. A CONTRATADA é ajustada para realizar os serviços e produtos a seguir discriminados com seus respectivos valores, a serem pagos à contratada mediante emissão de recibo.";
    const lines = doc.splitTextToSize(contratoText, 182);
    doc.text(lines, 14, y);
    y += (lines.length * 5) + 5;

    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
    doc.text('DETALHES DO EVENTO', 105, y, { align: 'center' });
    y += 6;

    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
    doc.text(`Data da Cerimônia: ${formatDate(data.dataEvento)}`, 14, y);
    y += 5;
    doc.text(`Local: ${data.localEvento || 'N/A'}`, 14, y);
    y += 10;
  }

  // Table
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
  doc.text(type === 'orcamento' ? 'PRODUTOS E VALORES' : 'SERVIÇOS CONTRATADOS', 14, y);
  y += 5;

  const tableData = data.itens.map(item => [
    item.productName,
    item.quantity.toString(),
    formatCurrency(item.unitPrice),
    formatCurrency(item.total)
  ]);

  tableData.push([
    { content: 'VALOR TOTAL', colSpan: 3, styles: { halign: 'left', fontStyle: 'bold' } },
    { content: formatCurrency(data.total), styles: { fontStyle: 'bold', halign: 'right' } }
  ] as any);

  autoTable(doc, {
    startY: y,
    head: [['PRODUTO', 'QTD.', 'VALOR UNIT.', 'TOTAL']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: PRIMARY_COLOR,
      textColor: 255,
      fontStyle: 'bold',
      font: 'times'
    },
    styles: {
      font: 'times',
      textColor: TEXT_COLOR,
      fontSize: 9
    },
    alternateRowStyles: {
      fillColor: [250, 249, 246]
    },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 35, halign: 'center' },
      3: { cellWidth: 35, halign: 'right' }
    },
    didDrawPage: (dataInfo: any) => {
      y = dataInfo.cursor.y;
    }
  });

  y = (doc as any).lastAutoTable.finalY + 15;

  if (type === 'contrato') {
    if (y > 200) {
      doc.addPage();
      y = 20;
    }
    
    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
    doc.text('OBRIGAÇÕES DA CONTRATADA', 14, y);
    y += 6;

    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
    const obContratada = [
      "- Produzir e entregar os doces conforme descrito no contrato, garantindo a qualidade e apresentação dos produtos.",
      "- Cumprir os prazos acordados para produção e entrega.",
      "- Utilizar ingredientes de qualidade e seguir padrões rigorosos de higiene e manipulação de alimentos.",
      "- Manter comunicação com o Contratante sobre quaisquer ajustes necessários no pedido."
    ];
    obContratada.forEach(txt => {
      const lines = doc.splitTextToSize(txt, 182);
      doc.text(lines, 14, y);
      y += (lines.length * 4) + 1;
    });
    y += 5;

    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
    doc.text('OBRIGAÇÕES DA CONTRATANTE', 14, y);
    y += 6;

    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
    const obContratante = [
      "- Informar corretamente todos os detalhes do evento, incluindo data, horário e local de entrega dos doces.",
      "- Efetuar os pagamentos nos prazos estipulados no contrato.",
      "- Garantir a disponibilidade de um espaço adequado para a montagem e armazenamento dos doces no local do evento, quando aplicável.",
      "- Avisar a Contratada sobre qualquer alteração no evento com no mínimo 7 dias de antecedência.",
      "- Caso necessário, fornecer informações sobre possíveis restrições alimentares dos convidados."
    ];
    obContratante.forEach(txt => {
      const lines = doc.splitTextToSize(txt, 182);
      doc.text(lines, 14, y);
      y += (lines.length * 4) + 1;
    });
    y += 10;

    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text(`Forma de Pagamento: ${data.formaPagamento || 'N/A'}`, 14, y);
    y += 15;

    if (y > 220) {
      doc.addPage();
      y = 20;
    }

    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
    doc.text('ASSINATURAS', 105, y, { align: 'center' });
    y += 20;

    doc.setTextColor(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
    doc.setFont('times', 'normal');
    doc.text('____________________________________', 105, y, { align: 'center' });
    y += 5;
    doc.setFontSize(9);
    doc.text(`CONTRATANTE: ${data.nomeCliente || 'N/A'}`, 105, y, { align: 'center' });
    y += 20;

    doc.setFontSize(10);
    doc.text('____________________________________', 105, y, { align: 'center' });
    y += 5;
    doc.setFontSize(9);
    doc.text('CONTRATADA: Regina Ribas', 105, y, { align: 'center' });
    y += 15;
  }

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFont('times', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(105, 105, 105);
  doc.text('Regina Ribas Doces Finos', 105, pageHeight - 20, { align: 'center' });
  doc.text('Rua Madre Mary Marceline 175, Itaipu, Niterói - RJ', 105, pageHeight - 16, { align: 'center' });
  doc.text('Contato: (21) 98722-2302', 105, pageHeight - 12, { align: 'center' });

  const fileName = `${type === 'orcamento' ? 'Orçamento' : 'Contrato'}_${data.nomeCliente.replace(/[^a-z0-9]/gi, '_')}.pdf`;
  
  // Save it (triggers download)
  doc.save(fileName);

  // Return blob url for viewing
  const blobUrl = doc.output('bloburl').toString();

  return { fileName, blobUrl };
};
