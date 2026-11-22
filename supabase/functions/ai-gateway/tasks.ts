// Catálogo real de tarefas: saída JSON validada antes de ser exibida.
export type Task = {tier:'FAST'|'STRONG', maxInputChars:number, guidance:string, kind:'notes'|'cards'|'questions'};
export const TASKS: Record<string,Task> = {
 resumo:{tier:'FAST',maxInputChars:12000,kind:'notes',guidance:'Resuma exclusivamente o texto enviado, com títulos, pontos e limitações. Não crie referências.'},
 cartoes:{tier:'FAST',maxInputChars:12000,kind:'cards',guidance:'Gere de 1 a 15 flashcards claros sobre o material. Cada item deve conter front, back e sourceQuote extraído literalmente do texto.'},
 questoes_objetivas:{tier:'STRONG',maxInputChars:12000,kind:'questions',guidance:'Gere de 1 a 10 questões objetivas sobre o conteúdo. Em cada item: statement, options como objeto A,B,C,D,E, correct (A-E), explanation e sourceQuote literal.'},
 explicar_erro:{tier:'FAST',maxInputChars:9000,kind:'notes',guidance:'Explique o possível erro conceitual sem inventar enunciados, dê passos e um conselho verificável.'},
 coach_semanal:{tier:'FAST',maxInputChars:3000,kind:'notes',guidance:'Use apenas dados quantitativos fornecidos; proponha uma meta realista, sem diagnóstico médico nem afirmações sobre notas não fornecidas.'},
 plano_ajustes:{tier:'STRONG',maxInputChars:5000,kind:'notes',guidance:'Sugira ajustes claros de um plano de estudos. Nunca diga que o calendário já foi alterado.'},
 distratores:{tier:'FAST',maxInputChars:7000,kind:'notes',guidance:'Sugira alternativas plausíveis, indicando claramente a resposta e justificando as incorretas, sem alterar questão real.'},
 explicacao:{tier:'STRONG',maxInputChars:12000,kind:'notes',guidance:'Explique em linguagem clara com exemplos; use apenas fatos sustentados pelo trecho ou sinalize conhecimento externo.'},
 questoes:{tier:'STRONG',maxInputChars:12000,kind:'questions',guidance:'Gere de 1 a 10 questões objetivas A-E a partir do texto, com correção e trecho literal.'},
 organizar:{tier:'FAST',maxInputChars:12000,kind:'notes',guidance:'Organize ideias sem mudar seu sentido ou criar fatos.'},
 revisar:{tier:'FAST',maxInputChars:12000,kind:'notes',guidance:'Revise gramática e clareza, preservando intenção e explicitando dúvidas.'},
 feynman:{tier:'STRONG',maxInputChars:10000,kind:'notes',guidance:'Faça perguntas e identifique lacunas numa explicação fornecida, sem inventar afirmações atribuídas ao aluno.'},
 edital_arvore:{tier:'STRONG',maxInputChars:12000,kind:'notes',guidance:'Converta o conteúdo do edital em hierarquia textual. Não afirme validade legal ou atualidade do edital.'},
 mapa_gerar:{tier:'FAST',maxInputChars:12000,kind:'notes',guidance:'Sugira mapa textual com no máximo 40 ideias e relações sem ciclos. A aprovação não insere automaticamente nós.'},
 mapa_expandir:{tier:'FAST',maxInputChars:5000,kind:'notes',guidance:'Sugira até cinco ideias-filhas para o ramo apresentado.'},
 trilha_gerar:{tier:'STRONG',maxInputChars:7000,kind:'notes',guidance:'Sugira roteiro por módulos e etapas com prazos realistas e sem promessas de resultado.'},
 aula_plano:{tier:'STRONG',maxInputChars:12000,kind:'notes',guidance:'Esboce um plano de aula estruturado e rubrica. Não afirmar conformidade oficial com BNCC.'},
 resumo_com_trecho:{tier:'STRONG',maxInputChars:12000,kind:'notes',guidance:'Cada afirmação deve ser sustentada por trecho literal da fonte. Se não houver base, declare isso.'},
 termos_de_busca:{tier:'FAST',maxInputChars:6000,kind:'notes',guidance:'Proponha termos de busca e operadores booleanos; nunca invente fontes ou DOIs.'},
 extrair_campos:{tier:'FAST',maxInputChars:12000,kind:'notes',guidance:'Extraia apenas campos presentes no texto. Marque ausentes como não informado.'},
 transcricao_resumo:{tier:'FAST',maxInputChars:12000,kind:'notes',guidance:'Resuma a transcrição colada com tópicos, perguntas e possíveis cartões sem inventar falas.'},
 redacao:{tier:'STRONG',maxInputChars:12000,kind:'notes',guidance:'Dê feedback de clareza, coesão e argumentação. Notas são estimativas não oficiais.'},
 explicar_calculo:{tier:'STRONG',maxInputChars:1000,kind:'notes',guidance:'Explique o método de um cálculo cuja resposta já foi produzida por motor determinístico. Não calcule novo resultado.'}
};
export function validateDraft(d:any,task:string,input:string):{ok:boolean,why?:string}{
 if(!d||typeof d!=='object'||typeof d.title!=='string'||typeof d.body!=='string'||!Array.isArray(d.limitations))return {ok:false,why:'Estrutura inválida'};
 if(!d.title.trim()||d.title.length>160||d.body.length>12000||d.limitations.length>8||d.limitations.some((x:any)=>typeof x!=='string'||x.length>200))return {ok:false,why:'Limites inválidos'};
 const mode=TASKS[task]?.kind;if(!mode)return {ok:false,why:'Tarefa inexistente'};
 if(mode==='cards'){
  if(!Array.isArray(d.items)||d.items.length<1||d.items.length>15)return {ok:false,why:'Cartões inválidos'};
  if(d.items.some((i:any)=>!i||typeof i.front!=='string'||!i.front.trim()||i.front.length>2000||typeof i.back!=='string'||!i.back.trim()||i.back.length>5000||typeof i.sourceQuote!=='string'||!input.includes(i.sourceQuote)||i.sourceQuote.length<10))return {ok:false,why:'Cartão sem fonte literal'};
 }
 if(mode==='questions'){
  if(!Array.isArray(d.items)||d.items.length<1||d.items.length>10)return {ok:false,why:'Questões inválidas'};
  if(d.items.some((i:any)=>!i||typeof i.statement!=='string'||!i.statement.trim()||i.statement.length>3000||!i.options||['A','B','C','D','E'].some(k=>typeof i.options[k]!=='string'||!i.options[k].trim()||i.options[k].length>1000)||!['A','B','C','D','E'].includes(i.correct)||typeof i.explanation!=='string'||i.explanation.length>5000||typeof i.sourceQuote!=='string'||!input.includes(i.sourceQuote)||i.sourceQuote.length<10))return {ok:false,why:'Questão ou origem inválida'};
 }
 return {ok:true};
}
