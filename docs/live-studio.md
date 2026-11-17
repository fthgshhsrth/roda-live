# Fonte Link HTTPS para LIVE Studio

No painel, use **Gerar link HTTPS** e **Copiar link vertical**. O endereço tem o formato `https://<endereco>.trycloudflare.com/overlay/<chave>?jogo=festa&source=1&format=portrait`. Em uma fonte Link do LIVE Studio, use resolução personalizada 1080 × 1920 e ative o áudio. Para horizontal, use o botão correspondente e 1920 × 1080.

A composição usa o canvas em tela inteira e acompanha o tamanho efetivo da fonte. O cenário preenche o fundo; nomes e catálogo são renderizados diretamente no navegador. O alvo da fonte Link é 30 FPS, sem reduzir o buffer Full HD. O modo antigo de janela continua disponível, e a prévia do painel permanece mais leve e silenciosa. O resultado final ainda depende da GPU, da resolução da fonte e da codificação da transmissão.

O túnel é temporário e precisa do servidor local ligado. A [documentação oficial de Quick Tunnels](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/) informa que o endereço muda ao criar outro túnel, não há garantia de disponibilidade e SSE não é suportado. Por isso a saída Link consulta o estado periodicamente. Para produção com endereço permanente, é necessário configurar hospedagem ou túnel com domínio estável.

O gateway usa uma chave de visualização e cookie HttpOnly/Secure. Publica apenas arquivos da cena, estado filtrado e a música atual. Não publica o painel, downloader, configurações ou a lista de downloads. Os únicos POSTs permitidos são metadados e término da faixa, que também validam a revisão da música. Ao fechar o servidor, o processo do túnel é encerrado pelo monitor de conexão.

