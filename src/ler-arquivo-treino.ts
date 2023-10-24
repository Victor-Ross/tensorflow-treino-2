import { readFile } from 'node:fs/promises';
import path from 'node:path';

export async function lerArquivoTreino(filename: string) {
  let arquivo = await readFile(path.join(process.cwd(), filename), {
    encoding: 'utf8',
  });

  arquivo = arquivo.toString().trim();

  const linhas = arquivo.split('\r\n');

  let qtdLinhas = 0;

  let celulas1 = [] as [string, number, number, number][];

  for (let l = 0; l < linhas.length; l++) {
    qtdLinhas++;
    const [
      codigo_chassi,
      descricao_chassi,
      codigo_grupo_servico,
      desc_grupo_servico,
      media_km_rodado,
      media_km_rev,
    ] = linhas[l].split(';');
    celulas1.push([
      desc_grupo_servico,
      Number(media_km_rodado),
      Number(media_km_rev),
      1,
    ]);
  }

  const result = celulas1;

  return result;
}
