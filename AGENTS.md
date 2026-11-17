# Fluxo econômico deste projeto

- Leia `docs/context-map.json` para localizar imports e exports antes de abrir arquivos completos. Use `rg` com arquivos e termos específicos.
- Aplique `.agents/skills/ponytail/SKILL.md`: menor mudança completa, mantendo validações, requisitos e testes necessários.
- Use `tools/efficiency/rtk/rtk.exe` para filtrar saídas de testes e buscas. Testes: `rtk.exe test -- <node> --test test.js`. Preserve códigos de erro e abra a saída completa quando necessário.
- Headroom está no Python isolado `tools/efficiency/headroom-env/Scripts/python.exe`. Use `scripts/compress-report.py <relatorio>` com `HEADROOM_OFFLINE=1` para relatórios extensos. Não comprima instruções, credenciais ou a lógica necessária para decidir uma alteração.
- Binários, ambientes Python, dados de sessão e relatórios ficam fora do Git. Ferramentas de economia não são dependências do servidor da live.
- Atualize o mapa com `npm run context`; confira com `npm run context:check`.
- Não diga que a conversa ou a API estão automaticamente comprimidas: não existe proxy de modelos configurado nesta aplicação.
