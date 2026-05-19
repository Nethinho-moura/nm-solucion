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


// ✅ API USUARIOS
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

// ✅ API CHAVES
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

// ✅ FRONTEND
app.get("/", (req,res)=>res.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Controle de Chaves</title>

<style>
body{font-family:Arial;background:#eef2f7;margin:0}
.card{background:white;margin:10px;padding:10px}
button{padding:8px;width:100%;margin:3px;background:#0b3c5d;color:white}
</style>
</head>

<body>

<div class="card">

<h3>Login Admin</h3>
<input type="password" id="admin">
<button onclick="loginAdmin()">Entrar</button>

</div>

<div id="adminPainel" style="display:none" class="card">

<h3>Criar Usuário</h3>
<input id="novoNome" placeholder="Nome">
<input type="password" id="novaSenha" placeholder="Senha">
<button onclick="criarUsuario()">Criar</button>

<h3>Usuários</h3>
<div id="listaUsuarios"></div>

</div>

<div id="loginUser" style="display:none" class="card">

<h3>Login Recepcionista</h3>
<select id="usuarioSelect"></select>
<input type="password" id="senhaUser">
<button onclick="loginUserNow()">Entrar</button>

</div>

<div id="sistema" style="display:none" class="card">

<input id="nome" placeholder="Nome">
<input id="empresa" placeholder="Empresa">
<input id="funcao" placeholder="Função">
<input id="cracha" placeholder="Crachá">
<input id="chave" placeholder="Chave">

<select id="motivo">
<option>Perda</option><option>Serviço</option>
</select>

<!-- ✅ Seleciona usuário -->
<select id="usuarioUso"></select>

<button onclick="emprestar()">Emprestar</button>

</div>

<div class="card">
<table border="1" width="100%">
<thead><tr><th>Nome</th><th>Usuário</th><th>Status</th></tr></thead>
<tbody id="tabela"></tbody>
</table>
</div>

<script>

let usuarios=[];
let dados=[];

async function loginAdmin(){
  if(admin.value==="NMDIGITAL"){
    adminPainel.style.display="block";
    loginUser.style.display="block";
    carregarUsuarios();
  }
}

async function criarUsuario(){
  await fetch("/usuarios",{method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({nome:novoNome.value,senha:novaSenha.value})
  });
  carregarUsuarios();
}

async function carregarUsuarios(){
  const r = await fetch("/usuarios");
  usuarios = await r.json();

  listaUsuarios.innerHTML="";
  usuarioSelect.innerHTML="";
  usuarioUso.innerHTML="";

  usuarios.forEach(u=>{
    listaUsuarios.innerHTML+=\`
      \${u.nome} <button onclick="excluir(\${u.id})">Excluir</button><br>\`;

    usuarioSelect.innerHTML+=\`<option>\${u.nome}</option>\`;
    usuarioUso.innerHTML+=\`<option>\${u.nome}</option>\`;
  });
}

async function excluir(id){
  await fetch("/usuarios/"+id,{method:"DELETE"});
  carregarUsuarios();
}

function loginUserNow(){
  let user = usuarioSelect.value;
  let senha = senhaUser.value;

  let achou = usuarios.find(u=>u.nome===user && u.senha===senha);

  if(achou){
    sistema.style.display="block";
    carregar();
  } else alert("Errado");
}

// ✅ CHAVES

async function carregar(){
  const r = await fetch("/dados");
  dados = await r.json();
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

app.listen(process.env.PORT||3000);
