# Controle de Energia - Loteamento

Sistema simples para controle de consumo de energia elétrica de um loteamento em Juiz de Fora.

## Funcionalidades

- Login com usuários
- Cadastro de pessoas/lotes
- Lançamento de leituras mensais
- Cálculo automático de consumo (mês atual - mês anterior)
- Cálculo automático do valor a cobrar
- Tarifa editável
- Modo claro / escuro
- Total geral do loteamento

## Usuários

| Usuário | Senha     |
|---------|-----------|
| cida    | 123571    |
| theus   | theus2605 |

Ambos têm acesso total ao sistema.

## Como usar

1. Faça login
2. Cadastre as pessoas
3. Clique em **+ Lançar Leitura** e informe o mês e o valor em kWh
4. O sistema calcula automaticamente o consumo e o valor

## Deploy no Vercel

1. Suba este projeto no GitHub
2. Conecte o repositório no Vercel
3. Deploy automático

## Observação importante

Os dados atualmente são salvos no **localStorage** do navegador (por aparelho).  
Para sincronizar entre vários dispositivos é necessário adicionar um banco de dados (Supabase, Firebase, etc).
