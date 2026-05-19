import express from "express";
import pkg from "pg";

const { Pool } = pkg;

const app = express();
app.use(express.json());

// ✅ conexão com banco (Render usa DATABASE_URL)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ✅ criar tabela automática
async function initDB(){
  await pool.query(`
    CREATE TABLE IF NOT EXISTS chaves (
      id SERIAL PRIMARY KEY,
      nome TEXT,
      empresa TEXT,
      funcao TEXT,
      chave TEXT,
      motivo TEXT,
      data TIMESTAMP,
      devolvido BOOLEAN
    )
  `);
}
initDB();

// ✅ API

app.get("/dados", async (req,res)=>{
  const result = await pool.query("SELECT * FROM chaves ORDER BY id DESC");
  res.json(result.rows);
});

app.post("/dados", async (req,res)=>{
  const d = req.body;

  await pool.query(
    "INSERT INTO chaves (nome,empresa,funcao,chave,motivo,data,devolvido) VALUES ($1,$2,$3,$4,$5,$6,$7)",
    [d.nome,d.empresa,d.funcao,d.chave,d.motivo,new Date(),false]
  );

  res.sendStatus(200);
});

app.put("/dados/:id", async (req,res)=>{
  const id = req.params.id;
  await pool.query(
    "UPDATE chaves SET devolvido=true WHERE id=$1",
    [id]
  );
  res.sendStatus(200);
});

app.delete("/dados/:id", async (req,res)=>{
  const id = req.params.id;
  await pool.query(
    "DELETE FROM chaves WHERE id=$1",
    [id]
  );
  res.sendStatus(200);
});

// ✅ FRONTEND
app.get("/", (req,res)=>{
res.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>NM SOLUCION</title>

<style>
body {font-family:Arial;background:#eef2f7;margin:0;}
.container{padding:20px;}
input,select,button{margin:5px;padding:8px;width:100%;}
table{width:100%;border-collapse:collapse;}
td,th{border:1px solid #ccc;padding:5px;}
tr:hover{background:#eee;}
</style>
</head>

<body>

<div id="login">
<input id="senha" type="password" placeholder="Senha">
<button onclick="entrar()">Entrar</button>
</div>

<div id="sistema" style="display:none;">
<div class="container">

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

<table>
<thead>
<tr>
<th>Nome</th><th>Empresa</th><th>Função</th><th>Chave</th><th>Status</th><th>Ações</th>
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

// ✅ carregar do banco
async function carregar(){
  const r=await fetch("/dados");
  dados=await r.json();
  render();
}

// ✅ salvar
async function emprestar(){
  await fetch("/dados",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      nome:nome.value,
      empresa:empresa.value,
      funcao:funcao.value,
      chave:chave.value,
      motivo:motivo.value
    })
  });

  nome.value=empresa.value=funcao.value=chave.value="";
  motivo.value="";

  carregar();
}

// ✅ devolver
async function devolver(id){
  await fetch("/dados/"+id,{method:"PUT"});
  carregar();
}

// ✅ excluir
async function excluir(id){
  if(prompt("Senha:")==="2805"){
    await fetch("/dados/"+id,{method:"DELETE"});
    carregar();
  }
}

// render
function render(){
  tabela.innerHTML="";
  let agora=new Date();

  dados.forEach(d=>{
    let prazo=new Date(d.data);
    prazo.setHours(prazo.getHours()+48);

    let status="",cor="";
    if(d.devolvido){status="DEVOLVIDO";cor="gray";}
    else if(agora>prazo){status="VENCIDO";cor="red";}
    else{status="EM DIA";cor="green";}

    tabela.innerHTML+=\`
<tr>
<td>\${d.nome}</td>
<td>\${d.empresa}</td>
<td>\${d.funcao}</td>
<td>\${d.chave}</td>
<td style="color:\${cor}">\${status}</td>
<td>
<button onclick="devolver(\${d.id})">Devolver</button>
<button onclick="excluir(\${d.id})">Excluir</button>
</td>
</tr>\`;
  });
}

</script>
</body>
</html>
`);
});

app.listen(process.env.PORT || 3000);
