# MongoDB MCP Server

Um servidor Model Context Protocol (MCP) para interagir com bancos de dados MongoDB de maneira nativa, permitindo que inteligências artificiais (como Claude) descubram automaticamente sua modelagem de dados e atuem sobre eles com segurança.

---

## Índice

- [Overview](#overview)
- [Tools](#tools)
- [Resources & Prompts](#resources--prompts)
- [Estrutura de arquivos e pastas](#estrutura-de-arquivos-e-pastas)
- [Como rodar o MCP](#como-rodar-o-mcp)
- [Contributing](#contributing)

---

## Overview

O **MongoDB MCP Server** foi construído sob o padrão oficial do [Model Context Protocol](https://modelcontextprotocol.io/) da Anthropic, focado em permitir que os assistentes conversem intimamente com seu banco de dados MongoDB. Originalmente voltado para abstrações da AWS (DocumentDB) de catálogos de produto, o módulo foi refatorado e expandido para uso geral no MongoDB.

Com este MCP em execução localmente, a IA conectada a ele ganha o superpoder de ler schemas automaticamente lendo instâncias reais ("Virtual Resources"), rodar complexos pipelines de agregação, diagnosticar lentidões, sugerir tipagens TypeScript, além da capacidade de ler, criar, modificar, buscar e remover dados de dentro de coleções do banco e ajustar índices das colunas.

---

## Tools

O MCP expõe automaticamente um registro dinâmico de comandos (Tools) que o Modelo de Linguagem pode escolher executar sobre o banco de dados. As seguintes ferramentas foram implementadas:

### Operações nas Coleções (DDL)
- **`list-collections`**: Retorna os nomes das coleções disponíveis no banco de dados.
- **`create-collection`**: Cria uma nova coleção.
- **`drop-collection`**: Deleta uma coleção inteira do banco.
- **`analyze-schema`**: Lê uma amostra de documentos (ex: 50) e infere os tipos (schema, nullability, sub-objetos) devolvendo o formato da estrutura dessa tabela.

### Operações de Documentos (CRUD)
- **`find`**: Busca de documentos padrão, recebendo filtros (em array de `{}` da agregação ou similar).
- **`insert-one`**: Insere um documento numa coleção.
- **`update-one`**: Modifiers`**: Atualiza um esquema único num contexto flexível.
- **`delete-one`**: Remove documentos com certas dependências.
- **`aggregate`**: Executa livre e abertamente aggregation pipelines flexíveis de data transformation e analytics, trazendo toda a robustez do MongoDB (`$match`, `$group`, `$project`, etc).
- **`bulk-write`**: Permite executar várias operações atômicas (inserts, updates e deletes isolados) ao mesmo tempo processados num lote de array único pelo Node.js.

### Operações de Índices
- Ferramentas completas para **`create-index`**, **`drop-index`** e **`list-indexes`**.

---

## Resources & Prompts

Além de ferramentas procedimentais (Tools), o MCP faz extensivos usos das `capabilities` da SDK do Model Context Protocol:

### Resources (Virtual Files)
- **`mongodb://schema/{collectionName}`**: Ao invés de forçar o LLM a "pedir" pelo schema em seu backend de forma explícita toda hora com uma tool, o MCP registra no sistema do LLM o schema de todas as suas conectadas coleções de forma instantânea como se fossem documentos locais virtuais.

### Prompts (Guided Actions)
Templates prévios que aparecem na interface do Claude Desktop (como botões) que auxiliam num "começo-rápido":
1. **`generate-types`**: Você providencia a tabela para clicar; o Prompt extrai do Virtual Resource acima o Schema JSON da collection e pede imediatamente ao LLM para criar toda a tipagem `interface` e `type` do TypeScript robusta para seu código baseado nos dados reais.
2. **`optimize-query`**: O usuário fornece a collection e a consulta/agregação que achou lenta no banco, onde o prompt manda a IA investigar como o schema pode ser melhor refatorado e que novos índices criar.

---

## Estrutura de arquivos e pastas

```text
mongodb-mcp/
├── src/
│   ├── index.ts               # Ponto de entrada ("main") onde servidor MCP e capabilities sobem
│   ├── mongodb/
│   │   ├── client.ts          # Módulo de conexão Singleton (MongoClient / db)
│   │   └── schema.ts          # Regras e algoritmos de inferência de schema reverso das coleções
│   └── tools/
│       ├── registry.ts        # Registro dinâmico de ferramentas (add/getTool)
│       ├── base/
│       │   └── tool.ts        # Classe base (BaseTool) e padronização do payload / catch
│       ├── collection/        # Tools de DDL (create, drop, schema, list)
│       ├── documents/         # Tools de DML (CRUD simples, bulk-write e aggregates)
│       └── indexes/           # Tools voltadas para índices ($index)
├── package.json               # Dependências e scripts npm
├── tsconfig.json              # Configurações do Compilador TS
└── README.md                  # Este arquivo documentacional
```

---

## Como rodar o MCP

### 1. Requisitos
- **Node.js** (v18.0.0 ou mais recente recomendado)
- Um cluster ou URL padrão MongoDB (Atlas/Localhost).

### 2. Instalação e Compilação
Faça o clone ou setup do seu local, e execute:
```bash
npm install
npm run build
```

### 3. Rodar via CLI individual
Você rodará o servidor via Node apontando para a sua string de conexão na AWS ou Localmente.
```bash
node dist/index.js "mongodb://usuario:senha@localhost:27017/meudb"
```

### 4. Integração no `claude_desktop_config.json`
Se estiver usando o aplicativo oficial da Anthropic Desktop, coloque toda essa string de invocação:
**Arquivo**: `%APPDATA%/Claude/claude_desktop_config.json` (Windows) ou `~/Library/Application Support/Claude/claude_desktop_config.json` (Mac):
```json
{
  "mcpServers": {
    "meu-banco-mongodb": {
      "command": "node",
      "args": [
        "C:/Caminho/Absoluto/Para/Seu/Repositorio/mongodb-mcp/dist/index.js",
        "mongodb://localhost:27017/minhabaserestrita"
      ]
    }
  }
}
```

---

## Contributing

Contribuições para o projeto são incrivelmente bem vindas, especialmente na formatação de complexidades de agregação e parsing do novo protocolo Model Context.

1. Faça um **Fork** do projeto.
2. Crie uma branch apontada para sua funcionalidade nova (\`git checkout -b feature/MinhaFeature\`).
3. Adicione os testes à classe, reescreva em \`dist\` com \`npm run build\`
4. Commit as alterações (\`git commit -m 'feat: Add MinhaFeature'\`).
5. Mande pro remoto com \`git push\` e abra um Pull Request.

