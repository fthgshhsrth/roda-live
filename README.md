# Arraiá das Baratas · Roda Live 3D 🪳
Uma festa interativa para TikTok: baratas humanoides com roupas e acessórios, casal no centro, banda de cinco músicos e DJ. Todos os modelos, instrumentos e movimentos são gerados em Three.js/WebGL2, sem CDN.

<img src="docs/preview-vertical.png" width="420" alt="Festa 3D com banda, casal, DJ e balões dos doadores">

## Presentes e papéis
| Ação | Presente configurado | Valor por unidade |
| --- | --- | --- |
| Entrar na roda | Rosa | 1 moeda |
| Ser o noivo | Mãos fazendo coração / Heart Hands / Heart Me | Conforme o presente |
| Ser a noiva | Rosa de 10 moedas | 10 moedas |
| Integrar a banda | Rosquinha / Doughnut | 30 moedas |
| Ser DJ | Boné / Cap | 99 moedas |
| Acabar e reiniciar a festa | Serenata de arraiá | 2999 moedas |

O valor é o de uma unidade do presente, não a soma do combo. Dez rosas comuns continuam sendo rosas comuns e não concedem a vaga de noiva.

**Nomes e IDs podem variar no catálogo do TikTok.** No painel, conecte a live e clique em **Presentes da live** para selecionar os presentes corretos e salvar o mapa. Também é possível editar os nomes, IDs e moedas manualmente. O reinício exige o presente configurado e valor unitário de 2999; não é acionado apenas pelo valor gasto.

O conector recebe o valor unitário nos metadados do presente. Se esses dados estiverem ausentes e o nome for ambíguo, a ação não é aplicada. O catálogo depende de uma conexão TikTok real, que deve ser conferida antes de transmitir.

## Como a festa funciona
- A rosa coloca o doador na roda com seu nome e renova o tempo de permanência.
- Noivo e noiva são disputados separadamente. Quem envia o presente ocupa o papel até outro doador substituí-lo.
- A banda tem **sanfona, vitrola, bateria, gaita e saxofone**. Os cinco músicos ficam em um palco atrás da roda, ainda visível na visão geral.
- As primeiras cinco rosquinhas de doadores diferentes ocupam as cinco posições. Depois, novos doadores substituem as posições em rodízio. Um mesmo doador não ocupa duas posições.
- O boné coloca o doador no posto de DJ, com console e fones.
- Cada pessoa ocupa um único papel. Ao assumir outro, libera o anterior. Um substituído retorna à roda se houver vaga; caso contrário, sai da cena.
- Papéis especiais não expiram pelo tempo normal da roda. Os nomes aparecem em balões sobre os personagens.
- A Serenata de 2999 reinicia participantes, casal, banda, DJ, contadores e áudio. Mantém o mapa de presentes, as configurações, a conexão e os arquivos de música locais. O nome de quem reiniciou aparece no aviso.

A câmera faz closes suaves, prioriza papéis recém-assumidos e participantes recentes, e volta ao noivo periodicamente. A visão geral enquadra roda, palco e DJ. Na entrada por rosa, o personagem acena para a câmera. Comentários procuram espaço sem cobrir corpos, nomes ou outras bolhas.

Os músicos animam os instrumentos e o DJ opera o console. O áudio da live vem do player/downloader; não são reproduzidas oito faixas de instrumentos simultaneamente.

## Executar
Instale Node.js 22+:

~~~sh
npm ci
npm start
~~~

Painel: http://localhost:3000
Cena: http://localhost:3000/overlay.html

No Windows, **INICIAR.bat** mantém o servidor no terminal. **ABRIR-LIVE.bat** inicia o servidor se necessário e abre a cena em uma janela dedicada de Edge/Chrome, sem barra de endereço.

## TikTok Live Studio
1. Execute ABRIR-LIVE.bat.
2. Adicione uma fonte de **Captura de janela**.
3. Selecione a janela **BARATAS NA PISTA**.
4. Capture o áudio da janela ou a saída do computador.

A composição se adapta à janela vertical ou horizontal. A tecla F alterna tela cheia. Os controles desaparecem após dois segundos sem mover o mouse. O modo leve reduz a resolução e desliga sombras; mantenha a aceleração gráfica do navegador ativada.

Alternativa: use a cena como fonte de navegador em 1080 × 1920 ou 1920 × 1080. A prévia do painel é silenciosa; mantenha apenas uma cena emitindo áudio.

## Música
Instale yt-dlp, FFmpeg e ffprobe no PATH ou coloque os executáveis em tools/. INSTALAR-AUDIO.ps1 auxilia via winget no Windows.

Cole um link de vídeo compatível com yt-dlp e clique em **Baixar e tocar na live**. O servidor extrai MP3 para music/ e inicia automaticamente a faixa na cena. Há pausa, retomada, volume, posição e cancelamento.

Um vídeo por vez, sem playlists ou streams ao vivo, com limite de 1 GB e uma hora. Use conteúdo autorizado. Se a festa for reiniciada, o download em andamento é cancelado e não pode reativar o áudio da festa anterior.

## Conexão TikTok
Digite o @ de uma conta ao vivo. O conector é não oficial e depende do TikTok e do provedor de assinatura. Se exigida, defina EULER_API_KEY no ambiente antes de iniciar; arquivos .env não são lidos automaticamente. Nunca publique credenciais.

## Verificação
~~~sh
npm test
node qa-party.mjs
~~~

Os testes de regras cobrem valores unitários, combos, papéis exclusivos, rodízio, substituições, limites, migração e reinício. A verificação visual usa Edge no Windows com WebGL2, testa os cinco instrumentos, casal, DJ, balões, troca de papéis e Serenata. Ela usa servidor e dados isolados na porta 3011, sem limpar a sessão de transmissão.

As entradas antigas qa.mjs, qa-camera.mjs e qa-wedding.mjs encaminham ao teste atual. Resultados e capturas ficam em verificacao/, ignorados pelo Git. O teste não efetua compras nem envia presentes reais.

A captura dentro do TikTok Live Studio e os IDs efetivos dos presentes exigem conferência no computador e na conta da transmissão.

## Arquivos
| Arquivo | Responsabilidade |
| --- | --- |
| party.js / wheel.js | Regras dos presentes e estado da festa |
| public/party-layout.js | Papéis e distribuição do elenco |
| public/roach.js | Baratas humanoides, roupas e movimentos |
| public/instruments.js | Sanfona, vitrola, bateria, gaita, sax e console |
| public/backstage.js | Palco da banda e área do DJ |
| public/scene3d.js | Câmera, luzes, balões e overlay |
| server.js / media.js / music.js | Servidor, downloader e áudio |

O servidor escuta em 127.0.0.1. PORT altera a porta; dados ficam em data/state.json e MP3 em music/. Executáveis, dados locais, credenciais e testes visuais são ignorados pelo Git. A migração instala o novo mapa de seis presentes e mantém as outras preferências.

[Three.js](https://threejs.org/) · [TikTok Live Connector](https://github.com/zerodytrash/TikTok-Live-Connector) · [yt-dlp](https://github.com/yt-dlp/yt-dlp) · [FFmpeg](https://ffmpeg.org/)
## Desenvolvimento com menos contexto
RTK, Ponytail, Headroom e o mapa de módulos estão documentados em [docs/tooling.md](docs/tooling.md).
