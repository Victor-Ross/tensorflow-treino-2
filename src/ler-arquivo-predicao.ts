import { readFile } from 'node:fs/promises';
import path from 'node:path';

export async function lerArquivoPredicao(filename: string) {
  let arquivo = await readFile(path.join(process.cwd(), filename), {
    encoding: 'utf8',
  });

  arquivo = arquivo.toString().trim();

  const linhas = arquivo.split('\r\n');

  let qtdLinhas = 0;

  let celulas1 = [] as [string, number, string, number][];
  for (let l = 0; l < linhas.length; l++) {
    qtdLinhas++;
    const [veiculo, idade, descricaoPeca, kmPeca] = linhas[l].split(';');
    celulas1.push([veiculo, Number(idade), descricaoPeca, Number(kmPeca)]);
  }

  const result = celulas1;

  return result;
}
