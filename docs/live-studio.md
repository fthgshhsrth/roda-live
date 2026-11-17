# Overlay Full HD e catálogo da live

O link vertical é `http://localhost:3000/overlay.html?studio=1&format=portrait#tiktok.studio`. Para horizontal, troque `portrait` por `landscape`. A composição acompanha o tamanho efetivo da fonte: 1080 × 1920 na vertical, 1920 × 1080 na horizontal. Os botões no painel copiam o endereço com a porta atual.

O modo padrão usa WebGL com antialiasing, buffer visando 1080 ou 1920 pixels de largura, limitado a 4096 pixels no lado maior e fator 3, sombras de 2048 pixels e até 60 FPS. O ritmo real depende da GPU. A prévia do painel tem resolução reduzida, 24 FPS e áudio silenciado. A fonte principal mantém seu próprio buffer; o modo leve usa 30 FPS e sem sombras.

A festa ocupa 72–75% da altura, com cabeçalho mínimo e catálogo fora do palco. O nome aparece apenas no personagem em foco. Comentários incluem o autor, ficam limitados aos dois mais recentes e procuram espaço livre sem cobrir personagens, avisos ou catálogo. Se não houver espaço, o balão não aparece.

## Presentes corretos

Ao conectar, o servidor consulta `fetchAvailableGifts()` do conector instalado e recebe os itens da sala. A correspondência exige ID selecionado ou nome equivalente exato, além do custo por unidade. O overlay usa nome, imagem e preço retornados, sem inventar IDs ou escolher apenas pelo preço. Itens não encontrados ficam indisponíveis; variantes ambíguas exigem seleção no painel. Na operação com catálogo confirmado, eventos usam apenas os IDs confirmados. O catálogo não é persistido entre conexões, para evitar usar itens de outra sala.

`Heart Me` foi removido dos sinônimos de mãos fazendo coração. O preset aceita `Hand Heart`, `Heart Hands` e traduções configuradas, mas a confirmação depende do item da sala. A Serenata inclui a variante de nome `Serenata da Arraia`. A suposta rosa de 10 moedas só será habilitada se existir um item correspondente no catálogo; dez rosas de uma moeda continuam sendo entrada na roda.

Os presentes e preços nos presets são a configuração pedida para o jogo; não foram validados na conta do criador porque nenhuma live estava conectada durante o desenvolvimento. No modo local, o catálogo sinaliza que é prévia. O simulador continua funcionando para os testes sem gastar moedas.

## Fontes consultadas em 17/11/2026

- [TikTok — Política de Itens Virtuais](https://t.tiktok.com/legal/page/row/virtual-items/en): a quantidade de moedas depende do tipo de presente. Não fornece o mapeamento de IDs desta festa.
- [TikTok — Presentes](https://support.tiktok.com/en/live-gifts-wallet/gifts/gifts?lang=en): compra e uso de moedas/presentes. O resultado indexado foi consultado; a página não retornou corpo legível no navegador de pesquisa.
- [TikTok LIVE Studio — qualidade de vídeo](https://www.tiktok.com/live/studio/help/article/Enhance-visuals/Adjust-LIVE-quality-for-smooth-and-clear-video?lang=en) e [fontes](https://www.tiktok.com/live/studio/help/article/Get-started-with-your-first-LIVE/Whats-a-source?lang=en): acesso automatizado indisponível nesta sessão; não foi possível confirmar a interface atual diretamente nessas páginas.
- [Documentação do conector instalado](https://github.com/zerodytrash/TikTok-Live-Connector#retrieve-available-gifts): API de catálogo, IDs, nomes e `diamond_count`. É um conector comunitário, não SDK oficial do TikTok.

O overlay foi validado em navegador local nas duas orientações. A qualidade final de transmissão e a disponibilidade da fonte Link dependem do LIVE Studio e da conta; não são configuradas automaticamente pelo projeto.