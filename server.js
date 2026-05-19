import express from "express";
import pkg from "pg";
const { Pool } = pkg;

const app = express();
app.use(express.json());

// ✅ BANCO
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

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
      usuario TEXT,
      data TIMESTAMP,
      devolvido BOOLEAN
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      nome TEXT,
      senha TEXT
    )
  `);
})();

// ✅ APIs
app.get("/dados", async (req,res)=>{
  const r = await pool.query("SELECT * FROM chaves ORDER BY id DESC");
  res.json(r.rows);
});

app.post("/dados", async (req,res)=>{
  const d=req.body;

  await pool.query(
    "INSERT INTO chaves (nome,empresa,funcao,cracha,chave,motivo,usuario,data,devolvido) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)",
    [d.nome,d.empresa,d.funcao,d.cracha,d.chave,d.motivo,d.usuario,new Date(),false]
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

app.get("/", (req,res)=>res.send(`

<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>NM SOLUCION</title>

https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js

<style>
body{font-family:Arial;background:#eef2f7;margin:0}
header{background:#0b3c5d;color:white;padding:10px;text-align:center}
.container{padding:10px}
.card{background:white;padding:10px;margin:10px;border-radius:6px}
input,select,button{padding:8px;width:100%;margin:3px}
button{background:#0b3c5d;color:white;border:none}
.alerta{animation:piscando 1s infinite}
@keyframes piscando{0%{background:#ffcccc;}100%{background:white;}}
</style>
</head>

<body>

<header><h2>Controle de Chaves</h2></header>

<div class="container">

<div class="card">
<input id="busca" placeholder="🔎 Pesquisar..." oninput="filtrar()">
<button onclick="exportarExcel()">Exportar Excel</button>
</div>

<div class="card">
<input id="usuario" placeholder="Recepcionista">
<input type="password" id="senha" placeholder="Senha (280516)">
<button onclick="login()">Entrar</button>
</div>

<div id="sistema" style="display:none">

<div class="card">
<input id="nome" placeholder="Nome">
<input id="empresa" placeholder="Empresa">
<input id="funcao" placeholder="Função">
<input id="cracha" placeholder="ID Crachá">
<input id="chave" placeholder="Chave">
<select id="motivo">
<option>Perda</option><option>Serviço</option>
</select>

<button onclick="emprestar()">Emprestar</button>
</div>

<div class="card">
<button onclick="pdfGeral()">PDF Geral</button>
</div>

<div class="card">
<table width="100%">
<thead>
<tr><th>Nome</th><th>Crachá</th><th>Chave</th><th>Status</th><th>Ação</th></tr>
</thead>
<tbody id="tabela"></tbody>
</table>
</div>

</div>
</div>

<script>

let dados=[];
let usuarioLogado="";

function login(){
  if(senha.value==="280516"){
    usuarioLogado=usuario.value;
    sistema.style.display="block";
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
  await fetch("/dados",{method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      nome:nome.value,
      empresa:empresa.value,
      funcao:funcao.value,
      cracha:cracha.value,
      chave:chave.value,
      motivo:motivo.value,
      usuario:usuarioLogado
    })
  });

  nome.value=empresa.value=funcao.value=cracha.value=chave.value="";
  carregar();
}

// RENDER
function render(lista=dados){
  tabela.innerHTML="";
  let agora=new Date();

  lista.forEach(d=>{
    let prazo=new Date(d.data);
    prazo.setHours(prazo.getHours()+48);

    let atrasado=!d.devolvido && agora>prazo;

    tabela.innerHTML+=\`
<tr class="\${atrasado?'alerta':''}">
<td>\${d.nome}</td>
<td>\${d.cracha}</td>
<td>\${d.chave}</td>
<td>\${d.devolvido?'DEVOLVIDO':(atrasado?'VENCIDO':'EM DIA')}</td>
<td>
<button onclick="devolver(\${d.id})">Devolver</button>
</td>
</tr>\`;
  });
}

// DEVOLVER
async function devolver(id){
  await fetch("/dados/"+id,{method:"PUT"});
  carregar();
}

// BUSCA
function filtrar(){
  let txt=busca.value.toLowerCase();
  let f=dados.filter(d=>
    (d.nome||"").toLowerCase().includes(txt) ||
    (d.empresa||"").toLowerCase().includes(txt) ||
    (d.cracha||"").toLowerCase().includes(txt)
  );
  render(f);
}

// EXCEL
function exportarExcel(){
  let csv="Nome,Empresa,Crachá,Chave\\n";
  dados.forEach(d=>{
    csv+=\`\${d.nome},\${d.empresa},\${d.cracha},\${d.chave}\\n\`;
  });

  let blob=new Blob([csv]);
  let link=document.createElement("a");
  link.href=URL.createObjectURL(blob);
  link.download="relatorio.csv";
  link.click();
}

// PDF
function pdfGeral(){
  const {jsPDF}=window.jspdf;
  let doc=new jsPDF();
  let y=10;

  dados.forEach(d=>{
    doc.text(\`\${d.nome} | \${d.chave} | \${d.cracha}\`,10,y);
    y+=6;
  });

  window.open(doc.output("bloburl"));
}

carregar();

</script>

</body>
</html>
`));

app.listen(process.env.PORT||3000);
