import oracledb from 'oracledb';
import path from 'node:path';

const dbConfig: oracledb.ConnectionAttributes = {
  user: 'globus',
  password: 'globus',
  connectionString: '192.168.254.7:1521/oracle',
};

oracledb.initOracleClient({
  libDir: path.join(process.cwd(), 'instantclient_21_7'),
});

export async function getConnection() {
  try {
    const connection = await oracledb.getConnection(dbConfig);

    return connection;
  } catch (error) {
    console.log(error);
  }
}

export async function closeConnection(connection: oracledb.Connection) {
  await connection.close();
}
