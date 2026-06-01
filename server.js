```javascript
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

(async ()=>{

  try{

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

  }catch(err){

    console.log(err);

  }

})();



// ===============================
// API
// ===============================

// LISTAR
app.get("/dados", async (req,res)=>{

  const r = await pool.query(
    "SELECT * FROM chaves ORDER BY id DESC"
  );

  res.json(r.rows);

});



// CADASTRAR
app.post("/dados", async (req,res)=>{

  const d = req.body;

  await pool.query(

    `
    INSERT INTO chaves
    (
      nome,
      empresa,
      funcao,
      cracha,
      chave,
      motivo,
      data,
      devolvido
    )

    VALUES
    (
      $1,$2,$3,$4,$5,$6,$7,$8
    )
    `,

    [
      d.nome,
      d.empresa,
      d.funcao,
      d.cracha,
      d.chave,
      d.motivo,
      new Date(),
      false
    ]

  );

  res.sendStatus(200);

});



// DEVOLVER
app.put("/dados/:id", async (req,res)=>{

  await pool.query(

    "UPDATE chaves SET devolvido=true WHERE id=$1",

    [req.params.id]

  );

  res.sendStatus(200);

});



// EXCLUIR
app.delete("/dados/:id", async (req,res)=>{

  await pool.query(

    "DELETE FROM chaves WHERE id=$1",

    [req.params.id]

  );

  res.sendStatus(200);

});



// ===============================
// FRONTEND
// ===============================

app.get("/", (req,res)=>res.send(`

<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<title>Controle de Chaves</title>

<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>

<style>

body{
  margin:0;
  font-family:Arial;
  background:#eef2f7;
}

header{
  background:#0b3c5d;
  color:white;
  padding:10px;
}

.titulo{
  text-align:center;
  font-size:24px;
  font-weight:bold;
}

.top-bar{
  display:flex;
  justify-content:center;
  gap:6px;
  flex-wrap:wrap;
  margin-top:8px;
}

.top-bar button{
  background:white;
  color:#0b3c5d;
  border:none;
  padding:6px 10px;
  cursor:pointer;
  border-radius:4px;
  font-weight:bold;
}

.top-bar input{
  padding:6px;
}

.container{
  padding:15px;
}

.form-grid{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(150px,1fr));
  gap:8px;
}

input,select{
  padding:8px;
}

button{
  background:#0b3c5d;
  color:white;
  border:none;
  padding:8px;
  cursor:pointer;
}

.emp{
  text-align:center;
  margin-top:10px;
}

table{
  width:100%;
  border-collapse:collapse;
  margin-top:15px;
  background:white;
}

th,td{
  border:1px solid #ccc;
  padding:8px;
  font-size:12px;
  text-align:center;
}

th{
  background:#0b3c5d;
  color:white;
}

</style>

</head>

<body>



<!-- LOGIN -->

<div id="login" style="text-align:center;padding:40px">

<h2>NM SOLUCION</h2>

<input type="password" id="senha">

<br><br>

<button onclick="entrar()">
Entrar
</button>

</div>





<!-- SISTEMA -->

<div id="sistema" style="display:none">

<header>

<div class="titulo">
CONTROLE DE CHAVES
</div>

<div class="top-bar">

<button onclick="pdfGeral()">
Geral
</button>

<button onclick="pdfAtrasados()">
Atrasados
</button>

<button onclick="backup()">
Backup
</button>

<input
  type="file"
  onchange="restaurar(event)"
  style="background:white;"
>

<input
  id="busca"
  placeholder="🔎 Buscar"
  oninput="filtrar()"
>

</div>

</header>





<div class="container">

<div class="form-grid">

<input id="nome" placeholder="Nome">

<input id="empresa" placeholder="Empresa">

<input id="funcao" placeholder="Função">

<input id="cracha" placeholder="Crachá">

<input id="chave" placeholder="Chave">

<select id="motivo">

<option>Perca</option>

<option>Serviço/Manutenção</option>

</select>

</div>



<div class="emp">

<button onclick="emprestar()">
Emprestar
</button>

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
<th>Ações</th>

</tr>

</thead>

<tbody id="tabela"></tbody>

</table>

