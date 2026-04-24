# EasyClass Web

Frontend **React 19** + **Vite** + **Tailwind CSS** para EasyClass.ai: login, salas, gravação/envio de áudio e perguntas sobre o conteúdo da aula.

## Pré-requisitos

- Node.js 20+ (recomendado)
- API rodando (veja `../easy-class-api/README.md`)

## Configuração

```bash
cp .env.example .env
```

| Variável | Descrição |
|----------|-----------|
| `VITE_API_URL` | URL base da API (ex.: `http://localhost:3333`) |

O Vite só expõe ao bundle variáveis prefixadas com `VITE_`.

## Instalação e desenvolvimento

```bash
npm install
npm run dev
```

Abra o endereço que o Vite mostrar (geralmente **http://localhost:5173**).

Faça login com um usuário existente no banco (ex.: após o seed da API: **dev@local.test** / **dev**).

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Typecheck + build de produção |
| `npm run preview` | Servir o build localmente |

## Integração com a API

- A origem do dev server precisa estar liberada no **CORS** da API (`http://localhost:5173` por padrão).
- Se a API usar outra porta ou host, atualize `VITE_API_URL` e reinicie o `npm run dev`.

## Problemas comuns

- **Erro de rede / CORS** — Confira se a API está no ar e se `VITE_API_URL` está correto (sem barra no final, a menos que o código espere).
- **401 após login** — Token inválido ou expirado; verifique login e se o front envia `Authorization` nas requisições.
