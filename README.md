## Projetos locais — Kanban invertido com backend SQLite

SPA em React + Vite que organiza projetos (colunas) e tarefas (cartões), agora persistidos em um banco SQLite servido por uma API Express. Mesmo sem login, os dados ficam gravados em disco (`data/app.db`), podem ser exportados/importados em JSON e permanecem disponíveis ao reiniciar o app.

### Principais funcionalidades

- **Projetos como colunas**: criar, renomear, excluir e reorganizar horizontalmente via drag-and-drop (`dnd-kit`). Cada coluna exibe o contador de tarefas e possui atalhos para nova tarefa, edição e exclusão (com confirmação).
- **Tarefas detalhadas**: título obrigatório, descrição opcional, prioridade (baixa/média/alta), status ativo/concluído, datas de criação e conclusão. Reordenação somente dentro da mesma coluna e sem permitir mover entre projetos.
- **Filtros e busca instantânea**: campo global (atalho `⌘/Ctrl+K`) que procura no título e descrição; chips para filtrar por prioridade e status.
- **Persistência real**: API Node/Express usando SQLite (via `better-sqlite3`). Os dados vivem em `data/app.db` e continuam mesmo após derrubar o `npm run dev`. Exportação/importação em JSON segue validada por Zod.
- **UX responsiva e acessível**: layout mobile-first com Tailwind, foco visível, suporte a teclado (`T`, `P`, `Space`, `Del`) e modo escuro manual. Feedback com `react-hot-toast`.

### Stack

- Vite + React + TypeScript
- Tailwind CSS
- Zustand para estado local sincronizado com a API
- Express + SQLite (better-sqlite3) para persistência
- dnd-kit para drag-and-drop
- Zod para validação dos backups
- Vitest para testes de lógica crítica

### Executando localmente

```bash
npm install

# em um terminal (API + banco SQLite em ./data)
npm run server

# em outro terminal (SPA apontando para VITE_API_URL)
npm run dev

npm run build      # build de produção do front
npm run preview    # serve o build localmente
npm run test       # testes unitários (Vitest)
```

> Variáveis de ambiente: `.env.development` já aponta para `http://localhost:4000/api`; `.env.production` usa o caminho relativo `/api`, ideal para deploys onde o front e a API rodam juntos.

### Rodando com Docker

```bash
# builda a imagem
docker build -t local-projects .

# roda expondo a porta 4000 e persistindo o banco na máquina host
docker run --rm -p 4000:4000 -v $(pwd)/data:/app/data local-projects
```

Depois é só acessar `http://localhost:4000`. A API expõe `/api/*` e o próprio container já serve o front em `/`. Se quiser apontar para outro host durante o build, altere `VITE_API_URL` (por exemplo `docker build --build-arg VITE_API_URL=https://foo/api ...`).

> Dica: caso o backend rode em outra porta/host, defina `VITE_API_URL` (ex.: `VITE_API_URL=http://localhost:4000/api`) antes de iniciar o Vite.

### Atalhos de teclado

| Atalho            | Ação                                     |
| ----------------- | ---------------------------------------- |
| `P`               | Novo projeto                             |
| `T`               | Nova tarefa (usa último projeto ativo)   |
| `⌘/Ctrl + K`      | Foca no campo de busca                   |
| `Del` / `Backspace` | Exclui a tarefa selecionada            |
| `Space`           | Alterna status concluído/ativo da tarefa |

### Estrutura de dados

```ts
projects: {
  id: string;
  title: string;
  position: number;  // gaps de 1000
  createdAt: number;
}

tasks: {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  done: boolean;
  position: number;  // ordenação dentro do projeto
  createdAt: number;
  completedAt?: number;
}
```

### Backup/restore

- Exporta todo o banco para `kanban-backup-[data].json`.
- Importa novamente validando contra um schema Zod (`version`, `projects`, `tasks`). Importações substituem o banco inteiro.

### Testes incluídos

1. **Reordenação**: garante que tentativas de mover tarefa para outro projeto são bloqueadas e que os cálculos de posição permanecem válidos.
2. **Conclusão**: valida que alternar status atualiza `done` e `completedAt`.
3. **Backup summary**: assegura contagem consistente de tarefas por projeto no helper usado em exportação.

### Próximos passos sugeridos

- Adicionar sync opcional (por exemplo, CRDT/replicação).
- Criar testes e2e com Playwright ou Cypress para interação drag-and-drop.
- Expandir os componentes para suportar attachments/checklists por tarefa.
