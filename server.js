import express from "express";
import pkg from "pg";
const { Pool } = pkg;

const app = express();
app.use(express.json());

// ✅ CONEXÃO
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ✅ CRIAR TABELA
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

// ✅ API
app.get("/dados", async (req,res)=>{
  const r = await pool.query("SELECT * FROM chaves ORDER BY id DESC");
  res.json(r.rows);
});

app.post("/dados", async (req,res)=>{
  try {
    const d = req.body;

    await pool.query(
      "INSERT INTO chaves (nome,empresa,funcao,cracha,chave,motivo,data,devolvido) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
      [d.nome,d.empresa,d.funcao,d.cracha,d.chave,d.motivo,new Date(),false]
    );

    res.sendStatus(200);
  } catch (e){
    console.error(e);
    res.sendStatus(500);
  }
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
<html lang="pt-br">
<head>
<meta charset="UTF-8">
<title>NM SOLUCION</title>

<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>

<style>
body {font-family:Arial;background:linear-gradient(135deg,#0b3c5d,#1f6fa5);margin:0;}
#login{width:300px;margin:120px auto;background:white;padding:20px;text-align:center;}
header{background:#0b3c5d;color:white;padding:10px;text-align:center;}
.container{padding:20px;background:#eef2f7;}
.card{background:white;padding:15px;border-radius:8px;margin-bottom:15px;}
.form-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;}
input,select,button{padding:8px;width:100%;}
button{background:#0b3c5d;color:white;border:none;}
button:hover{background:#155a87;}
table{width:100%;border-collapse:collapse;}
th,td{border:1px solid #ccc;padding:8px;}
th{background:#0b3c5d;color:white;}

/* ✅ BOTÕES (SÓ ALTERAÇÃO FEITA NO SISTEMA) */
.btn-dev,.btn-exc{
  margin-right:8px;
  padding:6px 10px;
  border-radius:4px;
  transition:0.2s;
}

/* efeitos */
.btn-dev:hover{
  background:#1f6fa5;
}
.btn-exc:hover{
  background:#c0392b;
}

</style>
</head>

<body>

<div id="login">
<h2>NM SOLUCION</h2>
<input type="password" id="senhaLogin">
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
<input id="cracha" placeholder="ID do Crachá">
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
</div>

<script>

let dados=[];

function entrar(){
  if(senhaLogin.value==="NMDIGITAL"){
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
      chave:chave.value,
      motivo:motivo.value
    })
  });
  carregar();
}

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

function render(){
  tabela.innerHTML="";
  let agora=new Date();

  dados.forEach(d=>{
    let emp=new Date(d.data);
    let venc=new Date(emp.getTime()+48*60*60*1000);

    let status="",cor="";
    if(d.devolvido){status="DEVOLVIDO";cor="gray";}
    else if(agora>venc){status="VENCIDO";cor="red";}
    else{status="EM DIA";cor="green";}

    tabela.innerHTML+=\`
<tr>
<td>\${d.nome}</td>
<td>\${d.empresa}</td>
<td>\${d.funcao}</td>
<td>\${d.cracha||""}</td>
<td>\${d.chave}</td>
<td style="color:\${cor};font-weight:bold;">\${status}</td>
<td>
\${!d.devolvido ? '<button class="btn-dev" onclick="devolver('+d.id+')">Devolver</button>' : ''}
<button class="btn-exc" onclick="excluir(\${d.id})">Excluir</button>
</td>
</tr>\`;
  });
}

</script>
</body>
</html>
`));

app.listen(process.env.PORT||3000);