</div>

</div>





<script>

let dados = [];



// LOGIN
function entrar(){

  if(senha.value === "NMDIGITAL"){

    login.style.display = "none";

    sistema.style.display = "block";

    carregar();

  }

}



// CARREGAR
async function carregar(){

  const r = await fetch("/dados");

  dados = await r.json();

  render();

}



// EMPRESTAR
async function emprestar(){

  if(
    !nome.value ||
    !empresa.value ||
    !funcao.value ||
    !cracha.value ||
    !chave.value ||
    !motivo.value
  ){

    alert("Preencha tudo");

    return;

  }

  await fetch("/dados",{

    method:"POST",

    headers:{
      "Content-Type":"application/json"
    },

    body:JSON.stringify({

      nome:nome.value,
      empresa:empresa.value,
      funcao:funcao.value,
      cracha:cracha.value,
      chave:chave.value,
      motivo:motivo.value

    })

  });

  nome.value="";
  empresa.value="";
  funcao.value="";
  cracha.value="";
  chave.value="";

  carregar();

}



// TABELA
function render(lista=dados){

  tabela.innerHTML = "";

  let agora = new Date();

  lista.forEach(d=>{

    let emp = new Date(d.data);

    let venc = new Date(
      emp.getTime()+48*60*60*1000
    );

    let cor = "green";

    let status = "EM DIA";

    if(d.devolvido){

      cor="gray";
      status="DEVOLVIDO";

    }

    else if(agora > venc){

      cor="red";
      status="VENCIDO";

    }

    tabela.innerHTML +=

    '<tr>'+

    '<td>'+d.nome+'</td>'+

    '<td>'+d.empresa+'</td>'+

    '<td>'+d.funcao+'</td>'+

    '<td>'+d.cracha+'</td>'+

    '<td>'+d.chave+'</td>'+

    '<td style="color:'+cor+';font-weight:bold">'+status+'</td>'+

    '<td>'+

    '<button onclick="devolver('+d.id+')">Devolver</button> '+

    '<button onclick="excluir('+d.id+')">Excluir</button>'+

    '</td>'+

    '</tr>';

  });

}



// DEVOLVER
async function devolver(id){

  await fetch("/dados/"+id,{

    method:"PUT"

  });

  carregar();

}



// EXCLUIR
async function excluir(id){

  if(prompt("Senha:") === "2805"){

    await fetch("/dados/"+id,{

      method:"DELETE"

    });

    carregar();

  }

}



// BUSCA
function filtrar(){

  let t = busca.value.toLowerCase();

  render(

    dados.filter(d=>

      d.nome.toLowerCase().includes(t)

    )

  );

}



// BACKUP
function backup(){

  const blob = new Blob([
    JSON.stringify(dados,null,2)
  ]);

  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);

  link.download = "backup.json";

  link.click();

}



// RESTAURAR
function restaurar(event){

  let senha = prompt("Senha:");

  if(senha !== "2805"){

    alert("Senha incorreta");

    return;

  }

  const file = event.target.files[0];

  const reader = new FileReader();

  reader.onload = async e=>{

    let lista = JSON.parse(e.target.result);

    for(let i of lista){

      delete i.id;

      await fetch("/dados",{

        method:"POST",

        headers:{
          "Content-Type":"application/json"
        },

        body:JSON.stringify(i)

      });

    }

    alert("Restaurado!");

    carregar();

  };

  reader.readAsText(file);

}



