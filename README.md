# Roda Live 🌹
Template de live interativa para TikTok, com painel local, personagens animados, presentes, comentários e biblioteca musical.

## Recursos
- Uma rosa adiciona o participante à roda com seu nome; novas rosas renovam o tempo.
- Reações configuráveis por nomes e IDs dos presentes: corações, pulo, brilho, estrelas e coroa.
- Comentários acima da cabeça com posicionamento que evita cobrir personagens e outras bolhas.
- Painel com simulador, participantes, configurações, histórico e prévia silenciosa.
- Biblioteca com fila, play, pausa, volume e posição.
- Downloader: YouTube → yt-dlp → FFmpeg → MP3 na pasta music/ → fila.
- Cena vertical 1080 × 1920 para OBS e TikTok Live Studio, com opção de fundo transparente.

## Requisitos
- Node.js 22 ou superior.
- yt-dlp, FFmpeg e ffprobe no PATH, ou seus executáveis na pasta tools/.
- Uma conta ao vivo para receber eventos reais do TikTok.

No Windows, INSTALAR-AUDIO.ps1 auxilia a instalação das ferramentas de áudio usando winget. Executáveis e músicas não são distribuídos neste repositório.

## Executar
Extraia o projeto, abra um terminal nessa pasta e execute:

~~~sh
npm ci
npm start
~~~

No Windows, também é possível executar INICIAR.bat.

Painel: http://localhost:3000
Cena: http://localhost:3000/overlay.html

No OBS ou TikTok Live Studio, adicione a cena como fonte de navegador com largura 1080 e altura 1920. Ative o áudio da fonte; se o navegador bloquear a reprodução automática, use Interagir e clique em Ativar áudio da cena. Mantenha somente uma cena emitindo áudio.

## Testar sem uma live
No Laboratório de eventos, escolha um nome, envie Rosa e depois um comentário ou outro presente. Os personagens e o painel se atualizam em tempo real.

~~~sh
npm test
~~~

Os testes verificam rosas, renovação, combos, comentários, expiração, lotação e colisão das bolhas. O arquivo qa.mjs permite verificação no Edge instalado no Windows, com o servidor iniciado na porta 3000. Ele limpa os participantes simulados ao terminar; execute antes de uma sessão real.

## Conectar ao TikTok
Digite o @ de uma conta ao vivo e clique em Conectar. Ajuste os nomes e IDs de presentes disponíveis na sua região no mapa de presentes.

O conector é não oficial e depende da disponibilidade do TikTok e do provedor de assinatura. Se uma chave for exigida, defina EULER_API_KEY no ambiente antes de iniciar; o projeto não lê arquivos .env automaticamente. Não salve credenciais no código ou no repositório.

## Música
Cole uma URL HTTPS de vídeo do YouTube em Baixar MP3 e aguarde a conversão. O resultado aparece na biblioteca e na fila. Tocar inicia a primeira faixa quando nenhuma está selecionada. Também é possível copiar seus MP3 para music/ e clicar em Atualizar.

Downloads individuais, sem playlists, limitados a 150 MB e 15 minutos. Use conteúdo autorizado para transmissão. Mantenha yt-dlp atualizado quando o YouTube mudar.

## Estrutura
| Caminho | Função |
| --- | --- |
| server.js | HTTP local, eventos SSE, TikTok e downloader |
| wheel.js | Regras de presentes, participantes e comentários |
| public/ | Painel, cena Canvas e posicionamento das bolhas |
| music/ | MP3 locais, ignorados pelo Git |
| data/ | Configurações e sessão, criadas ao executar e ignoradas pelo Git |
| tools/ | Executáveis locais opcionais, ignorados pelo Git |

O servidor escuta somente em 127.0.0.1. A variável PORT altera a porta padrão. Configurações e sessão ficam em data/state.json.

Na lotação máxima, um comentário pode expirar sem aparecer se não houver espaço livre para sua bolha. A documentação detalhada e as verificações realizadas estão em [LEIA-ME.md](LEIA-ME.md).

## Referências
Projeto reconstruído a partir do grafo de arquitetura fornecido, que não incluía o código-fonte original.

- [TikTok Live Connector](https://github.com/zerodytrash/TikTok-Live-Connector)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp)
- [FFmpeg](https://ffmpeg.org/)