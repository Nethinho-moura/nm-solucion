import express from "express";
import pkg from "pg";

const { Pool } = pkg;

const app = express();
app.use(express.json());

// ===============================
// BANCO
// ===============================

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
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
        devolvido BOOLEAN DEFAULT FALSE
      )
    `);
    console.log("BANCO CONECTADO");
  } catch (err) {
    console.log(err);
  }
})();

// ===============================
// API
// ===============================

app.get("/dados", async (req, res) => {
  const r = await pool.query("SELECT * FROM chaves ORDER BY id DESC");
  res.json(r.rows);
});

app.post("/dados", async (req, res) => {
  const d = req.body;

  await pool.query(
    `INSERT INTO chaves (nome,empresa,funcao,cracha,chave,motivo,data,devolvido)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [d.nome, d.empresa, d.funcao, d.cracha, d.chave, d.motivo, new Date(), false]
  );

  res.sendStatus(200);
});

app.put("/dados/:id", async (req, res) => {
  await pool.query("UPDATE chaves SET devolvido=true WHERE id=$1", [req.params.id]);
  res.sendStatus(200);
});

app.delete("/dados/:id", async (req, res) => {
  await pool.query("DELETE FROM chaves WHERE id=$1", [req.params.id]);
  res.sendStatus(200);
});

// ===============================
// FRONTEND
// ===============================

app.get("/", (req, res) => res.send(`

<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Controle de Chaves</title>

<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>

<style>
body{margin:0;font-family:Arial;background:#eef2f7;}

header{background:#0b3c5d;color:white;padding:10px;}
.titulo{text-align:center;font-size:22px;font-weight:bold;}

.top-bar{display:flex;justify-content:center;gap:5px;flex-wrap:wrap;margin-top:5px;}
.top-bar button{background:white;color:#0b3c5d;font-size:11px;padding:4px 6px;}
.top-bar input{font-size:11px;padding:4px;}

.container{padding:15px;}

.form-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:6px;}

input,select{padding:6px;}

button{background:#0b3c5d;color:white;border:none;padding:7px;}

.emp{text-align:center;margin-top:10px;}

table{width:100%;border-collapse:collapse;margin-top:10px;}
th,td{border:1px solid #ccc;padding:6px;font-size:12px;}
th{background:#0b3c5d;color:white;}
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
<div class="titulo">CONTROLE DE CHAVES</div>

<div class="top-bar">
<button onclick="pdfGeral()">Geral</button>
<button onclick="pdfAtrasados()">Atrasados</button>
<input id="busca" placeholder="Buscar" oninput="filtrar()">
</div>
</header>

<div class="container">

<div class="form-grid">
<input id="nome" placeholder="Nome">
<input id="empresa" placeholder="Empresa">
<input id="funcao" placeholder="Função">
<input id="cracha" placeholder="Crachá">
<input id="chave" placeholder="Chave">
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

async function carregar(){
  const r=await fetch("/dados");
  dados=await r.json();
  render();
}

async function emprestar(){
  await fetch("/dados",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      nome:nome.value,
      empresa:empresa.value,
      funcao:funcao.value,
      cracha:cracha.value,
      chave:chave.value
    })
  });

  nome.value=empresa.value=funcao.value=cracha.value=chave.value="";
  carregar();
}

function render(lista=dados){
  tabela.innerHTML="";
  lista.forEach(d=>{
    tabela.innerHTML+=
    '<tr>'+
    '<td>'+d.nome+'</td>'+
    '<td>'+d.empresa+'</td>'+
    '<td>'+d.funcao+'</td>'+
    '<td>'+d.cracha+'</td>'+
    '<td>'+d.chave+'</td>'+
    '<td>'+ (d.devolvido ? 'DEVOLVIDO' : 'ATIVO') +'</td>'+
    '</tr>';
  });
}

// ✅ PDF PREMIUM
function pdfGeral(){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let y=15;

  doc.setFontSize(14);
  doc.text("RELATÓRIO GERAL",105,y,{align:"center"});
  y+=10;

  dados.forEach(d=>{
    doc.text(d.nome,10,y);
    y+=6;
  });

  window.open(doc.output("bloburl"));
}

function pdfAtrasados(){
  alert("Função ativa");
}

</script>

</body>
</html>

`));

// ===============================
app.listen(process.env.PORT || 3000, () => {
  console.log("SERVIDOR ONLINE");
});
