# Arraiá das Baratas · Roda Live 3D 🪳
Uma festa interativa para TikTok: baratas com carapaça segmentada em tons naturais, cabeça estreita, olhos laterais, mandíbulas, dois braços, duas pernas, antenas longas, asas com nervuras e roupas variadas, casal no centro, banda de cinco músicos e DJ. Todos os modelos, instrumentos e movimentos são gerados em Three.js/WebGL2, sem CDN.

<img src="docs/preview-vertical.png" width="420" alt="Festa 3D com banda, casal, DJ e balões dos doadores">

## Presentes e papéis
| Ação | Presente configurado | Valor por unidade |
| --- | --- | --- |
| Entrar na roda | Rosa | 1 moeda |
| Ser o noivo | Mãos Fazendo Coração / Finger Heart | 5 moedas |
| Ser a noiva | Rosa de 10 moedas | 10 moedas |
| Integrar a banda | Rosquinha / Doughnut | 30 moedas |
| Ser DJ | Boné / Cap | 99 moedas |
| Acabar e reiniciar a festa | Serenata de arraiá | 2999 moedas |

O valor é o de uma unidade do presente, não a soma do combo. Dez rosas comuns continuam sendo rosas comuns e não concedem a vaga de noiva.

**O catálogo é carregado automaticamente ao conectar.** O overlay mostra os seis itens com nome, imagem, moedas e ação. Uma ação só é confirmada quando há uma correspondência única por nome/ID e custo. Se o presente não existir na live, aparece indisponível. Se houver variantes, selecione o item em **Presentes da live** e salve o mapa. Nunca escolhemos um presente apenas por ter o mesmo preço.

Os valores da tabela são os configurados para esta festa, não uma garantia do catálogo atual do TikTok. O valor é por unidade. O noivo usa `Finger Heart` (Mãos Fazendo Coração); `Hand Heart` (Mãos em Coração) e `Heart Me` são presentes diferentes e não concedem esse papel. O reinício requer o item confirmado e valor de 2999 moedas. Catálogo, itens sazonais e captura real devem ser conferidos na conta que transmitirá.
## Como a festa funciona
- A rosa coloca o doador na roda com seu nome e renova o tempo de permanência.
- Noivo e noiva são disputados separadamente. Quem envia o presente ocupa o papel até outro doador substituí-lo.
- A banda tem **sanfona, vitrola, bateria, gaita e saxofone**. Os cinco músicos ficam em um palco atrás da roda, ainda visível na visão geral.
- As primeiras cinco rosquinhas de doadores diferentes ocupam as cinco posições. Depois, novos doadores substituem as posições em rodízio. Um mesmo doador não ocupa duas posições.
- O boné coloca o doador no posto de DJ, com console e fones.
- Cada pessoa ocupa um único papel. Ao assumir outro, libera o anterior. Um substituído retorna à roda se houver vaga; caso contrário, sai da cena.
- Papéis especiais não expiram pelo tempo normal da roda. O nome aparece no personagem em destaque; comentários exibem o autor e ficam limitados a dois balões sem sobreposição.
- A Serenata de 2999 reinicia participantes, casal, banda, DJ, contadores e áudio. Mantém o mapa de presentes, as configurações, a conexão e os arquivos de música locais. O nome de quem reiniciou aparece no aviso.

A câmera faz closes suaves, prioriza papéis recém-assumidos e participantes recentes, e volta ao noivo periodicamente. A visão geral enquadra roda, palco e DJ. Na entrada por rosa, o personagem acena para a câmera. Comentários procuram espaço sem cobrir corpos, nomes ou outras bolhas.

A pista dança em ritmo lento de 72 BPM, com compasso 3/4 compartilhado, passos marcados, balanço dos ombros e transferência suave de peso. Os noivos ficam próximos, frente a frente, com braços voltados para o par e movimentos sincronizados. O relógio da coreografia é compartilhado; o arquivo de música não passa por detecção automática de BPM. Os músicos animam os instrumentos e o DJ opera o console, separados da valsa. O áudio da live vem do player/downloader; não são reproduzidas oito faixas de instrumentos simultaneamente.

