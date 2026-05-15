import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="pt-br">
<head>
<meta charset="UTF-8">
<title>NM SOLUCION</title>

<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>

<style>
body {
  font-family: Arial;
  background: linear-gradient(135deg, #0b3c5d, #1f6fa5);
  margin: 0;
}
</style>

</head>

<body>

<h1 style="color:white; text-align:center;">Sistema funcionando ✅</h1>

<script>
console.log("OK");
</script>

</body>
</html>
`);
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Servidor rodando");
});
