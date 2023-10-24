import * as tf from '@tensorflow/tfjs-node';
import { lerArquivoTreino } from './ler-arquivo-treino';
import { Frota } from './ler-arquivo-frota';
import { getTrainingData } from './getTrainingData';

function normalizePredictionFeatures(
  tensor: tf.Tensor2D,
  trainingTensor: tf.Tensor2D
) {
  const numFeatures = tensor.shape[1];
  const numRows = tensor.shape[0];
  const allTensors: number[][] = Array(numRows);

  const splitTensors = tf.split(tensor, numRows, 0);

  splitTensors.forEach((splitTensor, splitTensorIndex) => {
    const normalizedFeatures2: number[] = [];
    for (let index = 0; index < numFeatures; index++) {
      const feature = splitTensor.slice([0, index], [-1, 1]);
      const trainingFeature = trainingTensor.slice([0, index], [-1, 1]);

      const min = trainingFeature.min();
      const max = trainingFeature.max();

      const normalizedTensor = feature.sub(min).div(max.sub(min).add(1e-8));

      normalizedFeatures2.push(normalizedTensor.dataSync()[0]);
    }
    allTensors[splitTensorIndex] = normalizedFeatures2;
  });

  const normalizedFeaturesTensor = tf.tensor2d(allTensors);

  return normalizedFeaturesTensor;
}

export async function predict(codigoChassi: string, vehicles: Frota[]) {
  // const trainData = await lerArquivoTreino(`${codigoChassi}.csv`);
  const trainData = await getTrainingData(codigoChassi);

  const allGroups: string[] = [];

  vehicles.forEach((vehicle) =>
    vehicle.gruposDeServico.forEach((gs) => allGroups.push(gs.descGrupoServ))
  );

  const serviceGroups = [...new Set(allGroups)];

  for (let i = 0; i < serviceGroups.length; i++) {
    const index = trainData.findIndex((d) => d[0] === serviceGroups[i]);
    if (index === -1) {
      console.log('Não encontrado');
    } else {
      const predictionData: [number, number][] = [];

      vehicles.forEach((f) => {
        f.gruposDeServico.forEach((gs) => {
          if (gs.descGrupoServ === serviceGroups[i]) {
            predictionData.push([gs.kmAtual, gs.kmRev]);
          }
        });
      });

      const trainFeaturesTensor = tf.tensor2d([
        [0, 0],
        [trainData[index][1], trainData[index][2]],
      ]);

      const predictFeaturesTensor = tf.tensor2d(predictionData);
      const normalizedPredictFeaturesTensor = normalizePredictionFeatures(
        predictFeaturesTensor,
        trainFeaturesTensor
      );
      const weightenedPredictFeatures = normalizedPredictFeaturesTensor.mul([
        [0.5, 1.5],
      ]);

      // console.log('norm ', normalizedPredictFeaturesTensor.toString());
      // console.log('weig', weightenedPredictFeatures.toString());

      const model = await tf.loadLayersModel(
        `file://${codigoChassi}/${serviceGroups[i]}/model.json`
      );

      const predictions = model.predict(weightenedPredictFeatures) as tf.Tensor;

      const predicts = predictions.dataSync();

      let counter = 0;

      vehicles.forEach((vehicle) => {
        vehicle.gruposDeServico.forEach((gs) => {
          if (gs.descGrupoServ === serviceGroups[i]) {
            gs.probabilidade = Number((predicts[counter] * 100).toFixed(2));
            counter++;
          }
        });
      });
    }
  }
  return vehicles;
}
