import express from "express";
import pkg from "pg";
const { Pool } = pkg;

const app = express();
app.use(express.json());

// BANCO
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// TABELAS
(async () => {
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

// APIs USUARIOS
app.get("/usuarios", async (req,res)=>{
  const r = await pool.query("SELECT * FROM usuarios");
  res.json(r.rows);
});

app.post("/usuarios", async (req,res)=>{
  const {nome,senha} = req.body;
  await pool.query("INSERT INTO usuarios (nome,senha) VALUES ($1,$2)",[nome,senha]);
  res.sendStatus(200);
});

app.delete("/usuarios/:id", async (req,res)=>{
  await pool.query("DELETE FROM usuarios WHERE id=$1",[req.params.id]);
  res.sendStatus(200);
});

// APIs CHAVES
app.get("/dados", async (req,res)=>{
  const r = await pool.query("SELECT * FROM chaves ORDER BY id DESC");
  res.json(r.rows);
});

app.post("/dados", async (req,res)=>{
  const d = req.body;

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


// ✅ TELA PRINCIPAL (SEU SISTEMA ORIGINAL)
app.get("/", (req,res)=>res.send(`
<!DOCTYPE html>
<html lang="pt-br">
<head>
<meta charset="UTF-8">
<title>NM SOLUCION</title>

<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>

<style>
body {font-family:Arial;background:#eef2f7;margin:0;}
header{background:#0b3c5d;color:white;padding:10px;text-align:center;}
.container{padding:20px;}
.card{background:white;padding:15px;border-radius:8px;margin-bottom:15px;}
input,select,button{padding:8px;width:100%;}
button{background:#0b3c5d;color:white;border:none;}
table{width:100%;border-collapse:collapse;}
th,td{border:1px solid #ccc;padding:8px;}
th{background:#0b3c5d;color:white;}
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

<!-- BOTÃO NOVO -->
<div class="card">
<button onclick="abrirUsuarios()">👥 Gerenciar Recepcionistas</button>
</div>

<div class="card">
<input id="nome" placeholder="Nome">
<input id="empresa" placeholder="Empresa">
<input id="funcao" placeholder="Função">
<input id="cracha" placeholder="Crachá">
<input id="chave" placeholder="Chave">

<select id="motivo">
<option>Perda</option><option>Serviço</option>
</select>

<select id="usuarioUso"></select>

<button onclick="emprestar()">Emprestar</button>
</div>

<div class="card">
<table>
<thead>
<tr>
<th>Nome</th>
<th>Usuário</th>
<th>Status</th>
</tr>
</thead>
<tbody id="tabela"></tbody>
</table>
</div>

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
    carregarUsuarios();
  }
}

// ABRIR NOVA ABA
function abrirUsuarios(){
  window.open("/usuariosPage","_blank");
}

// CARREGAR USUARIOS
async function carregarUsuarios(){
  const r = await fetch("/usuarios");
  const usuarios = await r.json();

  usuarioUso.innerHTML="";
  usuarios.forEach(u=>{
    usuarioUso.innerHTML+=\`<option>\${u.nome}</option>\`;
  });
}

// CHAVES
async function carregar(){
  const r=await fetch("/dados");
  dados=await r.json();
  render();
}

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
    usuario:usuarioUso.value
  })});

  carregar();
}

function render(){
  tabela.innerHTML="";
  dados.forEach(d=>{
    tabela.innerHTML+=\`
<tr>
<td>\${d.nome}</td>
<td>\${d.usuario}</td>
<td>\${d.devolvido?'OK':'ABERTO'}</td>
</tr>\`;
  });
}

</script>
</body>
</html>
`));


// ✅ TELA DE USUARIOS (POPUP)
app.get("/usuariosPage",(req,res)=>res.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Usuários</title>
</head>
<body>

<h2>Gerenciar Recepcionistas</h2>

<input id="nome" placeholder="Nome">
<input id="senha" type="password" placeholder="Senha">

<button onclick="criar()">Criar</button>

<div id="lista"></div>

<script>

async function carregar(){
  const r=await fetch("/usuarios");
  const data=await r.json();

  lista.innerHTML="";
  data.forEach(u=>{
    lista.innerHTML+=\`
\${u.nome} <button onclick="excluir(\${u.id})">Excluir</button><br>\`;
  });
}

async function criar(){
  await fetch("/usuarios",{method:"POST",
  headers:{"Content-Type":"application/json"},
  body:JSON.stringify({nome:nome.value,senha:senha.value})});

  carregar();
}

async function excluir(id){
  await fetch("/usuarios/"+id,{method:"DELETE"});
  carregar();
}

carregar();

</script>

</body>
</html>
`));

app.listen(process.env.PORT||3000);
