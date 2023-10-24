import { getFleetData } from './getFleetData';
import { Frota } from './ler-arquivo-frota';
import { predict } from './predict';

async function RunPredictionAI() {
  try {
    const frota = await getFleetData();

    const chassis = [...new Set(frota.map((frota) => frota.codigoModChassi))];

    const vehiclesWithProbabilities: Frota[] = [];

    for await (const chassi of chassis) {
      const vehicles = frota.filter(
        (vehicle) => vehicle.codigoModChassi === chassi
      );

      const vehiclesPredictes = await predict(String(chassi), vehicles);
      vehiclesWithProbabilities.push(...vehiclesPredictes);
    }

    vehiclesWithProbabilities.forEach((v) => {
      console.log(v);
    });
  } catch (error) {
    console.log(error);
  }
}

RunPredictionAI();
