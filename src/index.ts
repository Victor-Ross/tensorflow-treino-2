import * as tf from '@tensorflow/tfjs-node';
import { lerArquivoTreino } from './ler-arquivo-treino';

function normalizeTrainingFeatures(tensor: tf.Tensor2D) {
  const numFeatures = tensor.shape[1];
  const normalizedFeatures2 = [];

  for (let index = 0; index < numFeatures; index++) {
    const feature = tensor.slice([0, index], [-1, 1]);

    const min = feature.min();
    const max = feature.max();

    const normalizedTensor = feature.sub(min).div(max.sub(min).add(1e-8));
    normalizedFeatures2.push(normalizedTensor.dataSync());
  }

  const normalizedFeaturesTensor = tf.stack(normalizedFeatures2, 1);

  return normalizedFeaturesTensor;
}

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

function denormalize(tensor: tf.Tensor, min: tf.Tensor, max: tf.Tensor) {
  const denormalisedTensor = tensor.mul(max.sub(min)).add(min);
  return denormalisedTensor;
}

async function saveModel(model: tf.Sequential, modelName: string) {
  const filename = modelName.replace(/\//g, '-');
  await model.save(`file://18/${filename}`);
}

async function Training() {
  const data = await lerArquivoTreino('18.csv');

  const featuresNames = [...new Set(data.map((d) => d[0]))];

  const initialData = [0, 0];

  for (let i = 0; i < featuresNames.length; i++) {
    const features = [data[i][1], data[i][2]];
    const labels = [[0], [1]];
    const weigths = [1];

    const featuresTensor = tf.tensor2d([initialData, features]);
    const FeaturesTensorNormalized = normalizeTrainingFeatures(featuresTensor);
    const featuresTensorWeightened = FeaturesTensorNormalized.mul(weigths);

    const labelsTensor = tf.tensor2d(labels);

    const model = tf.sequential();

    model.add(
      tf.layers.dense({ units: 1, inputShape: [2], activation: 'sigmoid' })
    );

    model.compile({
      loss: 'binaryCrossentropy',
      optimizer: tf.train.sgd(0.1),
      metrics: ['accuracy'],
    });

    await model.fit(featuresTensorWeightened, labelsTensor, {
      epochs: 1300,
    });

    await saveModel(model, `${featuresNames[i]}`);
  }
}

Training();
