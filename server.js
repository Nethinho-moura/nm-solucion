import express from "express";
import pkg from "pg";
const { Pool } = pkg;

const app = express();
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// TABELA
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

  await pool.query(`
    ALTER TABLE chaves 
    ADD COLUMN IF NOT EXISTS cracha TEXT;
  `);
})();

// API
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

// FRONT
app.get("/", (req,res)=>res.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">

https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.jsscript>

<style>
body{font-family:Arial;margin:0;background:#eef2f7;}

header{background:#0b3c5d;color:white;padding:10px;}

.top-bar{
  display:flex;
  justify-content:center;
  gap:6px;
  flex-wrap:wrap;
}

.top-bar button{
  background:white;
  color:#0b3c5d;
  padding:5px;
}

.top-bar input{
  padding:5px;
}

.container{padding:20px;}

input,select{padding:8px}

button{background:#0b3c5d;color:white;border:none;padding:6px}

table{width:100%;border-collapse:collapse;margin-top:10px}

th,td{border:1px solid #ccc;padding:6px}

th{background:#0b3c5d;color:white}

/* BOTÕES */
.btn-dev,.btn-exc{
  margin-right:6px;
  padding:5px 8px;
}

.btn-dev:hover{background:#1f6fa5;}
.btn-exc:hover{background:#c0392b;}

</style>
</head>

<body>

<div id="login" style="text-align:center;padding:40px">
<h2>NM SOLUCION</h2>
<input type="password" id="senhaLogin">
<br><br>
<button onclick="entrar()">Entrar</button>
</div>

<div id="sistema" style="display:none">

<header>

<div class="top-bar">
<button onclick="pdfGeral()">📄 Geral</button>
<button onclick="pdfAtrasados()">⚠️ Atrasados</button>
<button onclick="backup()">💾 Backup</button>

<input type="file" onchange="restaurar(event)">
<input id="busca" placeholder="🔎 Buscar" oninput="filtrar()">
</div>

</header>

<div class="container">

<input id="nome" placeholder="Nome">
<input id="empresa" placeholder="Empresa">
<input id="funcao" placeholder="Função">
<input id="cracha" placeholder="Crachá">
<input id="chave" placeholder="Chave">

<select id="motivo">
<option>Perda</option>
<option>Serviço</option>
</select>

<br><br>
<button onclick="emprestar()">Emprestar</button>

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

// LOGIN
function entrar(){
  if(senhaLogin.value==="NMDIGITAL"){
    login.style.display="none";
    sistema.style.display="block";
    carregar();
  }
}

// CARREGAR
async function carregar(){
  const r=await fetch("/dados");
  dados=await r.json();
  render();
}

// EMPRESTAR
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

  carregar();
}

// RENDER
function render(lista=dados){
  tabela.innerHTML="";
  let agora=new Date();

  lista.forEach(d=>{
    let emp=new Date(d.data);
    let venc=new Date(emp.getTime()+48*60*60*1000);

    let status="EM DIA", cor="green";

    if(d.devolvido){status="DEVOLVIDO";cor="gray";}
    else if(agora>venc){status="VENCIDO";cor="red";}

    tabela.innerHTML+=\`
<tr>
<td>\${d.nome}</td>
<td>\${d.empresa}</td>
<td>\${d.funcao}</td>
<td>\${d.cracha||""}</td>
<td>\${d.chave}</td>
<td style="color:\${cor}">\${status}</td>
<td>
\${!d.devolvido ? '<button class="btn-dev" onclick="devolver('+d.id+')">Devolver</button>' : ''}
<button class="btn-exc" onclick="excluir(\${d.id})">Excluir</button>
</td>
</tr>\`;
  });
}

// BUSCA
function filtrar(){
  let t=busca.value.toLowerCase();
  render(dados.filter(d=>d.nome.toLowerCase().includes(t)));
}

// AÇÕES
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

// BACKUP
function backup(){
  const blob=new Blob([JSON.stringify(dados,null,2)]);
  const link=document.createElement("a");
  link.href=URL.createObjectURL(blob);
  link.download="backup.json";
  link.click();
}

// RESTAURAR
function restaurar(event){
  const file=event.target.files[0];
  const reader=new FileReader();

  reader.onload=async e=>{
    let lista=JSON.parse(e.target.result);

    for(let i of lista){
      delete i.id;
      await fetch("/dados",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(i)});
    }

    carregar();
  };

  reader.readAsText(file);
}

// ✅ PDF GERAL
function pdfGeral(){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y=10;

  doc.text("RELATORIO",10,y);
  y+=10;

  dados.forEach(d=>{
    doc.text(d.nome+" | "+d.chave,10,y);
    y+=6;
  });

  window.open(doc.output("bloburl"));
}

// ✅ PDF ATRASADOS
function pdfAtrasados(){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y=10;
  let agora=new Date();

  dados.forEach(d=>{
    let venc=new Date(new Date(d.data).getTime()+48*60*60*1000);

    if(!d.devolvido && agora>venc){
      doc.text(d.nome+" | "+d.chave,10,y);
      y+=6;
    }
  });

  window.open(doc.output("bloburl"));
}

</script>
</body>
</html>
`));

app.listen(process.env.PORT||3000);
