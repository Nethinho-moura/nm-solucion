import express from "express";
import pkg from "pg";
const { Pool } = pkg;

const app = express();
app.use(express.json());

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
      data TIMESTAMP,
      devolvido BOOLEAN
    )
  `);
})();

app.get("/dados", async (req,res)=>{
  const r = await pool.query("SELECT * FROM chaves ORDER BY id DESC");
  res.json(r.rows);
});

app.post("/dados", async (req,res)=>{
  const d=req.body;

  await pool.query(
    "INSERT INTO chaves (nome,empresa,funcao,cracha,chave,motivo,data,devolvido) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
    [d.nome,d.empresa,d.funcao,d.cracha,d.chave,d.motivo,new Date(),false]
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

https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js

<style>
body {font-family:Arial;margin:0;background:#eef2f7;}

header{
  background:#0b3c5d;
  color:white;
  padding:10px;
}

.top-bar{
  display:flex;
  gap:6px;
  flex-wrap:wrap;
  margin-top:5px;
  align-items:center;
}

.top-bar button{
  background:white;
  color:#0b3c5d;
  font-size:11px;
  padding:4px 6px;
}

.top-bar input{
  font-size:11px;
  padding:4px;
}

.container{padding:15px;}

.form-grid{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(160px,1fr));
  gap:6px;
}

input,select{padding:6px;}

button{
  background:#0b3c5d;
  color:white;
  border:none;
  padding:7px;
}

table{
  width:100%;
  border-collapse:collapse;
  margin-top:10px;
}

th,td{
  border:1px solid #ccc;
  padding:6px;
  font-size:12px;
}

th{
  background:#0b3c5d;
  color:white;
}

</style>
</head>

<body>

<div id="login" style="text-align:center;padding:40px">
<h2>NM SOLUCION</h2>
<input type="password" id="senha">
<button onclick="entrar()">Entrar</button>
</div>

<div id="sistema" style="display:none">

<header>
<h3>Controle de Chaves</h3>

<!-- ✅ TUDO NA BARRA -->
<div class="top-bar">
<button onclick="pdfGeral()">Geral</button>
<button onclick="pdfAtrasados()">Atrasados</button>
<button onclick="backup()">Backup</button>
<input id="busca" placeholder="🔎 Buscar" oninput="filtrar()">
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
<option>Perda</option>
<option>Serviço</option>
</select>

</div>

<br>
<button onclick="emprestar()">Emprestar</button>

<table>
<thead>
<tr>
