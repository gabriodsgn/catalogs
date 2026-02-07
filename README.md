# PIM — Catálogo de Produtos

Este PIM (Product Information Management) é uma interface estática para cadastrar, buscar e visualizar produtos por fornecedor, usando apenas HTML/CSS/JS e `localStorage` no navegador.

## Como usar

1. Abra o arquivo `index.html` diretamente no navegador **ou** sirva o projeto com um servidor local:
   ```bash
   python -m http.server 8000
   ```
   Em seguida acesse: `http://localhost:8000`.
2. Cadastre um produto pelo formulário **Cadastrar produto**.
3. Use a busca e os filtros para localizar um item por nome, SKU, categoria ou fornecedor.
4. Importe catálogos usando **Importar catálogos de fornecedores** (CSV/TSV/TXT ou lista manual).
5. Confira os itens em **Resultados em catálogos** e na lista de **Catálogos carregados**.
6. A seção **Visão de fornecedores** agrupa os itens por fornecedor.
7. Clique em **Carregar exemplo** para popular dados de demonstração.
8. Clique em **Limpar dados** para remover tudo do `localStorage`.

## Onde os dados ficam

Os produtos são salvos no `localStorage` do navegador com a chave `pim-products` e os catálogos na chave `pim-catalogs`.
