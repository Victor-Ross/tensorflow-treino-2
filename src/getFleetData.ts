import { closeConnection, getConnection } from './connection';

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

export async function getFleetData() {
  const connection = await getConnection();

  if (connection) {
    const result = await connection.execute<
      [number, string, number, string, string, number, number]
    >(`
      SELECT
            km.codigomodchassi,
            km.descricaomodchassi,
            km.codigogrpservi,
            km.descricaogrpservi,
            km.prefixoveic,
            km.kmpercorrido,
            km.kmpercorridoposrev
      FROM 
            VW_MAN_KM_GRUPO_SERVICO km
      GROUP BY
            km.codigomodchassi,
            km.descricaomodchassi,
            km.codigogrpservi,
            km.descricaogrpservi,
            km.prefixoveic,
            km.kmpercorrido,
            km.kmpercorridoposrev
     `);

    let veiculos = [...new Set(result.rows!.map((c) => c[4]))];
    let frota: Frota[] = [];

    for (let v = 0; v < veiculos.length; v++) {
      const data = result.rows!.filter((c) => c[4] === veiculos[v]);

      frota.push({
        codigoModChassi: data[0][0],
        descModChassi: data[0][1],
        prefixoVeic: data[0][4],
        gruposDeServico: data.map((gs) => {
          return {
            descGrupoServ: gs[3],
            kmAtual: gs[5],
            kmRev: gs[6],
            probabilidade: null,
          };
        }),
      });
    }

    await closeConnection(connection);

    return frota;
  } else {
    throw new Error('Nenhum dado de frota no banco.');
  }
}
