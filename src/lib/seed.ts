import { dbService } from '../services/db';

const sampleQuestions = [
  {
    topic: 'Funções de 1º Grau',
    text: 'Qual é o valor do coeficiente angular da reta que passa pelos pontos A(1, 2) e B(3, 8)?',
    options: ['2', '3', '4', '6'],
    correctIndex: 1,
    explanation: 'O coeficiente angular (m) é dado por (y2 - y1) / (x2 - x1). Logo, (8 - 2) / (3 - 1) = 6 / 2 = 3.'
  },
  {
    topic: 'Trigonometria',
    text: 'Se sen(x) = 1/2 e x está no primeiro quadrante, qual o valor de cos(x)?',
    options: ['√3/2', '√2/2', '1/2', '0'],
    correctIndex: 0,
    explanation: 'Pela relação fundamental: sen²x + cos²x = 1. (1/2)² + cos²x = 1 -> 1/4 + cos²x = 1 -> cos²x = 3/4 -> cosx = √3/2.'
  },
  {
    topic: 'Probabilidade',
    text: 'Ao lançar um dado justo de 6 faces, qual a probabilidade de sair um número primo?',
    options: ['1/6', '1/3', '1/2', '2/3'],
    correctIndex: 2,
    explanation: 'Os números primos entre 1 e 6 são 2, 3 e 5. São 3 favoritos num total de 6 possibilidades. 3/6 = 1/2.'
  },
  {
    topic: 'Geometria Espacial',
    text: 'Qual o volume de um cilindro com raio da base 2cm e altura 5cm? (Use π = 3)',
    options: ['30 cm³', '45 cm³', '60 cm³', '90 cm³'],
    correctIndex: 2,
    explanation: 'V = π * r² * h. V = 3 * 2² * 5 = 3 * 4 * 5 = 60 cm³.'
  },
  {
    topic: 'Estatística',
    text: 'Em um conjunto de dados {2, 2, 5, 7, 9}, qual é a mediana?',
    options: ['2', '5', '7', '9'],
    correctIndex: 1,
    explanation: 'A mediana é o valor central. Ordenado: 2, 2, 5, 7, 9. O valor central é 5.'
  },
  {
    topic: 'Logaritmos',
    text: 'Determine o valor de log₂ (32).',
    options: ['2', '4', '5', '6'],
    correctIndex: 2,
    explanation: 'log₂ (32) = x -> 2^x = 32. Como 32 = 2^5, então x = 5.'
  },
  {
    topic: 'Progressão Aritmética',
    text: 'Qual o 10º termo da PA (3, 7, 11, ...)?',
    options: ['36', '39', '43', '47'],
    correctIndex:  1, // wait. a1=3, r=4. a10 = a1 + 9r = 3 + 9*4 = 3 + 36 = 39. Correct. 
    explanation: 'Usando a fórmula do termo geral: an = a1 + (n-1)r. a10 = 3 + (10-1)*4 = 3 + 36 = 39.'
  }
];

export async function seedInitialData() {
  const existing = await dbService.getQuestionsByTopic();
  if (existing.length === 0) {
    for (const q of sampleQuestions) {
      await dbService.addQuestion({
        ...q,
        createdBy: 'system'
      });
    }
    console.log('Sample data seeded');
  }
}
