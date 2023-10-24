import { readFile } from 'node:fs/promises';
import path from 'node:path';

export type Frota = {
  codigoModChassi: number;
  descModChassi: string;
  prefixoVeic: string;
  gruposDeServico: {
    descGrupoServ: string;
    kmAtual: number;
    kmRev: number;
    probabilidade: number | null;
  }[];
};

export async function lerArquivoFrota() {
  let arquivo = await readFile(path.join(process.cwd(), 'frota.csv'), {
    encoding: 'utf8',
  });

  arquivo = arquivo.toString().trim();

  const linhas = arquivo.split('\r\n');

  let celulas1 = [] as [number, string, string, string, number, number][];

  let celulas2 = [] as Frota[];

  for (let l = 0; l < linhas.length; l++) {
    const [
      codigo_chassi,
      descricao_chassi,
      cod_grupo_servico,
      desc_grupo_servico,
      veiculo,
      km_atual,
      km_rev,
    ] = linhas[l].split(';');
    celulas1.push([
      Number(codigo_chassi),
      descricao_chassi,
      veiculo,
      desc_grupo_servico,
      Number(km_atual),
      Number(km_rev),
    ]);
  }

  let veiculos = [...new Set(celulas1.map((c) => c[2]))];

  for (let v = 0; v < veiculos.length; v++) {
    const data = celulas1.filter((c) => c[2] === veiculos[v]);

    celulas2.push({
      codigoModChassi: data[0][0],
      descModChassi: data[0][1],
      prefixoVeic: data[0][2],
      gruposDeServico: data.map((gs) => {
        return {
          descGrupoServ: gs[3],
          kmAtual: gs[4],
          kmRev: gs[5],
          probabilidade: null,
        };
      }),
    });
  }

  return celulas2;
}
