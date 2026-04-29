# Glevis Backend

Serverless function (Vercel) que recebe as inscrições do formulário VIP e grava em uma planilha do Google Sheets via Service Account.

---

## 1. Variáveis de ambiente

Antes do deploy, configure três variáveis na Vercel:

| Nome | Origem |
|---|---|
| `GOOGLE_SHEET_ID` | ID da planilha (parte da URL entre `/d/` e `/edit`) |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Email da Service Account (`xxx@xxx.iam.gserviceaccount.com`) |
| `GOOGLE_PRIVATE_KEY` | Chave privada do JSON da Service Account, com `\n` literais (a função substitui por quebras reais) |

### Passo a passo na Vercel

1. Acesse o projeto em [vercel.com/dashboard](https://vercel.com/dashboard).
2. Vá em **Settings → Environment Variables**.
3. Para cada variável acima:
   - **Name**: nome exato (ex.: `GOOGLE_SHEET_ID`).
   - **Value**: valor correspondente.
   - **Environments**: marque `Production`, `Preview` e `Development`.
4. Para `GOOGLE_PRIVATE_KEY`, cole a string com `\n` literais — exemplo:
   ```
   -----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----\n
   ```
5. Clique em **Save** em cada uma.
6. Refaça o deploy (`vercel --prod`) para que as variáveis sejam aplicadas.

### Lembrete importante

A Service Account precisa estar adicionada como **Editor** na planilha. Abra a planilha → **Compartilhar** → cole o `GOOGLE_SERVICE_ACCOUNT_EMAIL` → permissão **Editor**.

A planilha deve ter as colunas (na primeira aba): `Data | Nome | Email | WhatsApp`.

---

## 2. Deploy

Primeira vez (cria o projeto na Vercel e faz o link):
```bash
vercel
```

Deploy de produção:
```bash
vercel --prod
```

A URL final fica algo como `https://glevis-backend.vercel.app/api/inscricao`. Atualize a constante `ENDPOINT` no `frontend-snippet.js` com essa URL.

---

## 3. Testar localmente

```bash
vercel dev
```

A função fica disponível em `http://localhost:3000/api/inscricao`. Teste com:

```bash
curl -X POST http://localhost:3000/api/inscricao \
  -H "Content-Type: application/json" \
  -d '{"nome":"Teste","email":"teste@exemplo.com","whatsapp":"11999999999"}'
```

Resposta esperada: `{"ok":true}`.

---

## 4. Estrutura

```
glevis-backend/
├── api/
│   └── inscricao.js        # Serverless function (POST)
├── frontend-snippet.js     # JS para colar no front da Netlify
├── form-snippet.html       # HTML do form com os IDs ajustados
├── package.json
└── README.md
```
