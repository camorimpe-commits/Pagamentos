# Painel de Execução da Despesa

Site estático + uma função serverless que lê o Google Sheets. Sem build, sem dependências.

```
index.html      → painel (filtros, indicadores, gráficos, tabela)
api/data.js     → lê a planilha (CSV) e devolve JSON
```

## Publicar

1. Crie um repositório no GitHub e envie estes arquivos (`index.html` e a pasta `api/` na raiz).
2. Em vercel.com → **Add New Project** → importe o repositório → **Deploy** (nenhuma configuração é necessária).
3. Na planilha: **Compartilhar → Acesso geral → Qualquer pessoa com o link (Leitor)**.

## Como atualiza

- Você edita a planilha → o painel lê os dados novos sozinho a cada 5 minutos, ao voltar para a aba e no botão **Atualizar agora**.
- O Google e a Vercel guardam cópia por alguns minutos, então espere até ~2–5 min para ver a mudança.
- Não precisa fazer novo commit nem novo deploy quando os dados mudam.

## Outra planilha ou aba

Em Vercel → Settings → Environment Variables, defina `SHEET_ID` (trecho entre `/d/` e `/edit` da URL) e `SHEET_GID` (número depois de `gid=`). Faça Redeploy.

## Colunas esperadas

`Ano, Mês, EMPENHO, LIQUIDAÇÃO, PAGAMENTO, Fonte, SubFunção, Grupo, Elemento, Credor, SubElemento, Data Emissão, DocumentoNE, DocumentoNL, DocumentoPD, DocumentoOB, Status, Nº Doc Fiscal, Data Pagamento, Tema`

A leitura é pelo nome do cabeçalho, então mudar a ordem das colunas não quebra nada. Renomear uma coluna sim.

## Testar no seu computador

```
npm i -g vercel
vercel dev
```
