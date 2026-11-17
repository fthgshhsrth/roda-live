# Baratas na Pista · Roda Live 3D 🪳
Template local de live interativa para TikTok, com uma pista circular e baratas dançando em **3D real (Three.js / WebGL2)**.

<img src="docs/preview-vertical.png" width="400" alt="Pista 3D com baratas diferentes dançando e comentários acima dos personagens">

## Versão 2
- Pista 3D com iluminação, sombras, anéis luminosos e globo giratório.
- Baratas com seis membros articulados, antenas, casco e olhos animados.
- Características estáveis por participante: cores, tamanho, óculos, boné, fone, chapéu de festa, bigode e sapatos.
- Passos de dança diferentes e reações a presentes.
- A biblioteca foi substituída por um downloader: **link → yt-dlp → MP3 → reprodução automática na live**.
- Janela sem barra de navegador, composição vertical/horizontal e modo leve.

## Executar
Instale Node.js 22+ e execute:

~~~sh
npm ci
npm start
~~~

No Windows, INICIAR.bat inicia o servidor. Painel: http://localhost:3000

Para abrir a cena em janela dedicada, execute **ABRIR-LIVE.bat** ou:

~~~sh
npm run live
~~~

O iniciador abre Edge/Chrome em modo aplicativo, com áudio automático, e inicia o servidor se necessário. Não requer Git ou Python.

## TikTok Live Studio: captura de janela
1. Execute ABRIR-LIVE.bat.
2. No TikTok Live Studio, adicione **Captura de janela**.
3. Selecione **BARATAS NA PISTA**.
4. Capture o áudio dessa janela ou a saída de áudio do computador.
5. Ajuste o enquadramento da fonte.

A cena se adapta a janelas verticais e horizontais. A prévia do painel é silenciosa. Mantenha apenas uma cena emitindo áudio.

**F** alterna tela cheia. Os controles somem após dois segundos sem mover o mouse. **Qualidade: leve** desliga sombras e reduz a resolução. Ative a aceleração gráfica de Edge/Chrome.

Alternativa: fonte de navegador em http://localhost:3000/overlay.html, com 1080 × 1920 ou 1920 × 1080. Transparência é indicada para fontes de navegador que a suportem; captura de janela usa o fundo da janela.

## Presentes e comentários
Digite o @ de uma conta ao vivo no painel. O conector é não oficial e depende do TikTok e do provedor de assinatura. Se exigida, defina EULER_API_KEY no ambiente antes de iniciar; arquivos .env não são lidos automaticamente.

| Presente | Reação |
| --- | --- |
| Rosa | Entra com nome ou renova a permanência |
| Coração | Corações flutuantes e aura rosa |
| GG | Pulo |
| Perfume | Brilho |
| Galáxia | Brilho violeta e partículas |
| Leão | Coroa |

Nomes e IDs são editáveis. Combos são contabilizados no encerramento. Até 48 participantes em três anéis; somente rosas criam vagas.

Comentários usam a projeção da cena 3D para aparecer acima da cabeça, evitando corpos, nomes e outras bolhas. Se não houver espaço, podem expirar sem aparecer durante seus 7 segundos de exibição. O Laboratório permite testar tudo antes de conectar a live.

## Downloader e autoplay
Instale **yt-dlp, FFmpeg e ffprobe** no PATH ou coloque os executáveis em tools/. INSTALAR-AUDIO.ps1 auxilia a instalação via winget no Windows.

Cole um link e clique em **Baixar e tocar na live**. Aceita sites compatíveis com yt-dlp, incluindo YouTube, TikTok, Vimeo e links diretos HTTP/HTTPS. O suporte depende do site e das regras de acesso; vídeos privados ou protegidos não têm reprodução garantida.

O MP3 concluído vai para music/ e **substitui a faixa atual**, iniciando o áudio na cena. Mantenha a janela aberta. Uma fonte de navegador comum pode exigir o clique inicial em Ativar áudio; ABRIR-LIVE.bat habilita reprodução automática.

Há pausa, retomada, parar, volume, posição e cancelamento. Não há biblioteca nem fila no painel. Os MP3 ficam no disco; nenhum áudio acompanha o projeto.

Um vídeo por vez, sem playlists ou streams ao vivo, com limite de 1 GB e uma hora. O processo recebe argumentos separados, sem shell. Use conteúdo autorizado para transmissão e mantenha yt-dlp atualizado.

## Estrutura
| Arquivo | Função |
| --- | --- |
| server.js | HTTP local, SSE e TikTok |
| media.js | yt-dlp, conversão, progresso e cancelamento |
| music.js | Controle e sincronização da faixa |
| public/scene3d.js | Cena, pista, câmera e projeção |
| public/roach.js | Modelos, diferenças e dança |
| public/overlay.css | Composição adaptável |
| launch-window.mjs | Janela dedicada |
| wheel.js | Presentes e participantes |

Three.js é servido da instalação npm local, sem CDN. Configurações e sessão ficam em data/state.json; MP3 em music/. Dados locais, ferramentas e credenciais são ignorados pelo Git. O servidor escuta em 127.0.0.1; PORT altera a porta padrão 3000.

## Verificação
~~~sh
npm test
~~~

Os testes cobrem presentes, combos, permanência, comentários, URLs, autoplay e eventos antigos de áudio.

Com Edge instalado no Windows e o servidor iniciado, node qa.mjs verifica WebGL2, animação, variações, comentários, janelas vertical/horizontal, download direto, conversão e reprodução automática. Requer sessão vazia e desconectada do TikTok; limpa os participantes simulados ao terminar. Capturas e relatório ficam em verificacao/, fora do repositório.

A conexão com uma live real e a captura dentro do TikTok Live Studio exigem validação no computador de transmissão.

Projeto reconstruído a partir do grafo de arquitetura fornecido, que não incluía o código original.

[Three.js](https://threejs.org/) · [TikTok Live Connector](https://github.com/zerodytrash/TikTok-Live-Connector) · [yt-dlp](https://github.com/yt-dlp/yt-dlp) · [FFmpeg](https://ffmpeg.org/)