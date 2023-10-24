import { closeConnection, getConnection } from './connection';

export async function getTrainingData(codigoChassi: string) {
  try {
    const connection = await getConnection();

    if (connection) {
      const result = await connection.execute<
        [number, string, number, string, number, number]
      >(`
      SELECT
      c.codigomodchassi,
      c.descricaomodchassi,
      c.codigogrpdefeito,
      c.descricaogrpservi,
      -- c.datadefeito,
      ROUND(SUM(c.kmrodado) / COUNT(*)) mediakmrodadopredef,
      -- c.datatrocaanterior,
      -- c.dataproxtroca,
      -- c.datarev,
      -- c.dataultrev,
      -- c.dataproxrev,
      ROUND(SUM(
          (
          SELECT
                SUM(v.kmpercorridoveloc)
          FROM
                bgm_velocimetro v
          WHERE
                v.codigoveic = c.codigoveic
                AND
                v.dataveloc BETWEEN c.datarev AND c.dataproxrev
          )
      ) / COUNT(*)) mediakmaposrev
FROM
      (
      SELECT
            b.codigomodchassi,
            b.descricaomodchassi,
            b.codigoveic,
            b.codigogrpdefeito,
            b.descricaogrpservi,
            b.dataaberturaos datadefeito,
            b.kmrodado,
            b.datatrocaanterior,
            b.dataproxtroca,
            b.datarev,
            (
            SELECT
                  NVL(MAX(subb.datarev), b.datatrocaanterior)
            FROM
                  VW_MAN_DEFEITOS_POR_GRUPO subb
            WHERE
                  subb.codigoveic = b.codigoveic
                  AND
                  subb.codigogrpdefeito = b.codigogrpdefeito
                  AND
                  subb.dataaberturaos = b.dataaberturaos
                  AND
                  subb.datarev < b.datarev
            ) dataultrev,
            (
            SELECT
                  NVL(MIN(subb.datarev), b.dataaberturaos)
            FROM
                  VW_MAN_DEFEITOS_POR_GRUPO subb
            WHERE
                  subb.codigoveic = b.codigoveic
                  AND
                  subb.codigogrpdefeito = b.codigogrpdefeito
                  AND
                  subb.dataaberturaos = b.dataaberturaos
                  AND
                  subb.datarev > b.datarev
            ) dataproxrev
      FROM
             VW_MAN_DEFEITOS_POR_GRUPO b
      ) c
WHERE
     c.datadefeito = c.dataproxrev
     AND
     c.kmrodado > 3000
     AND
     c.codigomodchassi = ${Number(codigoChassi)}
GROUP BY
      c.codigomodchassi,
      c.descricaomodchassi,
      c.codigogrpdefeito,
      c.descricaogrpservi
      -- c.datadefeito,
      -- c.kmrodado,
      -- c.datatrocaanterior,
      -- c.dataproxtroca,
      -- c.datarev,
      -- c.dataultrev,
      -- c.dataproxrev,
      -- c.codigoveic
     `);

      const trainingData: [string, number, number, number][] = result.rows!.map(
        (r) => {
          return [r[3], Number(r[4]), Number(r[5]), 1];
        }
      );

      await closeConnection(connection);

      return trainingData;
    } else {
      throw new Error('No connection');
    }
  } catch (error) {
    throw error;
  }
}