A festa mantém dez convidados de ambiente enquanto houver poucos participantes. Eles dançam avulsos, usam roupas e acessórios diferentes e não têm nomes, presentes, comentários ou papéis de doadores. Conforme chegam participantes reais, esses convidados cedem lugar. O contador inclui apenas participantes reais. O reinício restaura a composição de ambiente.

O catálogo do overlay mostra ícones, funções e moedas, sem “a confirmar”. A conexão, eventuais itens indisponíveis e a validação dos IDs continuam visíveis no painel. Remover o texto do overlay não transforma o modo local em uma conexão TikTok confirmada.
## Cenário do casamento
Um bolo de três andares, com cobertura, detalhes dourados, flores e alianças no topo, fica ao lado dos noivos. A câmera dos noivos inclui o bolo no enquadramento. A pista reserva o centro para o casal e o bolo; convidados dançam nos anéis externos.

Cinco globos espelhados com brilho suave giram pelo salão, além do globo já existente. Dois refletores de balada varrem a pista com feixes visíveis, manchas coloridas no chão e transições suaves entre azul, rosa e outras cores, sem efeito estroboscópico. A iluminação de base continua quente. As roupas e acessórios continuam variados, com tecidos mais sóbrios e a aparência da carapaça preservada. Banda e DJ permanecem em seus postos e mantêm as animações dos instrumentos.
## Executar
Instale Node.js 22+:

~~~sh
npm ci
npm start
~~~

Painel: http://localhost:3000
Cena: http://localhost:3000/overlay.html

No Windows, **INICIAR.bat** mantém o servidor no terminal. **ABRIR-LIVE.bat** inicia o servidor se necessário e abre a cena em uma janela dedicada de Edge/Chrome, sem barra de endereço.

## TikTok Live Studio — fonte Link HTTPS
1. Execute **INICIAR.bat** e abra o painel em http://localhost:3000.
2. Clique em **Gerar link HTTPS** e depois em **Copiar link vertical**.
3. No LIVE Studio, adicione uma fonte **Link**, cole o endereço e ative a resolução personalizada **1080 × 1920**, com o som da fonte ligado. Para horizontal, copie o link horizontal e use **1920 × 1080**.
4. Ajuste a fonte à tela preservando a proporção. Não amplie uma fonte criada em 800 × 600 para preencher uma transmissão vertical.

A saída usa canvas em tela inteira, cenário cobrindo o quadro, antialiasing e 30 FPS como alvo na fonte Link. O painel conserva a prévia silenciosa. A composição se adapta ao tamanho real da fonte, com o catálogo sobreposto à direita e comentários procurando espaços livres.

O botão cria um endereço HTTPS temporário do Cloudflare, sem exigir conta ou domínio. O link só funciona enquanto o servidor estiver ligado e muda quando você gerar outro. O serviço não oferece garantia de disponibilidade; para uma URL permanente é necessária hospedagem ou um túnel com domínio estável. O projeto baixa cloudflared 2026.11.1 no Windows e verifica o SHA-256 antes da primeira execução. Em outro sistema, defina CLOUDFLARED_PATH para um executável instalado.

Somente a cena e a faixa em reprodução são publicadas pelo gateway. Painel, conexão TikTok, configurações e downloader permanecem locais. O link HTTPS usa consultas de estado, pois Quick Tunnels não suportam SSE. A cena pode enviar apenas os eventos de duração e fim da faixa; comandos de reprodução ficam no painel.

O endereço local equivalente é `http://localhost:3000/overlay/festa?jogo=festa&source=1&format=portrait`. **ABRIR-LIVE.bat** continua disponível para prévia em janela. A qualidade de codificação e a resolução da transmissão continuam sendo controladas pelo LIVE Studio. Veja [configuração e limites](docs/live-studio.md).
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
