import express from "express";

const app = express();
app.use(express.json());

// 🔥 BANCO SIMPLES (em memória)
let dados = [];

// ✅ API

app.get("/dados", (req, res) => {
  res.json(dados);
});

app.post("/dados", (req, res) => {
  const novo = { ...req.body, id: Date.now() };
  dados.push(novo);
  res.json(novo);
});

app.put("/dados/:id", (req, res) => {
  const id = Number(req.params.id);
  dados = dados.map(d => d.id === id ? { ...d, ...req.body } : d);
  res.sendStatus(200);
});

app.delete("/dados/:id", (req, res) => {
  const id = Number(req.params.id);
  dados = dados.filter(d => d.id !== id);
  res.sendStatus(200);
});

// ✅ FRONTEND (SEU SISTEMA)
app.get("/", (req, res) => {
res.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>NM SOLUCION</title>

<style>
body {font-family:Arial;background:linear-gradient(135deg,#0b3c5d,#1f6fa5);margin:0;}
#login {width:300px;margin:120px auto;background:white;padding:20px;text-align:center;}
.container {padding:20px;background:#eef2f7;}
.card {background:white;padding:15px;margin-bottom:15px;}
input,select,button{margin:5px;padding:8px;width:100%;}
table{width:100%;border-collapse:collapse;}
th,td{border:1px solid #ccc;padding:5px;}
button:hover{background:#155a87;color:white;}
tr:hover{background:#eee;}
</style>
</head>

<body>

<div id="login">
<h2>NM SOLUCION</h2>
<input id="senha" type="password">
<button onclick="entrar()">Entrar</button>
</div>

<div id="sistema" style="display:none;">
<div class="container">

<div class="card">
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
</div>

<div class="card">
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
</div>

<script>

let dados = [];

function entrar(){
  if(senha.value==="NMDIGITAL"){
    login.style.display="none";
    sistema.style.display="block";
    carregar();
  }
}

// ✅ pegar dados do servidor
async function carregar(){
  const res = await fetch("/dados");
  dados = await res.json();
  render();
}

// ✅ emprestar
async function emprestar(){
  if(!nome.value||!empresa.value||!funcao.value||!chave.value||!motivo.value){
    alert("Preencha tudo");
    return;
  }

  await fetch("/dados", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({
      nome:nome.value,
      empresa:empresa.value,
      funcao:funcao.value,
      chave:chave.value,
      motivo:motivo.value,
      data:new Date(),
      devolvido:false
    })
  });

  nome.value=empresa.value=funcao.value=chave.value="";
  motivo.value="";

  carregar();
}

// ✅ devolver
async function devolver(id){
  await fetch("/dados/"+id, {
    method:"PUT",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({ devolvido:true })
  });

  carregar();
}

// ✅ excluir
async function excluir(id){
  let senha = prompt("Senha:");
  if(senha==="2805"){
    await fetch("/dados/"+id,{ method:"DELETE"});
    carregar();
  }
}

// ✅ render
function render(){
  tabela.innerHTML="";
  let agora=new Date();

  dados.forEach(d=>{
    let prazo=new Date(new Date(d.data).getTime()+48*60*60*1000);

    let status="", cor="";
    if(d.devolvido){status="DEVOLVIDO";cor="gray";}
    else if(agora>prazo){status="VENCIDO";cor="red";}
    else{status="EM DIA";cor="green";}

    tabela.innerHTML += \`
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
