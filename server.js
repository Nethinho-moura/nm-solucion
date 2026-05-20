function pdfGeral(){
  const { jsPDF } = window.jspdf;
  const doc=new jsPDF();

  let y=10;

  doc.setFontSize(10);
  doc.text("RELATÓRIO GERAL",10,y); 
  y+=8;

  doc.setFontSize(6);

  // cabeçalho
  doc.text("Nome",10,y);
  doc.text("Empresa",50,y);
  doc.text("Função",90,y);
  doc.text("Crachá",120,y);
  doc.text("Chave",145,y);
  doc.text("Entrega",165,y);
  doc.text("Venc",185,y);

  y+=3;
  doc.line(10,y,200,y);
  y+=4;

  dados.forEach(d=>{

    let emp=new Date(d.data);
    let venc=new Date(emp.getTime()+48*60*60*1000);

    // ✅ QUEBRA AUTOMÁTICA DA CHAVE
    let chave = doc.splitTextToSize(d.chave || "", 18);

    let altura = chave.length * 3; // altura dinâmica

    doc.text((d.nome||"").substring(0,25),10,y);
    doc.text((d.empresa||"").substring(0,18),50,y);
    doc.text((d.funcao||"").substring(0,15),90,y);
    doc.text(d.cracha||"",120,y);

    // ✅ escreve chave em MULTILINHA
    doc.text(chave,145,y);

    doc.text(emp.toLocaleDateString(),165,y);
    doc.text(venc.toLocaleDateString(),185,y);

    y += Math.max(altura,4);

    doc.line(10,y,200,y);
    y+=3;

    if(y>280){
      doc.addPage();
      y=10;
    }

  });

  window.open(doc.output("bloburl"));
}
