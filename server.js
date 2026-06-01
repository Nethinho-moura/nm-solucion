function pdfAtrasados(){

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p","mm","a4");

  let y = 10;
  let agora = new Date();

  doc.setFontSize(14);
  doc.text("RELATÓRIO DE CHAVES ATRASADAS",10,y);

  y += 10;

  dados.forEach(d=>{

    let emp = new Date(d.data);
    let venc = new Date(emp.getTime()+48*60*60*1000);

    if(!d.devolvido && agora > venc){

      if(y > 260){
        doc.addPage();
        y = 10;
      }

      doc.setFontSize(9);

      doc.text(`Nome: ${d.nome}`,10,y);
      y += 5;

      doc.text(`Empresa: ${d.empresa}`,10,y);
      y += 5;

      doc.text(`Função: ${d.funcao}`,10,y);
      y += 5;

      doc.text(`Chave: ${d.chave}`,10,y);
      y += 5;

      doc.text(
        `Prazo vencido em: ${venc.toLocaleDateString()}`,
        10,
        y
      );

      y += 7;

      doc.line(10,y,200,y);

      y += 6;
    }
  });

  window.open(doc.output("bloburl"));
}
