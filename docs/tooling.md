# Ferramentas de contexto e economia
Ferramentas de desenvolvimento, separadas do runtime da live.

| Ferramenta | Instalação local | Uso confirmado |
| --- | --- | --- |
| RTK 1.2.0 | tools/efficiency/rtk/rtk.exe | Testes filtrados; código de saída preservado |
| Ponytail | .agents/skills/ponytail/SKILL.md | Mudança mínima completa e verificações focadas |
| Headroom 0.44.0 | tools/efficiency/headroom-env | Compressão local de relatório de testes, em modo offline |
| Grafo | docs/context-map.json e docs/context-map.md | Índice de imports/exports e hashes de 21 módulos |

O grafo original de grafo.zip foi consultado (65 nós e 100 conexões). O mapa atual é um índice estático ESM, gerado do código desta versão; não é uma nova execução do Graphify.

## Comandos
~~~powershell
.\tools\efficiency\rtk\rtk.exe test -- .\tools\runtime\node-v24.22.3-win-x64\node.exe --test test.js
.\tools\efficiency\rtk\rtk.exe gain
.\tools\efficiency\headroom-env\Scripts\python.exe scripts/compress-report.py tools/efficiency/tests.raw.log
~~~

Com Node no PATH:

~~~sh
npm run context
npm run context:check
~~~

AGENTS.md orienta a consultar o mapa e aplicar Ponytail antes de abrir arquivos extensos. As skills locais podem ser descobertas pelo host no próximo turno.

## Medições desta instalação
- RTK: saída estimada de 343 para 28 tokens, economia de 91,8% em uma execução dos testes.
- Headroom: relatório de 969 para 664 tokens, economia de 305 tokens.
- Valores medidos nos relatórios locais dessa execução.

O Headroom roda com HEADROOM_OFFLINE=1; não houve chamada de modelo, API key nem download de modelo de ML. Não há proxy de modelos ou interceptação automática desta conversa configurados. A compressão foi aplicada aos relatórios locais de ferramentas.

Os executáveis, Python e caches ficam em tools/ e não são enviados ao GitHub. As skills incluem as licenças de seus autores.

Fontes: https://github.com/rtk-ai/rtk · https://github.com/DietrichGebert/ponytail · https://github.com/headroomlabs-ai/headroom