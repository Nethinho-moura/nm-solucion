// PDF GERAL (MELHORADO COM TABELA)
function pdfGeral(){
  const { jsPDF } = window.jspdf;
  const doc=new jsPDF();

  let y=10;

  doc.setFontSize(12);
  doc.text("RELATÓRIO GERAL",10,y);
  y+=8;

  doc.setFontSize(7);

  // Cabeçalho
  doc.rect(10,y,190,8);
  doc.text("Nome",12,y+5);
  doc.text("Empresa",55,y+5);
  doc.text("Função",90,y+5);
  doc.text("Chave",140,y+5);

  y+=8;

  dados.forEach(d=>{
    let emp=new Date(d.data);
    let venc=new Date(emp.getTime()+48*60*60*1000);

    // Linha principal
    doc.rect(10,y,190,10);

    doc.text(d.nome,12,y+4);
    doc.text(d.empresa,55,y+4);
    doc.text(d.funcao,90,y+4);
    doc.text(d.chave,140,y+4);

    // Linha de datas
    doc.text(
      "Emp: "+emp.toLocaleDateString("pt-BR")+
      " | Venc: "+venc.toLocaleDateString("pt-BR"),
      12,y+8
    );

    y+=12;

    // quebra de página automática
    if(y>270){
      doc.addPage();
      y=10;
    }
  });

  window.open(doc.output("bloburl"));
}


// ATRASADOS (COM DATAS CORRIGIDO)
function pdfAtrasados(){
  const { jsPDF } = window.jspdf;
  const doc=new jsPDF();

  let y=10;
  let agora=new Date();

  doc.setFontSize(12);
  doc.text("RELATÓRIO DE ATRASADOS",10,y);
  y+=10;

  doc.setFontSize(8);

  dados.forEach(d=>{
    let emp=new Date(d.data);
    let venc=new Date(emp.getTime()+48*60*60*1000);

    if(!d.devolvido && agora>venc){

      doc.text("Nome: "+d.nome,10,y); y+=5;
      doc.text("Chave: "+d.chave,10,y); y+=5;
      doc.text("Empresa: "+d.empresa,10,y); y+=5;

      // ✅ AGORA COM DATAS
      doc.text(
        "Emp: "+emp.toLocaleDateString("pt-BR")+
        " | Venc: "+venc.toLocaleDateString("pt-BR"),
        10,y
      );

      y+=8;

      doc.line(10,y,200,y);
      y+=5;

      if(y>270){
        doc.addPage();
        y=10;
      }
    }
  });

  window.open(doc.output("bloburl"));
}
