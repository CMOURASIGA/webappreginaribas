import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Product } from '../types';

type ProductCategories = Record<string, Product[]>;

const PRIMARY: [number, number, number] = [117, 64, 25];
const GOLD: [number, number, number] = [212, 175, 55];
const CREAM: [number, number, number] = [250, 248, 242];
const LOGO_URL = 'https://i.imgur.com/HnA5zoC.png';

const loadImage = (url: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.onload = () => resolve(image);
  image.onerror = reject;
  image.src = url;
});

const money = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;

export const generatePriceTablePDF = async (categories: ProductCategories) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let headerBottom = 37;

  try {
    const logo = await loadImage(LOGO_URL);
    const width = 36;
    const height = Math.min((logo.height * width) / logo.width, 22);
    doc.addImage(logo, 'PNG', 15, 10, width, height);
    headerBottom = Math.max(headerBottom, 13 + height);
  } catch {
    doc.setFont('times', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(...PRIMARY);
    doc.text('Regina Ribas', 15, 20);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...PRIMARY);
  doc.text('TABELA DE PREÇOS', 195, 18, { align: 'right' });
  doc.setFontSize(9);
  doc.setTextColor(90, 90, 90);
  doc.text('DOCES FINOS', 195, 24, { align: 'right' });
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.7);
  doc.line(15, headerBottom, 195, headerBottom);

  let y = headerBottom + 7;
  Object.entries(categories).forEach(([category, products]) => {
    const estimatedHeight = 10 + products.length * 6;
    if (y + estimatedHeight > 275) {
      doc.addPage();
      y = 18;
    }

    doc.setFillColor(...PRIMARY);
    doc.roundedRect(15, y, 180, 8, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(category.toUpperCase(), 19, y + 5.4);
    y += 9;

    autoTable(doc, {
      startY: y,
      body: products.map(product => [product.name, money(product.price)]),
      theme: 'plain',
      margin: { left: 17, right: 17 },
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 1.5, textColor: [45, 45, 45] },
      alternateRowStyles: { fillColor: CREAM },
      columnStyles: { 0: { cellWidth: 135 }, 1: { cellWidth: 40, halign: 'right', fontStyle: 'bold', textColor: PRIMARY } }
    });
    y = (doc as any).lastAutoTable.finalY + 5;
  });

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(...GOLD);
    doc.line(15, 282, 195, 282);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(90, 90, 90);
    doc.text('Valores correspondentes à unidade dos doces.', 15, 287);
    doc.text('Pedidos: (21) 96648-6222', 105, 287, { align: 'center' });
    doc.text(`${page}/${pages}`, 195, 287, { align: 'right' });
  }

  return { blob: doc.output('blob'), fileName: 'Tabela_de_Precos_Regina_Ribas.pdf' };
};
