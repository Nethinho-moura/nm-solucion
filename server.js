import express from "express";
import pkg from "pg";
const { Pool } = pkg;

const app = express();
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ✅ BANCO
(async ()=>{
  await pool.query(`
    CREATE TABLE IF NOT EXISTS chaves (
      id SERIAL PRIMARY KEY,
      nome TEXT,
      empresa TEXT,
      funcao TEXT,
      cracha TEXT,
      chave TEXT,
      motivo TEXT,
      data TIMESTAMP,
      devolvido BOOLEAN
    )
  `);
})();

// ✅ API
app.get("/dados", async (req,res)=>{
  const r = await pool.query("SELECT * FROM chaves ORDER BY id DESC");
  res.json(r.rows);
});

app.post("/dados", async (req,res)=>{
  const d=req.body;

  await pool.query(
    "INSERT INTO chaves (nome,empresa,funcao,cracha,chave,motivo,data,devolvido) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
    [d.nome,d.empresa,d.funcao,d.cracha,d.chave,d.motivo,new Date(),false]
  );

  res.sendStatus(200);
});

app.put("/dados/:id", async (req,res)=>{
  await pool.query("UPDATE chaves SET devolvido=true WHERE id=$1",[req.params.id]);
  res.sendStatus(200);
});

app.delete("/dados/:id", async (req,res)=>{
  await pool.query("DELETE FROM chaves WHERE id=$1",[req.params.id]);
  res.sendStatus(200);
});

// ✅ FRONT
app.get("/", (req,res)=>res.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">

<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>

<style>
body {font-family:Arial;margin:0;background:#eef2f7;}

header{
  background:#0b3c5d;
  color:white;
  padding:10px;
}

.titulo{
  text-align:center;
  font-size:20px;
  font-weight:bold;
}

.top-bar{
  display:flex;
  justify-content:center;
  gap:5px;
  flex-wrap:wrap;
  margin-top:5px;
}

.top-bar button{
  background:white;
  color:#0b3c5d;
  font-size:11px;
  padding:4px 6px;
}

.top-bar input{
  font-size:11px;
  padding:4px;
}

.container{padding:15px;}

.form-grid{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(150px,1fr));
  gap:6px;
}

input,select{padding:6px;}

button{
  background:#0b3c5d;
  color:white;
  border:none;
  padding:7px;
}

.emp{
 text-align:center;
 margin-top:10px;
}

table{
  width:100%;
  border-collapse:collapse;
  margin-top:10px;
}

th,td{
  border:1px solid #ccc;
  padding:6px;
  font-size:12px;
}

th{
  background:#0b3c5d;
  color:white;
}

</style>
</head>

<body>

<div id="login" style="text-align:center;padding:40px">
<h2>NM SOLUCION</h2>
<input type="password" id="senha">
<br><br>
<button onclick="entrar()">Entrar</button>
</div>

<div id="sistema" style="display:none">

<header>

<div class="titulo">Controle de Chaves</div>

<div class="top-bar">
<button onclick="pdfGeral()">Geral</button>
<button onclick="pdfAtrasados()">Atrasados</button>
<button onclick="backup()">Backup</button>
<input id="busca" placeholder="🔎 Buscar" oninput="filtrar()">
</div>

</header>

<div class="container">

<div class="form-grid">
<input id="nome" placeholder="Nome">
<input id="empresa" placeholder="Empresa">
<input id="funcao" placeholder="Função">
<input id="cracha" placeholder="Crachá">
<input id="chave" placeholder="Chave">
<select id="motivo">
<option>Perda</option>
<option>Serviço</option>
</select>
</div>

<div class="emp">
<button onclick="emprestar()">Emprestar</button>
</div>

<table>
<thead>
<tr>
<th>Nome</th>
<th>Empresa</th>
<th>Função</th>
<th>Crachá</th>
<th>Chave</th>
<th>Status</th>
<th>Ações</th>
</tr>
</thead>
<tbody id="tabela"></tbody>
</table>

</div>
</div>

<script>

let dados=[];

function entrar(){
  if(senha.value==="NMDIGITAL"){
    login.style.display="none";
    sistema.style.display="block";
    carregar();
  }
}

// carregar
async function carregar(){
  const r=await fetch("/dados");
  dados=await r.json();
  render();
}

// emprestar
async function emprestar(){
  await fetch("/dados",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      nome:nome.value,
      empresa:empresa.value,
      funcao:funcao.value,
      cracha:cracha.value,
      chave:chave.value,
      motivo:motivo.value
    })
  });

  nome.value=empresa.value=funcao.value=cracha.value=chave.value="";
  carregar();
}

