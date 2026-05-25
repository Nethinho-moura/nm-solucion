const express = require("express");
const { Pool } = require("pg");

const app = express();
app.use(express.json());

// ✅ BANCO
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ✅ CRIA TABELA
(async () => {
  try {
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
    console.log("✅ Banco conectado");
  } catch (err) {
    console.error("❌ Erro banco:", err);
  }
})();

// ✅ API
app.get("/dados", async (req, res) => {
  const r = await pool.query("SELECT * FROM chaves ORDER BY id DESC");
  res.json(r.rows);
});

app.post("/dados", async (req, res) => {
  const d = req.body;

  await pool.query(
    "INSERT INTO chaves (nome,empresa,funcao,cracha,chave,motivo,data,devolvido) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
    [d.nome, d.empresa, d.funcao, d.cracha, d.chave, d.motivo, new Date(), false]
  );

  res.sendStatus(200);
});

app.put("/dados/:id", async (req, res) => {
  await pool.query(
    "UPDATE chaves SET devolvido=true WHERE id=$1",
    [req.params.id]
  );
  res.sendStatus(200);
});

app.delete("/dados/:id", async (req, res) => {
  await pool.query(
    "DELETE FROM chaves WHERE id=$1",
    [req.params.id]
  );
  res.sendStatus(200);
});

// ✅ FRONT
app.get("/", (req, res) => {
  res.send(`
  <html>
  <body style="font-family:Arial;text-align:center">
    <h2>✅ SISTEMA RODANDO</h2>
    <p>API ativa</p>
    <a href="/dados">Ver Dados</a>
  </body>
  </html>
  `);
});

// ✅ SERVIDOR
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🔥 Rodando na porta " + PORT);
});