// PDF GERAL
function pdfGeral(){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let y = 15;

  // ✅ TÍTULO
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("RELATÓRIO GERAL DE CHAVES", 105, y, { align: "center" });

  y += 10;

  // ✅ CONFIG COLUNAS
  const col = {
    nome: { x: 10, w: 40 },
    empresa: { x: 50, w: 45 },
    funcao: { x: 95, w: 40 },
    chave: { x: 165, w: 35 }
  };

  // ✅ CABEÇALHO
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setFillColor(11, 60, 93);
  doc.setTextColor(255);

  doc.rect(10, y-4, 190, 6, "F");

  doc.text("Nome", col.nome.x, y);
  doc.text("Empresa", col.empresa.x, y);
  doc.text("Função", col.funcao.x, y);
  doc.text("Chave", col.chave.x, y);

  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(0);

  let zebra = false;

  dados.forEach((d, i) => {

    let emp = new Date(d.data);
    let venc = new Date(emp.getTime() + 48*60*60*1000);

    // ✅ QUEBRA DE TEXTO
    let nome = doc.splitTextToSize(d.nome || "", col.nome.w);
    let empresa = doc.splitTextToSize(d.empresa || "", col.empresa.w);
    let funcao = doc.splitTextToSize(d.funcao || "", col.funcao.w);
    let chave = doc.splitTextToSize(d.chave || "", col.chave.w);

    let altura = Math.max(
      nome.length,
      empresa.length,
      funcao.length,
      chave.length
    ) * 4 + 3;

    // ✅ NOVA PÁGINA
    if (y + altura > 280) {
      doc.addPage();
      y = 15;
    }
    ``

    // ✅ ZEBRA (linha alternada)
    if (zebra) {
      doc.setFillColor(240, 240, 240);
      doc.rect(10, y-3, 190, altura, "F");
    }
    zebra = !zebra;

    // ✅ TEXTO
    doc.text(nome, col.nome.x, y);
    doc.text(empresa, col.empresa.x, y);
    doc.text(funcao, col.funcao.x, y);
    doc.text(chave, col.chave.x, y);

    y += altura - 2;

    // ✅ LINHA DE INFORMAÇÃO
    doc.setFontSize(7);
    doc.setTextColor(90);

    doc.text(
      "Emp: " + emp.toLocaleDateString() +
      "   |   Venc: " + venc.toLocaleDateString(),
      col.nome.x,
      y
    );

    doc.setFontSize(8);
    doc.setTextColor(0);

    y += 5;

    // ✅ LINHA SEPARADORA
    doc.setDrawColor(200);
    doc.line(10, y, 200, y);

    y += 3;
  });

  // ✅ ABRIR
  window.open(doc.output("bloburl"));
}




// PDF ATRASADOS
function pdfAtrasados(){

  const { jsPDF } = window.jspdf;

  const doc = new jsPDF();

  let y = 15;

  let agora = new Date();

  doc.setFontSize(16);

  doc.setFont(undefined,"bold");

  doc.text(
    "RELATÓRIO DE ATRASADOS",
    10,
    y
  );

  y += 12;

  dados.forEach((d)=>{

    let emp = new Date(d.data);

    let venc = new Date(
      emp.getTime()+48*60*60*1000
    );

    if(!d.devolvido && agora > venc){

      // CAIXA
      doc.rect(10,y,190,30);

      // TITULOS
      doc.setFontSize(8);

      doc.setFont(undefined,"bold");

      doc.text("NOME",12,y+5);

      doc.text("EMPRESA",55,y+5);

      doc.text("FUNÇÃO",95,y+5);

      doc.text("CHAVE",155,y+5);

      // LINHA
      doc.line(10,y+7,200,y+7);

      // DADOS
      doc.setFont(undefined,"normal");

      doc.setFontSize(10);

      doc.text(
        doc.splitTextToSize(
          String(d.nome || ""),
          38
        ),
        12,
        y+14
      );

      doc.text(
        doc.splitTextToSize(
          String(d.empresa || ""),
          30
        ),
        55,
        y+14
      );

      doc.text(
        doc.splitTextToSize(
          String(d.funcao || ""),
          45
        ),
        95,
        y+14
      );

      doc.text(
        doc.splitTextToSize(
          String(d.chave || ""),
          35
        ),
        155,
        y+14
      );

      doc.setFontSize(8);

      doc.text(

        "Emp: " +
        emp.toLocaleDateString() +
        "   |   Venc: " +
        venc.toLocaleDateString(),

        12,
        y+26

      );

      y += 36;

      // NOVA PAGINA
      if(y > 250){

        doc.addPage();

        y = 15;

      }

    }

  });

  window.open(doc.output("bloburl"));

}

</script>

</body>

</html>

`));



// ===============================
// SERVIDOR
// ===============================

app.listen(process.env.PORT || 3000, ()=>{

  console.log("SERVIDOR ONLINE");

});
```