A instalação Windows usa [cloudflared 2026.11.1](https://github.com/cloudflare/cloudflared/releases/tag/2026.11.1), com SHA-256 `341deda3db5ec498a0482254d6c38c0b7cf01a30c37bb5dd95d2216d08955e35`. O executável fica em tools/ e não entra no Git. O download é feito no primeiro uso se estiver ausente. O link gerado é exibido apenas no painel e não é gravado no repositório.

O endereço local é `http://localhost:3000/overlay/festa?jogo=festa&source=1&format=portrait`. A mesma cena é usada na saída HTTPS. Mantenha apenas uma fonte emitindo áudio para evitar duplicação.
## Presentes corretos

Ao conectar, o servidor consulta `fetchAvailableGifts()` do conector instalado e recebe os itens da sala. A correspondência exige ID selecionado ou nome equivalente exato, além do custo por unidade. O overlay usa nome, imagem e preço retornados, sem inventar IDs ou escolher apenas pelo preço. Itens não encontrados ficam indisponíveis; variantes ambíguas exigem seleção no painel. Na operação com catálogo confirmado, eventos usam apenas os IDs confirmados. O catálogo não é persistido entre conexões, para evitar usar itens de outra sala.

O noivo usa **Mãos Fazendo Coração / Finger Heart**, configurado para 5 moedas e com a imagem específica do gesto de dedos. `Hand Heart` / Mãos em Coração, `Heart Hands` e `Heart Me` não são aceitos para esse papel. A migração para o estado 6 limpa o vínculo antigo do noivo, sem mudar os outros presentes. A Serenata inclui os nomes `Serenata da Arraia` e `Ray Serenade`. Os ícones de referência são arquivos originais do CDN do TikTok, incluindo a Rosa de 10 moedas e as arraias. Veja [origens das imagens](../public/gifts/SOURCES.md). Ao conectar, as imagens da sala substituem essas referências. A suposta rosa de 10 moedas só será habilitada se existir um item correspondente no catálogo; dez rosas de uma moeda continuam sendo entrada na roda.

Os presentes e preços nos presets são a configuração pedida para o jogo; não foram validados na conta do criador porque nenhuma live estava conectada durante o desenvolvimento. O status de modo local e da sincronização fica no painel; o catálogo exibido ao público não inclui textos de confirmação. O simulador continua funcionando para os testes sem gastar moedas.

## Fontes consultadas em 17/11/2026

- [TikTok — Política de Itens Virtuais](https://t.tiktok.com/legal/page/row/virtual-items/en): a quantidade de moedas depende do tipo de presente. Não fornece o mapeamento de IDs desta festa.
- [TikTok — Presentes](https://support.tiktok.com/en/live-gifts-wallet/gifts/gifts?lang=en): compra e uso de moedas/presentes. O resultado indexado foi consultado; a página não retornou corpo legível no navegador de pesquisa.
- [TikTok LIVE Studio — qualidade de vídeo](https://www.tiktok.com/live/studio/help/article/Enhance-visuals/Adjust-LIVE-quality-for-smooth-and-clear-video?lang=en) e [fontes](https://www.tiktok.com/live/studio/help/article/Get-started-with-your-first-LIVE/Whats-a-source?lang=en): acesso automatizado indisponível nesta sessão; não foi possível confirmar a interface atual diretamente nessas páginas.
- [Documentação do conector instalado](https://github.com/zerodytrash/TikTok-Live-Connector#retrieve-available-gifts): API de catálogo, IDs, nomes e `diamond_count`. É um conector comunitário, não SDK oficial do TikTok.

O overlay foi validado em navegador local nas duas orientações. A qualidade final de transmissão e a disponibilidade da fonte Link dependem do LIVE Studio e da conta; não são configuradas automaticamente pelo projeto.
## Verificação no aplicativo instalado

Em 17/11/2026, o TikTok LIVE Studio 1.39.6 foi aberto neste computador para testar a fonte. A tela inicial apresentou **Sem acesso**. Não foi iniciada transmissão nem alterada a conta. Não foi possível confirmar a qualidade dentro da captura ou salvar uma cena no aplicativo. Os testes de renderização e enquadramento são de navegador local, não evidência de transmissão no TikTok.

O enquadramento do overlay está salvo no projeto e acompanha a fonte em 1080 × 1920 ou 1920 × 1080. Ainda será necessário adicionar/salvar a fonte no LIVE Studio quando o editor estiver acessível. Nenhum arquivo interno de configuração do TikTok foi sobrescrito.
## Integração de eventos revisada

Foram consultadas as páginas oficiais [Webhooks — Overview](https://developers.tiktok.com/docs/en/webhooks-overview) e [Webhooks — Events](https://developers.tiktok.com/docs/en/webhooks-events). A lista pública consultada descreve eventos de autorização, publicação de vídeos e portabilidade; não documenta um webhook de presentes de LIVE. Isso não permite apresentar este projeto como uma integração oficial de presentes por esses webhooks. A página de ajuda de Presentes foi consultada pelo resultado indexado, mas o corpo não retornou texto legível nesta sessão.

A recepção de presentes continua usando o conector comunitário instalado. Sua documentação primária está em [Gift](https://github.com/zerodytrash/TikTok-Live-Connector#gift) e [catálogo](https://github.com/zerodytrash/TikTok-Live-Connector#retrieve-available-gifts). A leitura aceita `giftDetails` e `extendedGiftInfo`, usa ID e preço unitário do catálogo, processa combos no encerramento e impede repetição pelo ID da mensagem. Ao perder a conexão, o catálogo da sala é invalidado. Nenhuma credencial TikTok foi criada, enviada ou substituída nesta alteração.

A distinção visual entre os dois gestos foi conferida nas imagens do CDN do TikTok. Os nomes em português foram cruzados com o [índice de presentes](https://streamember.com/pt/tiktok/presentes/finger-heart/). Nomes, ID, custo e disponibilidade da conta continuam sendo resolvidos pelo catálogo da sala conectada. Os testes incluem eventos no formato do conector, porém não substituem o envio de um presente em uma LIVE real.