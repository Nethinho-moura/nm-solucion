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

// ✅ CRIA TABELAS
(async ()=>{
  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      nome TEXT,
      senha TEXT
    )
  `);

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
})();

// ✅ APIs
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


// ✅ FRONTEND
app.get("/", (req,res)=>res.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>NM SOLUCION</title>

<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>

<style>
body {font-family:Arial;background:#eef2f7;margin:0;}
header{background:#0b3c5d;color:white;padding:10px;text-align:center;}
.container{padding:20px;}
.card{background:white;padding:15px;border-radius:8px;margin-bottom:15px;}
input,select,button{padding:8px;width:100%;margin:5px 0;}
button{background:#0b3c5d;color:white;border:none;}
button:hover{background:#155a87;}
table{width:100%;border-collapse:collapse;}
th,td{border:1px solid #ccc;padding:8px;}
.alerta{animation:piscando 1s infinite;}
@keyframes piscando{0%{background:#ffcccc;}100%{background:white;}}
</style>
</head>

<body>

<div id="login" class="card">
<h2>NM SOLUCION</h2>
<input type="password" id="senhaAdmin" placeholder="Senha">
<button onclick="entrar()">Entrar</button>
</div>

<div id="sistema" style="display:none">

<header><h2>Controle de Chaves</h2></header>

<div class="container">

<!-- 🔍 BUSCA -->
<div class="card">
<input id="busca" placeholder="🔎 Pesquisar" oninput="filtrar()">
<button onclick="exportarExcel()">Exportar Excel</button>
</div>

<!-- 📋 CADASTRO -->
<div class="card">
<input id="nome" placeholder="Nome">
<input id="empresa" placeholder="Empresa">
<input id="funcao" placeholder="Função">
<input id="cracha" placeholder="Crachá">
<input id="chave" placeholder="Chave">

<select id="motivo">
<option>Perda</option>
<option>Serviço</option>
</select>

<!-- ✅ USUARIO SELECIONADO -->
<select id="usuarioUso"></select>

<button onclick="emprestar()">Emprestar</button>
</div>

<!-- 🔑 CRIAR RECEPCIONISTA -->
<div class="card">
<h3>Criar Recepcionista</h3>
<input id="novoNome" placeholder="Nome">
<input type="password" id="novaSenha" placeholder="Senha">
<button onclick="criarUsuario()">Criar</button>

<div id="listaUsuarios"></div>
</div>

<!-- 📊 TABELA -->
<div class="card">
<table>
<thead>
<tr>
<th>Nome</th>
<th>Usuário</th>
<th>Status</th>
<th>Ação</th>
</tr>
</thead>
<tbody id="tabela"></tbody>
</table>
</div>

</div>
</div>

<script>
let dados=[];
let usuarios=[];

// LOGIN ADMIN
function entrar(){
  if(senhaAdmin.value==="NMDIGITAL"){
    login.style.display="none";
    sistema.style.display="block";
    carregarUsuarios();
    carregar();
  }
}

// ✅ USUÁRIOS
async function carregarUsuarios(){
  const r=await fetch("/usuarios");
  usuarios=await r.json();

  usuarioUso.innerHTML="";
  listaUsuarios.innerHTML="";

  usuarios.forEach(u=>{
    usuarioUso.innerHTML+=\`<option>\${u.nome}</option>\`;

    listaUsuarios.innerHTML+=\`
\${u.nome}
<button onclick="excluir(\${u.id})">Excluir</button><br>\`;
  });
}

async function criarUsuario(){
  await fetch("/usuarios",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      nome:novoNome.value,
      senha:novaSenha.value
    })
  });
  carregarUsuarios();
}

async function excluir(id){
  await fetch("/usuarios/"+id,{method:"DELETE"});
  carregarUsuarios();
}

// ✅ CHAVES
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
      motivo:motivo.value,
      usuario:usuarioUso.value
    })
  });

  nome.value=empresa.value=funcao.value=cracha.value=chave.value="";
  carregar();
}

// ✅ RENDER
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
<td>\${d.usuario}</td>
<td>\${d.devolvido?'DEVOLVIDO':(atrasado?'VENCIDO':'EM DIA')}</td>
<td><button onclick="devolver(\${d.id})">Devolver</button></td>
</tr>\`;
  });
}

async function devolver(id){
  await fetch("/dados/"+id,{method:"PUT"});
  carregar();
}

// 🔍 BUSCA
function filtrar(){
  let txt=busca.value.toLowerCase();
  let f=dados.filter(d=>
    d.nome.toLowerCase().includes(txt) ||
    d.usuario.toLowerCase().includes(txt)
  );
  render(f);
}

// ✅ EXCEL
function exportarExcel(){
  let csv="Nome,Usuário\\n";
  dados.forEach(d=>{
    csv+=\`\${d.nome},\${d.usuario}\\n\`;
  });
  let blob=new Blob([csv]);
  let link=document.createElement("a");
  link.href=URL.createObjectURL(blob);
  link.download="relatorio.csv";
  link.click();
}

</script>

</body>
</html>
`));

app.listen(process.env.PORT||3000);