// render
function render(lista=dados){
  tabela.innerHTML="";
  let agora=new Date();

  lista.forEach(d=>{
    let emp=new Date(d.data);
    let venc=new Date(emp.getTime()+48*60*60*1000);

    let cor="green";
    let status="EM DIA";

    if(d.devolvido){cor="gray";status="DEVOLVIDO";}
    else if(agora>venc){cor="red";status="VENCIDO";}

    tabela.innerHTML+=\`
<tr>
<td>\${d.nome}</td>
<td>\${d.empresa}</td>
<td>\${d.funcao}</td>
<td>\${d.cracha}</td>
<td>\${d.chave}</td>
<td style="color:\${cor};font-weight:bold">\${status}</td>
<td>
<button onclick="devolver(\${d.id})">Devolver</button>
<button onclick="excluir(\${d.id})">Excluir</button>
</td>
</tr>\`;
  });
}

// ações
async function devolver(id){
  await fetch("/dados/"+id,{method:"PUT"});
  carregar();
}

async function excluir(id){
  if(prompt("Senha:")==="2805"){
    await fetch("/dados/"+id,{method:"DELETE"});
    carregar();
  }
}

// busca
function filtrar(){
  let t=busca.value.toLowerCase();
  render(dados.filter(d=>d.nome.toLowerCase().includes(t)));
}

// backup
function backup(){
  const blob=new Blob([JSON.stringify(dados,null,2)]);
  const link=document.createElement("a");
  link.href=URL.createObjectURL(blob);
  link.download="backup.json";
  link.click();
}

// ✅ RELATORIO GERAL PLANILHA
function pdfGeral(){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y=10;

  doc.setFontSize(10);
  doc.text("RELATÓRIO GERAL",10,y);
  y+=10;

  doc.setFontSize(7);

  doc.text("Nome",10,y);
  doc.text("Empresa",40,y);
  doc.text("Função",75,y);
  doc.text("Chave",105,y);
  doc.text("Data",140,y);
  y+=4;

  doc.line(10,y,200,y);
  y+=4;

  dados.forEach(d=>{
    let emp=new Date(d.data);
    let venc=new Date(emp.getTime()+48*60*60*1000);

    doc.text(d.nome||"",10,y);
    doc.text(d.empresa||"",40,y);
    doc.text(d.funcao||"",75,y);
    doc.text(d.chave||"",105,y);
    doc.text(emp.toLocaleDateString(),140,y);

    y+=4;

    doc.text(
      "Emp: "+emp.toLocaleDateString()+" | Venc: "+venc.toLocaleDateString(),
      10,
      y
    );

    y+=6;

    doc.line(10,y,200,y);
    y+=4;

    if(y>280){
      doc.addPage();
      y=10;
    }
  });

  window.open(doc.output("bloburl"));
}

// ✅ ATRASADOS PLANILHA
function pdfAtrasados(){
  const { jsPDF } = window.jspdf;
  const doc=new jsPDF();

  let y=10;
  let agora=new Date();

  doc.setFontSize(10);
  doc.text("ATRASADOS",10,y);
  y+=10;

  doc.setFontSize(7);

  dados.forEach(d=>{
    let emp=new Date(d.data);
    let venc=new Date(emp.getTime()+48*60*60*1000);

    if(!d.devolvido && agora>venc){

      doc.text(d.nome,10,y);
      doc.text(d.chave,80,y);
      y+=4;

      doc.text(
        "Emp: "+emp.toLocaleDateString()+
        " | Venc: "+venc.toLocaleDateString(),
        10,y
      );

      y+=6;

      doc.line(10,y,200,y);
      y+=4;

      if(y>280){
        doc.addPage();
        y=10;
      }
    }
  });

  window.open(doc.output("bloburl"));
}

</script>

</body>
</html>
`));

app.listen(process.env.PORT||3000);
