# Roda Live 🌹
Template local inspirado na arquitetura do grafo.zip. O ZIP de referência contém o grafo Graphify, não os arquivos originais; esta é uma implementação nova.

## Iniciar no seu computador
Execute INICIAR.bat e abra http://localhost:3000.

Na pasta local desta entrega, Node portátil, yt-dlp, FFmpeg e ffprobe estão preparados em tools/. O iniciador usa o Node portátil quando disponível. Se você usar somente o ZIP de código em outro computador, instale Node.js 22+ e as ferramentas de áudio; INSTALAR-AUDIO.ps1 instala yt-dlp e FFmpeg pelo winget. O conector é instalado com npm ci na primeira execução.

Para testar sem estar ao vivo, use o Laboratório: escolha um nome, envie Rosa e depois um comentário ou outro presente.

## Cena para OBS / TikTok Live Studio
Adicione uma fonte de navegador com:
- URL: http://localhost:3000/overlay.html
- Largura: 1080
- Altura: 1920

Ative o áudio da fonte. Se a reprodução automática for bloqueada, use Interagir e clique em Ativar áudio da cena. A prévia do painel é silenciosa. Cenas no mesmo perfil de navegador negociam qual emite áudio; OBS e navegadores separados podem usar perfis diferentes, por isso mantenha uma única fonte com áudio ativo.

Título, chamada, duração, velocidade, vagas, fundo transparente e comentários são configuráveis no painel.

## TikTok e presentes
Informe o @ de uma conta que esteja ao vivo. O conector é não oficial e depende do TikTok e de serviços de assinatura. Se o provedor exigir chave, defina EULER_API_KEY no ambiente antes de iniciar; a chave não é salva no painel. Não informe senha no aplicativo. Após queda da conexão, clique em Conectar novamente.

O mapa de presentes aceita nomes ou IDs separados por vírgula. Ajuste-os aos presentes disponíveis na sua região:
- Rosa / Rose (ID inicial 5655, editável): entra na roda e mostra o nome. Outra rosa renova a permanência.
- Coração: corações acima do personagem.
- GG: pulo.
- Perfume: brilho.
- Galáxia: estrelas.
- Leão: coroa.

Somente rosas criam vagas; outros presentes animam quem já participa. Combos são contabilizados no encerramento, inclusive no formato nativo do conector 2.5.0. A capacidade vai de 4 a 48. Quando a roda está cheia, uma pessoa nova precisa aguardar vaga e enviar outra rosa.

## Comentários
O comentário aparece acima da cabeça do boneco de quem entrou na roda, com uma linha de ligação. O posicionamento reserva espaço para o corpo, salto, braços, acessórios e nome de todos os participantes, além das outras bolhas. Comentários longos usam até três linhas.

Se não houver espaço livre, a bolha aguarda durante seus 7 segundos e pode expirar sem aparecer. Comentários de quem ainda não entrou são ignorados.

## Biblioteca e downloader
Cole o link HTTPS de um vídeo do YouTube em Baixar MP3. O fluxo é:
yt-dlp → extração com FFmpeg → arquivo em music/ → biblioteca e fila.

Aguarde a confirmação de conversão concluída. Tocar inicia a primeira faixa da fila quando nenhuma música está selecionada; ▶ na biblioteca escolhe uma faixa. Próxima consome a fila, e a cena avança ao terminar cada música. Há pausa, volume e controle de posição.

MP3 copiados manualmente para music/ aparecem em Atualizar. Downloads são individuais, sem playlists, com limite de 150 MB e 15 minutos. O painel mostra a disponibilidade de yt-dlp, FFmpeg e ffprobe. Atualize o yt-dlp se o YouTube mudar ou bloquear a extração. Use conteúdo autorizado para transmitir. Nenhuma música acompanha a entrega.

## Verificações concluídas
- 7 testes de regras: entrada e renovação por rosa, combos, formato nativo do conector, comentários, expiração, lotação e colisão das bolhas em 48 participantes.
- Edge: painel, botões de presentes, rosa, comentário, GG, cena Canvas, origens e URLs rejeitadas. Nenhum erro JavaScript.
- Áudio: fila, reprodução de MP3, pausa, posição e volume.
- Download real: vídeo de teste do projeto yt-dlp, ID DTi8wZ1a1TA. O arquivo foi baixado do YouTube, convertido para MP3 de 9,89 segundos, apareceu na biblioteca, entrou na fila e tocou na cena no Edge. FFprobe confirmou codec MP3. O arquivo de teste foi removido.
- A conexão com uma live real ainda depende de um @ ao vivo e não foi validada.

As capturas e o resultado dos testes estão em verificacao/. qa.mjs usa o Edge instalado no Windows, requer o servidor na porta 3000 e limpa os participantes de simulação ao terminar; rode antes de uma sessão real.

## Estrutura
- server.js: servidor local, eventos SSE, TikTok e downloader.
- wheel.js: regras e participantes.
- public/: painel, cena e posicionamento de bolhas.
- music/: MP3; data/state.json: configurações, fila e sessão.
- tools/: executáveis e Node portátil.
- npm test: testes das regras; npm start: servidor.

O servidor escuta em 127.0.0.1. PORT altera a porta padrão; ajuste também as URLs do painel e da fonte. Ao reiniciar, a reprodução fica pausada e participantes vencidos são removidos.

O ZIP de código exclui executáveis, node_modules e dados de sessão.

Referências: https://github.com/zerodytrash/TikTok-Live-Connector e https://github.com/yt-dlp/yt-dlp