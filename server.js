import express from "express";

const app = express();

app.get("/", (req, res) => {
res.send(`
<!DOCTYPE html>
<html lang="pt-br">
<head>
<meta charset="UTF-8">
<title>NM SOLUCION</title>

<!-- ✅ SUPABASE -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- PDF -->
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

header {
  background:#0b3c5d;
  color:white;
  padding:10px;
  text-align:center;
}

.container {
  padding:20px;
  background:#eef2f7;
  min-height:100vh;
}

.card {
  background:white;
  padding:15px;
  border-radius:8px;
  margin-bottom:15px;
}

.form-grid {
  display:grid;
  grid-template-columns: repeat(auto-fit, minmax(180px,1fr));
  gap:10px;
}

input, select, button {
  padding:8px;
  width:100%;
}

button {
  background:#0b3c5d;
  color:white;
  border:none;
  cursor:pointer;
}

button:hover {
  background:#155a87;
}

table {
  width:100%;
  border-collapse: collapse;
}

th, td {
  border:1px solid #ccc;
  padding:8px;
}

th {
  background:#0b3c5d;
  color:white;
}

tr:hover {
  background:#dfe9f3;
}
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
  <div class="form-grid">
    <input id="nome" placeholder="Nome">
    <input id="empresa" placeholder="Empresa">
    <input id="funcao" placeholder="Função">
    <input id="chave" placeholder="Chave / Apartamento">
    <select id="motivo">
      <option value="">Motivo</option>
      <option>Perda</option>
      <option>Serviço</option>
    </select>
  </div>
  <br>
  <button onclick="emprestar()">Emprestar</button>
</div>

<div class="card">
  <button onclick="pdfAtrasados()">PDF Atrasados</button>
  <button onclick="pdfGeral()">PDF Geral</button>
</div>

<div class="card">
  <button onclick="backup()">💾 Fazer Backup</button>
  <input type="file" onchange="restaurar(event)">
</div>

<div class="card">
<table>
<thead>
<tr>
<th>Nome</th>
<th>Empresa</th>
<th>Função</th>
<th>Chave</th>
<th>Status</th>
<th>Ações</th>
</tr>
</thead>
<tbody id="tabela"></tbody>
</table>
</div>

</div>
</div>

<script>

// ✅ 🔥 SUA CONEXÃO SUPABASE
const supabase = supabase.createClient(
  "https://aorhhnlktnmwyknxmyyzo.supabase.co",
  "COLE_AQUI_SUA_publishable_key"
);

const SENHA_LOGIN = "NMDIGITAL";
const SENHA_EXCLUIR = "2805";

let dados = [];

// LOGIN
function entrar(){
  if(senhaLogin.value===SENHA_LOGIN){
    login.style.display="none";
    sistema.style.display="block";
    carregar();
  }
}

// CARREGAR
async function carregar(){
  const { data } = await supabase.from("chaves").select("*");
  dados = data || [];
  render();
}

// EMPRESTAR
async function emprestar(){
  if(!nome.value || !empresa.value || !funcao.value || !chave.value || !motivo.value){
    alert("Preencha tudo");
    return;
  }

  await supabase.from("chaves").insert([{
    nome:nome.value,
    empresa:empresa.value,
    funcao:funcao.value,
    chave:chave.value,
    motivo:motivo.value,
    data:new Date(),
    devolvido:false
  }]);

  nome.value="";
  empresa.value="";
  funcao.value="";
  chave.value="";
  motivo.value="";

  carregar();
}

// DEVOLVER
async function devolver(id){
  await supabase.from("chaves")
    .update({devolvido:true})
    .eq("id",id);

  carregar();
}

// EXCLUIR
async function excluir(id){
  let senha=prompt("Senha:");
  if(senha===SENHA_EXCLUIR){
    await supabase.from("chaves")
      .delete()
      .eq("id",id);

    carregar();
  }
}

// FORMATA DATA
function formatarData(d){
  return new Date(d).toLocaleDateString("pt-BR");
}

// RENDER
function render(){
  tabela.innerHTML="";
  let agora = new Date();

  dados.forEach((d)=>{
    let data = new Date(d.data);
    let prazo = new Date(data.getTime()+48*60*60*1000);

    let status="", cor="";

    if(d.devolvido){
      status="DEVOLVIDO";
      cor="gray";
    } else if(agora>prazo){
      status="VENCIDO";
      cor="red";
    } else {
      status="EM DIA";
      cor="green";
    }

    tabela.innerHTML += \`
    <tr>
      <td>\${d.nome}</td>
      <td>\${d.empresa}</td>
      <td>\${d.funcao}</td>
      <td>\${d.chave}</td>
      <td style="color:\${cor}; font-weight:bold;">\${status}</td>
      <td>
        \${!d.devolvido ? '<button onclick="devolver('+d.id+')">Devolver</button>' : ""}
        <button onclick="excluir(\${d.id})">Excluir</button>
      </td>
    </tr>\`;
  });
}

// BACKUP
function backup(){
  const blob = new Blob([JSON.stringify(dados, null, 2)], {type:"application/json"});
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "backup_nm_solucion.json";
  link.click();
}

// RESTAURAR
function restaurar(event){
  const file = event.target.files[0];
  if(!file) return;

  const reader = new FileReader();
  reader.onload = async e=>{
    let lista = JSON.parse(e.target.result);

    for(let item of lista){
      delete item.id;
      await supabase.from("chaves").insert([item]);
    }

    alert("Backup restaurado!");
    carregar();
  };

  reader.readAsText(file);
}

// PDFS (igual ao seu)
function pdfGeral(){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y=10;

  doc.text("RELATÓRIO GERAL",10,y);
  y+=10;

  dados.forEach(d=>{
    let emp=new Date(d.data);
    let venc=new Date(emp.getTime()+48*60*60*1000);

    doc.text("------------------------------------------------",10,y); y+=5;

    doc.text(
      d.nome+" | Empresa: "+d.empresa+" | Função: "+d.funcao+" | Chave: "+d.chave+" | Motivo: "+d.motivo,
      10,y
    );

    y+=6;

    doc.text(
      "Emprestado: "+formatarData(emp)+" | Vence: "+formatarData(venc),
      10,y
    );

    y+=10;
  });

  window.open(doc.output("bloburl"));
}

function pdfAtrasados(){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y=10;
  let agora=new Date();

  doc.text("ATRASADOS",10,y);
  y+=10;

  dados.forEach(d=>{
    let emp=new Date(d.data);
    let venc=new Date(emp.getTime()+48*60*60*1000);

    if(!d.devolvido && agora>venc){

      doc.text("------------------------------------------------",10,y); y+=5;

      doc.text(
        d.nome+" | Empresa: "+d.empresa+" | Função: "+d.funcao+" | Chave: "+d.chave,
        10,y
      );

      y+=10;
    }
  });

  window.open(doc.output("bloburl"));
}

</script>

</body>
</html>
`);
});

app.listen(process.env.PORT || 3000);
``
