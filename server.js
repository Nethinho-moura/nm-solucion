// PDF GERAL MELHORADO
function pdfGeral(){

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let y = 15;

  doc.setFontSize(16);
  doc.setFont(undefined,"bold");
  doc.text("RELATÓRIO GERAL", 10, y);

  y += 12;

  dados.forEach((d,index)=>{

    let emp = new Date(d.data);
    let venc = new Date(emp.getTime()+48*60*60*1000);

    // caixa externa
    doc.rect(10,y,190,28);

    // TITULOS
    doc.setFontSize(8);
    doc.setFont(undefined,"bold");

    doc.text("NOME",12,y+5);
    doc.text("EMPRESA",60,y+5);
    doc.text("FUNÇÃO",100,y+5);
    doc.text("CHAVE",155,y+5);

    // LINHA TITULOS
    doc.line(10,y+7,200,y+7);

    // DADOS
    doc.setFont(undefined,"normal");
    doc.setFontSize(10);

    doc.text(String(d.nome || ""),12,y+14);

    doc.text(String(d.empresa || ""),60,y+14);

    // função com quebra automática
    const funcao = doc.splitTextToSize(
      String(d.funcao || ""),
      45
    );
    doc.text(funcao,100,y+14);

    // chave com quebra
    const chave = doc.splitTextToSize(
      String(d.chave || ""),
      38
    );
    doc.text(chave,155,y+14);

    // linha inferior
    doc.setFontSize(8);

    doc.text(
      "Emp: "+emp.toLocaleDateString()+
      "   |   Venc: "+venc.toLocaleDateString(),
      12,
      y+24
    );

    y += 35;

    // nova página
    if(y > 260){
      doc.addPage();
      y = 15;
    }

  });

  window.open(doc.output("bloburl"));
}






// PDF ATRASADOS MELHORADO
function pdfAtrasados(){

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let y = 15;
  let agora = new Date();

  doc.setFontSize(16);
  doc.setFont(undefined,"bold");
  doc.text("RELATÓRIO DE ATRASADOS", 10, y);

  y += 12;

  dados.forEach((d)=>{

    let emp = new Date(d.data);
    let venc = new Date(emp.getTime()+48*60*60*1000);

    // apenas atrasados
    if(!d.devolvido && agora > venc){

      // caixa
      doc.rect(10,y,190,28);

      // TITULOS
      doc.setFontSize(8);
      doc.setFont(undefined,"bold");

      doc.text("NOME",12,y+5);
      doc.text("EMPRESA",60,y+5);
      doc.text("FUNÇÃO",100,y+5);
      doc.text("CHAVE",155,y+5);

      // linha
      doc.line(10,y+7,200,y+7);

      // DADOS
      doc.setFont(undefined,"normal");
      doc.setFontSize(10);

      doc.text(String(d.nome || ""),12,y+14);

      doc.text(String(d.empresa || ""),60,y+14);

      const funcao = doc.splitTextToSize(
        String(d.funcao || ""),
        45
      );
      doc.text(funcao,100,y+14);

      const chave = doc.splitTextToSize(
        String(d.chave || ""),
        38
      );
      doc.text(chave,155,y+14);

      // DATAS
      doc.setFontSize(8);

      doc.text(
        "Emp: "+emp.toLocaleDateString()+
        "   |   Venc: "+venc.toLocaleDateString(),
        12,
        y+24
      );

      y += 35;

      // quebra página
      if(y > 260){
        doc.addPage();
        y = 15;
      }

    }

  });

  window.open(doc.output("bloburl"));
}
