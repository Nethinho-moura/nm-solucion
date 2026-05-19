import express from "express";
import pkg from "pg";
const { Pool } = pkg;

const app = express();
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ✅ TABELAS
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

// APIs
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

app.delete("/dados/:id", async (req,res)=>{
  await pool.query("DELETE FROM chaves WHERE id=$1",[req.params.id]);
  res.sendStatus(200);
});

// FRONTEND
app.get("/", (req,res)=>res.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Controle de Chaves</title>

<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>

<style>
body{font-family:Arial;margin:0;background:#eef2f7}
header{background:#0b3c5d;color:white;padding:10px;text-align:center}

/* ✅ TOPO FIXO */
.topo{
  display:grid;
  grid-template-columns: repeat(auto-fit,minmax(120px,1fr));
  gap:5px;
  padding:10px;
  background:white;
}

/* CAMPOS PEQUENOS */
input,select,button{
  padding:5px;
  font-size:12px;
}

button{
  background:#0b3c5d;
  color:white;
  border:none;
  cursor:pointer;
}

table{width:100%;border-collapse:collapse;margin-top:10px}
th,td{border:1px solid #ccc;padding:6px;font-size:12px}

.atrasado{
  background:#ffcccc;
  animation:piscando 1s infinite;
}

@keyframes piscando{
  0%{background:#ffcccc;}
  100%{background:white;}
}

</style>
</head>

<body>

<div id="login" style="text-align:center;padding:50px">
<h2>NM SOLUCION</h2>
<input type="password" id="senha">
<button onclick="entrar()">Entrar</button>
</div>

<div id="sistema" style="display:none">

<header><h3>Controle de Chaves</h3></header>

<!-- ✅ TOPO COMPACTO -->
<div class="topo">

<input id="nome" placeholder="Nome">
<input id="empresa" placeholder="Empresa">
<input id="funcao" placeholder="Função">
<input id="cracha" placeholder="Crachá">
<input id="chave" placeholder="Chave">
<select id="motivo"><option>Perda</option><option>Serviço</option></select>
<select id="usuarioUso"></select>

<button onclick="emprestar()">Emprestar</button>

<input id="busca" placeholder="Buscar..." oninput="filtrar()">

<button onclick="backup()">Backup</button>
<button onclick="pdfGeral()">PDF</button>
<button onclick="window.open('/usuariosPage')">Usuários</button>

</div>

<table>
<thead>
<tr>
<th>Nome</th>
<th>Crachá</th>
<th>Chave</th>
<th>Usuário</th>
<th>Status</th>
<th>Ação</th>
</tr>
</thead>
<tbody id="tabela"></tbody>
</table>

</div>

<script>

let dados=[];

// login
function entrar(){
  if(senha.value==="NMDIGITAL"){
    login.style.display="none";
    sistema.style.display="block";
    carregar();
    carregarUsuarios();
  }
}

// usuarios
async function carregarUsuarios(){
  const r = await fetch("/usuarios");
  const usuarios = await r.json();

  usuarioUso.innerHTML="";
  usuarios.forEach(u=>{
    usuarioUso.innerHTML+=\`<option>\${u.nome}</option>\`;
  });
}

// carregar
async function carregar(){
  const r = await fetch("/dados");
  dados = await r.json();
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
      motivo:motivo.value,
      usuario:usuarioUso.value
    })
  });

  carregar();
}

// render
function render(lista=dados){
  tabela.innerHTML="";
  let agora=new Date();

  lista.forEach(d=>{
    let prazo=new Date(d.data);
    prazo.setHours(prazo.getHours()+48);

    let atrasado=!d.devolvido && agora>prazo;

    tabela.innerHTML+=\`
<tr class="\${atrasado?'atrasado':''}">
<td>\${d.nome}</td>
<td>\${d.cracha}</td>
<td>\${d.chave}</td>
<td>\${d.usuario}</td>
<td>\${d.devolvido?'DEVOLVIDO':(atrasado?'VENCIDO':'OK')}</td>
<td>
<button onclick="devolver(\${d.id})">✔</button>
<button onclick="excluir(\${d.id})">✖</button>
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
  render(dados.filter(d => d.nome.toLowerCase().includes(t)));
}

// backup
function backup(){
  const blob=new Blob([JSON.stringify(dados)],{type:"application/json"});
  const link=document.createElement("a");
  link.href=URL.createObjectURL(blob);
  link.download="backup.json";
  link.click();
}

// PDF
function pdfGeral(){
  const {jsPDF}=window.jspdf;
  let doc=new jsPDF();
  let y=10;

  dados.forEach(d=>{
    doc.text(\`\${d.nome} - \${d.chave}\`,10,y);
    y+=6;
  });

  doc.save("relatorio.pdf");
}

</script>

</body>
</html>
`));

// pagina usuarios
app.get("/usuariosPage",(req,res)=>res.send(`
<!DOCTYPE html>
<html>
<body>
<h2>Usuários</h2>

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
    lista.innerHTML+=u.nome+" <button onclick='excluir("+u.id+")'>Excluir</button><br>";
  });
}

async function criar(){
  await fetch("/usuarios",{method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({nome:nome.value,senha:senha.value})
  });
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
``
