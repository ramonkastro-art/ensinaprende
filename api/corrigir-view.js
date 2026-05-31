module.exports = async function handler(req, res) {
  const id = (req.query.id || '').replace(/[^A-Za-z0-9\-]/g, '');

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<title>Aprende+ | Corrigir Prova</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root{--bg:#f4f6fb;--surface:#fff;--surface2:#f0f3fa;--border:#e2e8f4;--accent:#2563eb;--text:#1e2433;--muted:#7c8499;--green:#059669;--red:#dc2626;}
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;}
.header{display:flex;height:52px;}
.s1{flex:1;background:rgb(31,119,150);display:flex;align-items:center;padding:0 16px;}
.s1 strong{color:#fff;font-size:15px;margin-right:8px;}
.s1 span{color:rgba(255,255,255,.8);font-size:11px;}
.s2{width:80px;background:rgb(230,185,55);}
.s3{width:80px;background:rgb(214,120,40);display:flex;align-items:center;justify-content:center;}
.s3 a{color:#fff;font-size:12px;text-decoration:none;padding:6px 10px;background:rgba(0,0,0,.15);border-radius:6px;}
.main{max-width:500px;margin:0 auto;padding:16px 16px 80px;}
.card{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:18px;margin-bottom:14px;}
.info{background:var(--surface2);border-radius:10px;padding:12px 14px;font-size:13px;line-height:1.8;margin-bottom:14px;color:var(--muted);}
.info strong{color:var(--text);}
.grade-row{display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--surface);border:1.5px solid var(--border);border-radius:12px;margin-bottom:6px;transition:all .15s;}
.grade-row.acertou{background:rgba(5,150,105,.06);border-color:rgba(5,150,105,.3);}
.grade-row.errou{background:rgba(220,38,38,.06);border-color:rgba(220,38,38,.2);}
.qnum{font-size:12px;font-weight:700;color:var(--muted);width:22px;flex-shrink:0;}
.opcoes{display:flex;gap:5px;flex:1;}
.bolinha{width:36px;height:36px;border-radius:50%;border:2px solid var(--border);background:var(--surface2);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:var(--muted);cursor:pointer;transition:all .15s;-webkit-tap-highlight-color:transparent;user-select:none;}
.bolinha.marcada{background:var(--text);border-color:var(--text);color:#fff;}
.bolinha.certa{background:var(--green);border-color:var(--green);color:#fff;}
.bolinha.errada{background:var(--red);border-color:var(--red);color:#fff;}
.status{font-size:18px;width:24px;text-align:center;}
.resultado{background:linear-gradient(135deg,var(--accent),#1d4ed8);color:#fff;border-radius:16px;padding:24px;text-align:center;margin-top:14px;display:none;}
.num{font-size:52px;font-weight:700;line-height:1;}
.lbl{font-size:13px;opacity:.85;margin-top:4px;}
.nota-box{margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,.2);}
.nota-box label{font-size:11px;opacity:.8;display:block;margin-bottom:8px;}
.nota-inputs{display:flex;align-items:center;justify-content:center;gap:10px;}
.nota-inputs input{width:80px;padding:8px;border:none;border-radius:8px;text-align:center;font-family:'DM Sans',sans-serif;font-size:16px;font-weight:700;color:var(--text);}
.nota-val{font-size:30px;font-weight:700;}
.btn-prox{margin-top:16px;padding:12px 24px;background:rgba(255,255,255,.2);border:2px solid rgba(255,255,255,.4);color:#fff;border-radius:10px;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;cursor:pointer;}
.loading{text-align:center;padding:60px 20px;}
.spinner{width:44px;height:44px;border:4px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 14px;}
@keyframes spin{to{transform:rotate(360deg)}}
.erro{text-align:center;padding:40px 20px;color:var(--muted);}
.erro .icon{font-size:48px;margin-bottom:12px;}
</style>
</head>
<body>
<div class="header">
  <div class="s1"><strong>APRENDE+</strong><span>Corrigir Prova</span></div>
  <div class="s2"></div>
  <div class="s3"><a href="/avaliacao">Inicio</a></div>
</div>
<div class="main">
  <div id="loading" class="loading">
    <div class="spinner"></div>
    <p style="color:var(--muted);font-size:14px;">Carregando avaliacao...</p>
  </div>
  <div id="erro" class="erro" style="display:none">
    <div class="icon">404</div>
    <p id="erroMsg">Avaliacao nao encontrada.</p>
  </div>
  <div id="conteudo" style="display:none">
    <div class="info" id="infoBox"></div>
    <div class="card">
      <div style="font-size:12px;color:var(--muted);margin-bottom:12px;">Toque na resposta do aluno. Toque novamente para desmarcar.</div>
      <div id="grade"></div>
    </div>
    <div class="resultado" id="resultado">
      <div class="num" id="numAcertos">0</div>
      <div class="lbl" id="labelAcertos">acertos</div>
      <div class="nota-box">
        <label>Prova vale quantos pontos?</label>
        <div class="nota-inputs">
          <input type="number" id="valorProva" value="10" min="1" oninput="calcNota()">
          <span style="opacity:.7;font-size:13px;">pontos</span>
          <div class="nota-val" id="notaFinal">10,0</div>
        </div>
      </div>
      <button class="btn-prox" onclick="proximaCorrecao()">+ Proxima prova</button>
    </div>
  </div>
</div>
<script>
var LETRAS = ['A','B','C','D','E'];
var avaliacao = null;
var respostas = [];
var AV_ID = document.getElementById('av-id-data').getAttribute('data-id');

function mostrarErro(msg) {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('erroMsg').textContent = msg || 'Avaliacao nao encontrada.';
  document.getElementById('erro').style.display = 'block';
}

function carregar() {
  if (!AV_ID) { mostrarErro('ID nao encontrado na URL.'); return; }

  if (AV_ID.indexOf('LOCAL-') === 0) {
    var gabStr = AV_ID.replace('LOCAL-', '');
    var questoes = gabStr.split('').map(function(g, i) {
      return { enunciado: 'Questao ' + (i+1), gabarito: g };
    });
    avaliacao = { id: AV_ID, config: { comp: '', ano: '', turma: '', conteudo: '', qtd: questoes.length }, questoes: questoes };
    respostas = new Array(questoes.length).fill('');
    document.getElementById('loading').style.display = 'none';
    document.getElementById('conteudo').style.display = 'block';
    renderInfo();
    renderGrade();
    return;
  }

  fetch('/api/avaliacao-buscar?id=' + encodeURIComponent(AV_ID))
    .then(function(r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function(data) {
      avaliacao = data;
      respostas = new Array(avaliacao.questoes.length).fill('');
      document.getElementById('loading').style.display = 'none';
      document.getElementById('conteudo').style.display = 'block';
      renderInfo();
      renderGrade();
    })
    .catch(function(e) {
      mostrarErro('Erro ao carregar: ' + e.message);
    });
}

function renderInfo() {
  var c = avaliacao.config;
  var html = '';
  if (c.comp) html += '<strong>' + c.comp + '</strong> &middot; ' + c.ano;
  if (c.turma) html += ' &middot; ' + c.turma;
  html += ' &middot; ' + avaliacao.questoes.length + ' questoes';
  if (c.conteudo) html += '<br><span style="font-size:12px">' + c.conteudo + '</span>';
  document.getElementById('infoBox').innerHTML = html;
}

function renderGrade() {
  var grade = document.getElementById('grade');
  grade.innerHTML = '';
  avaliacao.questoes.forEach(function(q, qi) {
    var resp = respostas[qi];
    var respondeu = resp !== '';
    var acertou = resp === q.gabarito;
    var row = document.createElement('div');
    row.className = 'grade-row' + (respondeu ? (acertou ? ' acertou' : ' errou') : '');
    var bolinhas = LETRAS.map(function(l) {
      var cls = 'bolinha';
      if (resp === l) cls += respondeu ? (acertou ? ' certa' : ' errada') : ' marcada';
      return '<div class="' + cls + '" onclick="marcar(' + qi + ',\'' + l + '\')">' + l + '</div>';
    }).join('');
    row.innerHTML = '<div class="qnum">' + (qi+1) + '</div><div class="opcoes">' + bolinhas + '</div><div class="status">' + (!respondeu ? '' : acertou ? '&#x2705;' : '&#x274C;') + '</div>';
    grade.appendChild(row);
  });
}

function marcar(qi, letra) {
  respostas[qi] = respostas[qi] === letra ? '' : letra;
  renderGrade();
  if (respostas.every(function(r){ return r !== ''; })) mostrarResultado();
}

function mostrarResultado() {
  var total = avaliacao.questoes.length;
  var acertos = avaliacao.questoes.filter(function(q,i){ return respostas[i] === q.gabarito; }).length;
  document.getElementById('numAcertos').textContent = acertos;
  document.getElementById('labelAcertos').textContent = 'acertos de ' + total;
  document.getElementById('resultado').style.display = 'block';
  calcNota();
  document.getElementById('resultado').scrollIntoView({behavior:'smooth'});
}

function calcNota() {
  var total = avaliacao.questoes.length;
  var acertos = avaliacao.questoes.filter(function(q,i){ return respostas[i] === q.gabarito; }).length;
  var val = parseFloat(document.getElementById('valorProva').value) || 10;
  document.getElementById('notaFinal').textContent = ((acertos/total)*val).toFixed(1).replace('.',',');
}

function proximaCorrecao() {
  respostas = new Array(avaliacao.questoes.length).fill('');
  document.getElementById('resultado').style.display = 'none';
  renderGrade();
  window.scrollTo({top:0,behavior:'smooth'});
}

carregar();
</script>
<span id="av-id-data" data-id="` + id + `" style="display:none"></span>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
};
