import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="pt-br">
<head>
<meta charset="UTF-8">
<title>NM SOLUCION - Controle de Chaves</title>

<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>

<style>
body {
  font-family: Arial;
  background: linear-gradient(135deg, #0b3c5d, #1f6fa5);
  margin: 0;
}
#login {
  width: 300px;
  margin: 120px auto;
  background: white;
  padding: 20px;
  text-align: center;
}
header { background:#0b3c5d; color:white; padding:10px; text-align:center; }
.container { padding:20px; background:#eef2f7; min-height:100vh; }
.card { background:white; padding:10px; margin-bottom:10px; }
input, select, button { width:100%; padding:8px; margin:3px 0; }
button { background:#0b3c5d; color:white; border:none; cursor:pointer; }
table { width:100%; border-collapse:collapse; }
td, th { border:1px solid #ccc; padding:5px; }
</style>
</head>

<body>

<div id="login">
  <h2>NM SOLUCION</h2>
  <input type="password" id="senhaLogin" placeholder="Senha">
  <button onclick="entrar()">Entrar</button>
</div>

<div id="sistema" style="display:none;">
<header><h2>Controle de Chaves</h2></header>

<div class="container">

<div class="card">
<input id="nome" placeholder="Nome">
<input id="empresa" placeholder="Empresa">
<input id="funcao" placeholder="Função">
<input id="chave" placeholder="Chave">
<select id="motivo">
<option value="">Motivo</option>
<option>Perda</option>
<option>Serviço</option>
</select>
<button onclick="emprestar()">Emprestar</button>
</div>

<div class="card">
<button onclick="pdfAtrasados()">PDF Atrasados</button>
<button onclick="pdfGeral()">PDF Geral</button>
</div>

<div class="card">
<table>
<thead>
<tr>
<th>Nome</th><th>Chave</th><th>Status</th><th>Ação</th>
</tr>
</thead>
<tbody id="tabela"></tbody>
</table>
</div>

</div>
</div>

<script>
const SENHA_LOGIN = "NMDIGITAL";
let dados = JSON.parse(localStorage.getItem("dados")||"[]");

function entrar(){
  if(senhaLogin.value==="NMDIGITAL"){
    login.style.display="none";
    sistema.style.display="block";
    render();
  } else {
    alert("Senha errada");
  }
}

function salvar(){
  localStorage.setItem("dados", JSON.stringify(dados));
  render();
}

function emprestar(){
  if(!nome.value || !chave.value) return alert("Preencha");

  dados.push({
    nome:nome.value,
    chave:chave.value,
    data:new Date(),
    devolvido:false
  });

  nome.value = chave.value = "";
  salvar();
}

function devolver(i){
  dados[i].devolvido=true;
  salvar();
}

function formatarData(data){
  return new Date(data).toLocaleDateString("pt-BR");
}

function render(){
  tabela.innerHTML="";
  let agora = new Date();

  dados.forEach((d,i)=>{
    let prazo = new Date(new Date(d.data).getTime() + 48*60*60*1000);
    let status = d.devolvido ? "DEVOLVIDO" : (agora > prazo ? "VENCIDO" : "EM DIA");

    tabela.innerHTML += \`
    <tr>
      <td>\${d.nome}</td>
      <td>\${d.chave}</td>
      <td>\${status}</td>
      <td><button onclick="devolver(\${i})">OK</button></td>
    </tr>\`;
  });
}

function pdfGeral(){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y=10;

  doc.text("RELATÓRIO GERAL",10,y);
  y += 10;

  dados.forEach(d=>{
    let emp = new Date(d.data);
    let venc = new Date(emp.getTime()+48*60*60*1000);

    doc.text(
      d.nome + " | " + d.chave +
      " | Emprestado: " + formatarData(emp) +
      " | Vence: " + formatarData(venc),
      10,y
    );
    y += 6;
  });

  window.open(doc.output("bloburl"));
}

function pdfAtrasados(){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y=10;
  let agora = new Date();

  doc.text("ATRASADOS",10,y);
  y += 10;

  dados.forEach(d=>{
    let emp = new Date(d.data);
    let venc = new Date(emp.getTime()+48*60*60*1000);

    if(!d.devolvido && agora > venc){
      doc.text(
        d.nome + " | " + d.chave +
        " | Emprestado: " + formatarData(emp) +
        " | Vence: " + formatarData(venc),
        10,y
      );
      y += 6;
    }
  });

  window.open(doc.output("bloburl"));
}
</script>

</body>
</html>
`);
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Servidor rodando");
});
