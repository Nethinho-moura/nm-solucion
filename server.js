// ✅ (SEU SERVER COMPLETO ORIGINAL COM AJUSTE LIMPO)

import express from "express";
import pkg from "pg";
const { Pool } = pkg;

const app = express();
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ✅ tabelas
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

// ✅ USUARIOS
app.get("/usuarios", async (req,res)=>{
  const r = await pool.query("SELECT * FROM usuarios");
  res.json(r.rows);
});

app.post("/usuarios", async (req,res)=>{
  const {nome,senha}=req.body;
  await pool.query("INSERT INTO usuarios(nome,senha) VALUES ($1,$2)",[nome,senha]);
  res.sendStatus(200);
});

app.delete("/usuarios/:id", async (req,res)=>{
  await pool.query("DELETE FROM usuarios WHERE id=$1",[req.params.id]);
  res.sendStatus(200);
});

// ✅ CHAVES
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


// ✅ FRONTEND — SEU ORIGINAL + AJUSTE
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

<!-- ✅ BOTÃO NOVO -->
<div class="card">
<button onclick="window.open('/usuariosPage')">
👥 Gerenciar Recepcionistas
</button>
</div>

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

<!-- ✅ NOVO CAMPO SEM QUEBRAR GRID -->
<select id="usuarioUso"></select>

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
<th>Usuário</th>
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
    carregarUsuarios();
  }
}

async function carregarUsuarios(){
  const r=await fetch("/usuarios");
  const usuarios=await r.json();

  usuarioUso.innerHTML="";
  usuarios.forEach(u=>{
    usuarioUso.innerHTML+=\`<option>\${u.nome}</option>\`;
  });
}

// resto (SEU ORIGINAL)
async function carregar(){
  const r=await fetch("/dados");
  dados=await r.json();
  render();
}

async function emprestar(){
  if(!nome.value||!empresa.value||!funcao.value||!cracha.value||!chave.value||!motivo.value){
    alert("Preencha tudo"); return;
  }

  await fetch("/dados",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      nome:nome.value,
      empresa:empresa.value,
      funcao:funcao.value,
      cracha:cracha.value,
      chave:chave.value,
      motivo:motivo.value,
      usuario:usuarioUso.value
    })
  });

  carregar();
}

function render(){
  tabela.innerHTML="";
  dados.forEach(d=>{
    tabela.innerHTML+=\`
<tr>
<td>\${d.nome}</td>
<td>\${d.empresa}</td>
<td>\${d.funcao}</td>
<td>\${d.cracha}</td>
<td>\${d.chave}</td>
<td>\${d.usuario}</td>
<td>\${d.devolvido?'OK':'ABERTO'}</td>
<td>
<button onclick="devolver(\${d.id})">Devolver</button>
<button onclick="excluir(\${d.id})">Excluir</button>
</td>
</tr>\`;
  });
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

function backup(){
  const blob=new Blob([JSON.stringify(dados)],{type:"application/json"});
  const link=document.createElement("a");
  link.href=URL.createObjectURL(blob);
  link.download="backup.json";
  link.click();
}

function restaurar(event){
  const file=event.target.files[0];
  const reader=new FileReader();
  reader.onload=async e=>{
    let lista=JSON.parse(e.target.result);
    for(let i of lista){
      await fetch("/dados",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(i)});
    }
    carregar();
  };
  reader.readAsText(file);
}

</script>
</body>
</html>
`));


// ✅ PAGE USUARIOS SEPARADA
app.get("/usuariosPage",(req,res)=>res.send(`
<!DOCTYPE html>
<html>
<body>

<h2>Recepcionistas</h2>

<input id="nome">
<input id="senha" type="password">

<button onclick="criar()">Criar</button>

<div id="lista"></div>

<script>
async function carregar(){
  const r=await fetch("/usuarios");
  const data=await r.json();

  lista.innerHTML="";
  data.forEach(u=>{
    lista.innerHTML += u.nome + " <button onclick=\\"excluir("+u.id+")\\">Excluir</button><br>";
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
