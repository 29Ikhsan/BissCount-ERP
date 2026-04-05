import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface Message {
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

export const exportChatToPDF = (messages: Message[]) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(39, 156, 90); // AKSIA Green
  doc.text('AKSIA TARA', 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Riwayat Konsultasi Asisten Pajak', 14, 28);
  doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 33);
  
  doc.setLineWidth(0.5);
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 38, pageWidth - 14, 38);

  let yPos = 48;

  messages.forEach((msg, index) => {
    // Check for page overflow
    if (yPos > doc.internal.pageSize.getHeight() - 30) {
      doc.addPage();
      yPos = 20;
    }

    const roleLabel = msg.role === 'user' ? 'Anda:' : 'PajakBot:';
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(msg.role === 'user' ? 80 : 15, msg.role === 'user' ? 80 : 59, msg.role === 'user' ? 80 : 140);
    doc.text(roleLabel, 14, yPos);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    // Clean markdown before printing
    const cleanContent = msg.content
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/<br\/>/g, '\n')
      .replace(/&nbsp;/g, ' ');

    const splitText = doc.splitTextToSize(cleanContent, pageWidth - 28);
    doc.text(splitText, 14, yPos + 5);
    
    yPos += (splitText.length * 5) + 12;
  });

  // Footer Disclaimer
  const finalY = doc.internal.pageSize.getHeight() - 20;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(150, 150, 150);
  doc.text('Disclaimer: Materi ini bersifat edukasi, bukan merupakan konsultasi perpajakan resmi.', 14, finalY);
  doc.text('Dihasilkan secara otomatis oleh AKSIA TARA Intelligence.', 14, finalY + 5);

  doc.save(`Riwayat_PajakBot_${new Date().getTime()}.pdf`);
};
