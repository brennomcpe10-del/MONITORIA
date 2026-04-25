/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { useState, useEffect, useMemo, FormEvent } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut as firebaseSignOut,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp, 
  updateDoc,
  onSnapshot,
  getDocFromServer
} from 'firebase/firestore';
import { 
  Calculator, 
  LogOut, 
  LayoutDashboard, 
  Users, 
  PlusCircle,
  GraduationCap,
  Play,
  History,
  TrendingUp,
  AlertCircle,
  BarChart3,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lightbulb,
  Loader2,
  ClipboardList,
  PlusSquare,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Toaster, toast } from 'sonner';
import firebaseConfig from '../firebase-applet-config.json';

// --- Firebase Initialization ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
const auth = getAuth(app);

// --- Types ---
type Role = 'student' | 'monitor';

interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: Role;
  lastMissedQuestionIds?: string[];
}

interface Question {
  id: string;
  text: string;
  topic: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  createdAt: any;
  createdBy: string;
}

interface QuizResult {
  id?: string;
  userId: string;
  date: any;
  total: number;
  score: number;
  topicStats: {
    [topic: string]: {
      total: number;
      errors: number;
    };
  };
  missedQuestionIds: string[];
}

// --- Error Handling ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  toast.error(`Erro no banco de dados: ${errInfo.error}`);
}

// --- Database Service ---
const dbService = {
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? { uid: userId, ...docSnap.data() } as UserProfile : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${userId}`);
      return null;
    }
  },
  async createUserProfile(profile: UserProfile): Promise<void> {
    try {
      await setDoc(doc(db, 'users', profile.uid), {
        name: profile.name,
        email: profile.email,
        role: profile.role,
        lastMissedQuestionIds: []
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${profile.uid}`);
    }
  },
  async updateUserLastMissed(userId: string, missedIds: string[]): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), { lastMissedQuestionIds: missedIds });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  },
  async getQuestionsByTopic(topic?: string): Promise<Question[]> {
    try {
      const qCol = collection(db, 'questions');
      const q = topic ? query(qCol, where('topic', '==', topic)) : query(qCol);
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'questions');
      return [];
    }
  },
  async addQuestion(question: Omit<Question, 'id' | 'createdAt'>): Promise<void> {
    try {
      await addDoc(collection(db, 'questions'), { ...question, createdAt: serverTimestamp() });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'questions');
    }
  },
  async saveQuizResult(result: Omit<QuizResult, 'id' | 'date'>): Promise<void> {
    try {
      await addDoc(collection(db, 'quiz_results'), { ...result, date: serverTimestamp() });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'quiz_results');
    }
  },
  async getStudentResults(userId: string): Promise<QuizResult[]> {
    try {
      const q = query(collection(db, 'quiz_results'), where('userId', '==', userId), orderBy('date', 'desc'), limit(50));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuizResult));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'quiz_results');
      return [];
    }
  },
  async getAllResults(): Promise<QuizResult[]> {
    try {
      const q = query(collection(db, 'quiz_results'), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuizResult));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'quiz_results');
      return [];
    }
  },
  async getAllQuestions(): Promise<Question[]> {
    try {
      const snapshot = await getDocs(collection(db, 'questions'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'questions');
      return [];
    }
  }
};

// --- Seed Data ---
const sampleQuestions = [
  { topic: 'Funções de 1º Grau', text: 'Qual é o valor do coeficiente angular da reta que passa pelos pontos A(1, 2) e B(3, 8)?', options: ['2', '3', '4', '6'], correctIndex: 1, explanation: 'O coeficiente angular (m) é dado por (y2 - y1) / (x2 - x1). Logo, (8 - 2) / (3 - 1) = 6 / 2 = 3.' },
  { topic: 'Trigonometria', text: 'Se sen(x) = 1/2 e x está no primeiro quadrante, qual o valor de cos(x)?', options: ['√3/2', '√2/2', '1/2', '0'], correctIndex: 0, explanation: 'Pela relação fundamental: sen²x + cos²x = 1. (1/2)² + cos²x = 1 -> 1/4 + cos²x = 1 -> cos²x = 3/4 -> cosx = √3/2.' },
  { topic: 'Probabilidade', text: 'Ao lançar um dado justo de 6 faces, qual a probabilidade de sair um número primo?', options: ['1/6', '1/3', '1/2', '2/3'], correctIndex: 2, explanation: 'Os números primos entre 1 e 6 são 2, 3 e 5. São 3 favoritos num total de 6 possibilidades. 3/6 = 1/2.' },
  { topic: 'Geometria Espacial', text: 'Qual o volume de um cilindro com raio da base 2cm e altura 5cm? (Use π = 3)', options: ['30 cm³', '45 cm³', '60 cm³', '90 cm³'], correctIndex: 2, explanation: 'V = π * r² * h. V = 3 * 2² * 5 = 3 * 4 * 5 = 60 cm³.' },
  { topic: 'Estatística', text: 'Em um conjunto de dados {2, 2, 5, 7, 9}, qual é a mediana?', options: ['2', '5', '7', '9'], correctIndex: 1, explanation: 'A mediana é o valor central. Ordenado: 2, 2, 5, 7, 9. O valor central é 5.' },
  { topic: 'Logaritmos', text: 'Determine o valor de log₂ (32).', options: ['2', '4', '5', '6'], correctIndex: 2, explanation: 'log₂ (32) = x -> 2^x = 32. Como 32 = 2^5, então x = 5.' },
  { topic: 'Progressão Aritmética', text: 'Qual o 10º termo da PA (3, 7, 11, ...)?', options: ['36', '39', '43', '47'], correctIndex: 1, explanation: 'Usando a fórmula do termo geral: an = a1 + (n-1)r. a10 = 3 + (10-1)*4 = 3 + 36 = 39.' }
];

async function seedInitialData() {
  const existing = await dbService.getQuestionsByTopic();
  if (existing.length === 0) {
    for (const q of sampleQuestions) {
      await dbService.addQuestion({ ...q, createdBy: 'system' });
    }
  }
}

// --- Components ---

function AuthPage({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50 md:p-12">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
              <Calculator className="h-8 w-8" />
            </div>
            <h2 className="mb-2 text-3xl font-bold tracking-tight text-slate-900">Monitoria Matemática</h2>
            <p className="text-slate-500">Pratique questões, acompanhe seu desempenho e tire suas dúvidas de matemática.</p>
          </div>
          <div className="space-y-4">
            <button onClick={onSignIn} className="flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-indigo-600 px-4 text-base font-semibold text-white transition-all hover:bg-indigo-700 active:scale-[0.98]">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="h-5 w-5 rounded-full bg-white p-0.5" />
              Entrar com Google
            </button>
            <div className="flex items-center gap-4 py-2 text-slate-300">
              <div className="h-px flex-1 bg-slate-200"></div>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Exclusivo 3º Ano C</span>
              <div className="h-px flex-1 bg-slate-200"></div>
            </div>
            <div className="rounded-xl bg-blue-50 p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-blue-700">
                <GraduationCap className="h-5 w-5" />
                <span className="text-sm font-bold">Acesso para Alunos e Monitores</span>
              </div>
            </div>
          </div>
        </div>
        <p className="mt-8 text-center text-xs text-slate-400">Desenvolvido para auxiliar no aprendizado de matemática.</p>
      </motion.div>
    </div>
  );
}

function Dashboard({ onStartQuiz, profile }: { onStartQuiz: (count: number, topic?: string) => void, profile: UserProfile }) {
  const [results, setResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCount, setSelectedCount] = useState<number>(10);
  const [selectedTopic, setSelectedTopic] = useState<string | undefined>(undefined);
  const [topics, setTopics] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const studentResults = await dbService.getStudentResults(profile.uid);
      setResults(studentResults);
      const allQuestions = await dbService.getAllQuestions();
      const uniqueTopics = Array.from(new Set(allQuestions.map(q => q.topic)));
      setTopics(uniqueTopics);
      setLoading(false);
    };
    fetchData();
  }, [profile.uid]);

  const latestResult = results[0];
  const totalCorrect = results.reduce((acc, curr) => acc + curr.score, 0);
  const totalQuestions = results.reduce((acc, curr) => acc + curr.total, 0);
  const accuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-3">
        <div className="relative overflow-hidden rounded-3xl bg-indigo-600 p-8 text-white shadow-xl shadow-indigo-600/20 md:col-span-2">
          <div className="absolute right-0 top-0 h-64 w-64 translate-x-1/4 -translate-y-1/4 rounded-full bg-white/10 blur-3xl"></div>
          <div className="relative z-10">
            <h2 className="mb-2 text-3xl font-bold">Olá, {profile.name}! 👋</h2>
            <p className="mb-8 text-indigo-100">Pronto para a monitoria de hoje?</p>
            <div className="flex flex-wrap gap-8">
              <div><p className="text-xs font-bold uppercase tracking-widest text-indigo-200">Simulados</p><p className="text-3xl font-bold">{results.length}</p></div>
              <div><p className="text-xs font-bold uppercase tracking-widest text-indigo-200">Precisão</p><p className="text-3xl font-bold">{accuracy.toFixed(0)}%</p></div>
            </div>
            <button onClick={() => onStartQuiz(selectedCount, selectedTopic)} className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white font-bold text-indigo-600 transition-all hover:bg-slate-50 active:scale-95 sm:w-auto sm:px-8">
              <Play className="h-5 w-5 fill-indigo-600" /> Começar Novo Simulado
            </button>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800"><History className="h-5 w-5 text-indigo-600" />Último Desempenho</h3>
          {latestResult ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                <div><p className="text-sm font-medium text-slate-500">Acertos</p><p className="text-xl font-bold">{latestResult.score}/{latestResult.total}</p></div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-indigo-100 border-t-indigo-600 font-bold text-xs">
                  {((latestResult.score / latestResult.total) * 100).toFixed(0)}%
                </div>
              </div>
              <p className="text-xs text-slate-400">Realizado em {format(latestResult.date.toDate(), "dd 'de' MMMM", { locale: ptBR })}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center text-slate-300">
              <BarChart3 className="mb-2 h-12 w-12 opacity-20" />
              <p className="text-sm font-medium">Nenhum simulado ainda.</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
          <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-slate-800"><Calculator className="h-5 w-5 text-indigo-600" />Configurar Simulado</h3>
          <p className="mb-6 text-sm text-slate-500">Escolha a quantidade de questões e o assunto.</p>
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700">Quantidade de Questões</label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 20].map(count => (
                  <button key={count} onClick={() => setSelectedCount(count)} className={`h-10 rounded-lg font-bold transition-all ${selectedCount === count ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    {count}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700">Assunto (Opcional)</label>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setSelectedTopic(undefined)} className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${selectedTopic === undefined ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>Todos</button>
                {topics.map(topic => (
                  <button key={topic} onClick={() => setSelectedTopic(topic)} className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${selectedTopic === topic ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{topic}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
          <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-slate-800"><AlertCircle className="h-5 w-5 text-amber-500" />Pontos de Atenção</h3>
          <p className="mb-6 text-sm text-slate-500">Assuntos com maior índice de erro.</p>
          {results.length > 0 ? (
            <div className="space-y-4">
              {Object.entries(results.reduce((acc, curr) => {
                Object.entries(curr.topicStats).forEach(([topic, stats]: [string, any]) => {
                  if (!acc[topic]) acc[topic] = { total: 0, errors: 0 };
                  acc[topic].total += stats.total; 
                  acc[topic].errors += stats.errors;
                });
                return acc;
              }, {} as any)).sort((a: any, b: any) => (b[1].errors / b[1].total) - (a[1].errors / a[1].total)).slice(0, 3).map(([topic, stats]: any) => (
                <div key={topic} className="flex items-center justify-between">
                  <span className="rounded-lg bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">{topic}</span>
                  <span className="text-xs font-bold text-slate-500">{((stats.errors / stats.total) * 100).toFixed(0)}% de Erro</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-slate-400">Continue praticando para ver estatísticas.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Quiz({ config, profile, onComplete }: { config: { count: number, topic?: string }, profile: UserProfile, onComplete: () => void }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      const all = await dbService.getQuestionsByTopic(config.topic);
      const shuffled = [...all].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, config.count);
      setQuestions(selected);
      setSelectedAnswers(new Array(selected.length).fill(null));
      setLoading(false);
    };
    fetchQuestions();
  }, [config.topic, config.count]);

  const currentQuestion = questions[currentIndex];
  const isPreviouslyMissed = currentQuestion && profile.lastMissedQuestionIds?.includes(currentQuestion.id);

  const handleSelect = (index: number) => {
    if (isFinished) return;
    const newAnswers = [...selectedAnswers];
    newAnswers[currentIndex] = index;
    setSelectedAnswers(newAnswers);
  };

  const finishQuiz = async () => {
    setIsFinished(true);
    const correctCount = selectedAnswers.reduce((acc, ans, idx) => ans === questions[idx].correctIndex ? acc + 1 : acc, 0);
    const topicStats: any = {}; const missedIds: string[] = [];
    questions.forEach((q, idx) => {
      if (!topicStats[q.topic]) topicStats[q.topic] = { total: 0, errors: 0 };
      topicStats[q.topic].total += 1;
      if (selectedAnswers[idx] !== q.correctIndex) { topicStats[q.topic].errors += 1; missedIds.push(q.id); }
    });
    await dbService.saveQuizResult({ userId: profile.uid, total: questions.length, score: correctCount, topicStats, missedQuestionIds: missedIds });
    await dbService.updateUserLastMissed(profile.uid, missedIds);
    toast.success('Simulado finalizado!');
  };

  if (loading) return <div className="flex flex-col items-center justify-center py-20"><Loader2 className="h-12 w-12 animate-spin text-indigo-600" /><p className="mt-4 font-medium text-slate-500">Preparando questões...</p></div>;
  if (questions.length === 0) return <div className="text-center p-12"><AlertTriangle className="mx-auto h-12 w-12 text-amber-500" /><h3 className="mt-4 text-xl font-bold">Nenhuma questão encontrada</h3><button className="mt-6 font-bold text-indigo-600" onClick={onComplete}>Voltar</button></div>;

  if (isFinished) {
    const finalScore = selectedAnswers.reduce((acc, ans, idx) => ans === questions[idx].correctIndex ? acc + 1 : acc, 0);
    return (
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="overflow-hidden rounded-3xl bg-white shadow-2xl">
          <div className="bg-indigo-600 p-12 text-center text-white">
            <CheckCircle2 className="mx-auto h-16 w-16 mb-4" /><h3 className="text-3xl font-bold">Resultado Final</h3><p className="text-indigo-100">Simulado concluído!</p>
          </div>
          <div className="relative -mt-8 mx-6 bg-white rounded-2xl p-8 shadow-xl">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="text-center space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sua Pontuação</p>
                <p className="text-6xl font-black text-indigo-600">{finalScore}/{questions.length}</p>
                <span className="inline-block bg-indigo-50 px-3 py-1 text-sm font-bold text-indigo-600 rounded-full">{((finalScore/questions.length)*100).toFixed(0)}% de Acerto</span>
              </div>
              <div className="space-y-4">
                <h4 className="font-bold flex items-center gap-2 text-slate-800"><TrendingUp className="h-5 w-5 text-emerald-500" />Desempenho</h4>
                <div className="space-y-3">
                  {Object.entries(questions.reduce((acc, q, idx) => {
                    const ok = selectedAnswers[idx] === q.correctIndex;
                    if (!acc[q.topic]) acc[q.topic] = { total: 0, ok: 0 };
                    acc[q.topic].total += 1; 
                    if (ok) acc[q.topic].ok += 1; 
                    return acc;
                  }, {} as Record<string, { total: number, ok: number }>)).map(([topic, stats]: [string, { total: number, ok: number }]) => (
                    <div key={topic}>
                      <div className="flex justify-between text-xs font-bold mb-1"><span>{topic}</span><span>{stats.ok}/{stats.total}</span></div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-600 transition-all" style={{ width: `${(stats.ok/stats.total)*100}%` }}></div></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="p-8 text-center"><button onClick={onComplete} className="h-12 w-full max-w-xs rounded-xl bg-indigo-600 font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-700">Voltar para o Início</button></div>
        </div>
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-slate-800">Correção Comentada</h3>
          {questions.map((q, idx) => (
            <div key={q.id} className={`rounded-3xl border-l-8 bg-white p-6 shadow-lg ${selectedAnswers[idx] === q.correctIndex ? 'border-emerald-500' : 'border-rose-500'}`}>
              <div className="mb-4 flex items-center justify-between">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 uppercase tracking-wider">{q.topic}</span>
                {selectedAnswers[idx] === q.correctIndex ? <span className="text-sm font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Correto</span> : <span className="text-sm font-bold text-rose-600 flex items-center gap-1"><XCircle className="h-4 w-4" /> Incorreto</span>}
              </div>
              <p className="mb-6 text-lg font-bold leading-relaxed text-slate-800">{q.text}</p>
              <div className="space-y-2">
                {q.options.map((opt, oIdx) => (
                  <div key={oIdx} className={`p-4 rounded-xl border text-sm font-medium flex items-center justify-between ${oIdx === q.correctIndex ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : oIdx === selectedAnswers[idx] ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                    {opt} {oIdx === q.correctIndex && <CheckCircle2 className="h-4 w-4 text-emerald-600" />} {oIdx === selectedAnswers[idx] && oIdx !== q.correctIndex && <XCircle className="h-4 w-4 text-rose-600" />}
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-2xl bg-indigo-50 p-5 text-indigo-900 border border-indigo-100">
                <div className="flex items-center gap-2 font-bold mb-2 text-indigo-700"><Lightbulb className="h-5 w-5" /> Resolução do Monitor</div>
                <p className="text-sm italic leading-relaxed opacity-80">{q.explanation}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 space-y-4">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-slate-200 px-4 py-1 text-xs font-bold text-slate-600">Questão {currentIndex + 1} de {questions.length}</span>
          <button onClick={onComplete} className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors">Sair / Desistir</button>
        </div>
        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} className="h-full bg-indigo-600"></motion.div></div>
      </div>
      <Card>
        <div className="p-6 md:p-8">
          <div className="mb-6 flex flex-wrap gap-2">
            <span className="rounded-lg bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">{currentQuestion.topic}</span>
            {isPreviouslyMissed && <span className="flex items-center gap-1 rounded-lg bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 animate-pulse"><AlertTriangle className="h-3 w-3" /> Errada anteriormente</span>}
          </div>
          <h3 className="mb-8 text-xl font-bold leading-relaxed text-slate-800 md:text-2xl">{currentQuestion.text}</h3>
          <div className="space-y-3">
            {currentQuestion.options.map((opt, idx) => (
              <button key={idx} onClick={() => handleSelect(idx)} className={`flex w-full items-center gap-4 rounded-2xl border-2 p-4 transition-all text-left group ${selectedAnswers[currentIndex] === idx ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 hover:border-slate-200'}`}>
                <div className={`h-8 w-8 flex-shrink-0 rounded-lg flex items-center justify-center font-black ${selectedAnswers[currentIndex] === idx ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{String.fromCharCode(65 + idx)}</div>
                <span className={`font-bold ${selectedAnswers[currentIndex] === idx ? 'text-indigo-800' : 'text-slate-700'}`}>{opt}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 p-6">
          <button onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))} disabled={currentIndex === 0} className="flex items-center gap-1 text-sm font-bold text-slate-400 hover:text-slate-600 disabled:opacity-0 transition-all"><ArrowLeft className="h-4 w-4" /> Anterior</button>
          {currentIndex === questions.length - 1 ? (
            <button onClick={finishQuiz} disabled={selectedAnswers[currentIndex] === null} className="rounded-full bg-indigo-600 px-10 py-3 font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-all disabled:opacity-50">Finalizar</button>
          ) : (
            <button onClick={() => setCurrentIndex(currentIndex + 1)} disabled={selectedAnswers[currentIndex] === null} className="rounded-full bg-indigo-600 px-10 py-3 font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2">Próxima <ArrowRight className="h-4 w-4" /></button>
          )}
        </div>
      </Card>
    </div>
  );
}

function MonitorPanel() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stats' | 'list' | 'add'>('stats');
  const [newQ, setNewQ] = useState({ text: '', topic: '', options: ['', '', '', ''], correctIndex: 0, explanation: '' });

  const fetchData = async () => {
    const allQs = await dbService.getAllQuestions(); const allRs = await dbService.getAllResults();
    setQuestions(allQs); setResults(allRs); setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newQ.text || !newQ.topic || newQ.options.some(o => !o) || !newQ.explanation) { toast.error('Complete todos os campos.'); return; }
    await dbService.addQuestion({ ...newQ, createdBy: 'monitor' });
    toast.success('Questão cadastrada!');
    setNewQ({ text: '', topic: '', options: ['', '', '', ''], correctIndex: 0, explanation: '' }); fetchData();
  };

  const topicStats = results.reduce((acc, curr) => {
    Object.entries(curr.topicStats).forEach(([topic, stats]: [string, any]) => {
      if (!acc[topic]) acc[topic] = { total: 0, errors: 0 }; 
      acc[topic].total += stats.total; 
      acc[topic].errors += stats.errors;
    }); 
    return acc;
  }, {} as Record<string, { total: number; errors: number }>);

  const mostMissed = questions.map(q => ({ ...q, misses: results.reduce((acc, r) => acc + (r.missedQuestionIds.includes(q.id) ? 1 : 0), 0) })).sort((a,b) => b.misses - a.misses).slice(0, 10);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="mb-8"><h2 className="text-3xl font-black text-slate-800">Painel do Monitor</h2><p className="text-slate-500">Gestão de questões e análise de progresso da turma.</p></div>
      <div className="flex gap-2 rounded-2xl bg-slate-200/50 p-1 mb-8 w-fit">
        {['stats', 'list', 'add'].map((tab: any) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>
            {tab === 'stats' ? 'Estatísticas' : tab === 'list' ? 'Questões' : 'Adicionar'}
          </button>
        ))}
      </div>

      {activeTab === 'stats' && (
        <div className="space-y-8">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl bg-white p-6 shadow-lg border border-slate-100 flex flex-col items-center justify-center text-center"><p className="text-xs font-bold text-slate-400 uppercase mb-1">Simulados</p><p className="text-4xl font-black text-indigo-600">{results.length}</p></div>
            <div className="rounded-3xl bg-white p-6 shadow-lg border border-slate-100 flex flex-col items-center justify-center text-center"><p className="text-xs font-bold text-slate-400 uppercase mb-1">Banco Questões</p><p className="text-4xl font-black text-emerald-600">{questions.length}</p></div>
            <div className="rounded-3xl bg-white p-6 shadow-lg border border-slate-100 flex flex-col items-center justify-center text-center"><p className="text-xs font-bold text-slate-400 uppercase mb-1">Média Turma</p><p className="text-4xl font-black text-amber-500">{results.length > 0 ? (results.reduce((a,b)=>a+b.score,0)/results.reduce((a,b)=>a+b.total,0)*100).toFixed(0):0}%</p></div>
          </div>
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100"><h3 className="text-xl font-bold mb-6 text-slate-800">Taxa de Erro por Assunto</h3>
              <div className="space-y-4">
                {Object.entries(topicStats).sort((a:any,b:any)=>(b[1].errors/b[1].total)-(a[1].errors/a[1].total)).map(([topic, stats]: any) => (
                  <div key={topic} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="font-bold text-slate-700">{topic}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-black ${stats.errors/stats.total > 0.4 ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>{((stats.errors/stats.total)*100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100"><h3 className="text-xl font-bold mb-6 text-slate-800">Questões mais Erradas</h3>
              <div className="space-y-4">
                {mostMissed.map(q => (
                  <div key={q.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="truncate text-sm font-medium text-slate-600 pr-4">{q.text}</span>
                    <span className="flex-shrink-0 font-black text-rose-600 text-sm">{q.misses} erros</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'list' && (
        <Card className="p-0 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-white flex justify-between items-center"><h3 className="font-bold text-slate-800">Todas as Questões</h3><Badge>{questions.length}</Badge></div>
          <div className="overflow-x-auto"><table className="w-full text-left">
            <thead><tr className="bg-slate-50 text-xs font-bold text-slate-400 uppercase"><th className="p-4">Assunto</th><th className="p-4">Enunciado</th><th className="p-4 text-right">Ação</th></tr></thead>
            <tbody>{questions.map(q => (<tr key={q.id} className="border-t border-slate-100 transition-colors hover:bg-slate-50/50"><td className="p-4"><span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">{q.topic}</span></td><td className="p-4 max-w-md truncate text-sm font-medium text-slate-600">{q.text}</td><td className="p-4 text-right"><button className="text-slate-300 hover:text-rose-600 transition-colors"><Trash2 className="h-4 w-4" /></button></td></tr>))}</tbody>
          </table></div>
        </Card>
      )}

      {activeTab === 'add' && (
        <div className="max-w-3xl mx-auto"><div className="bg-white rounded-3xl p-8 shadow-2xl border border-slate-100"><h3 className="text-2xl font-bold mb-8 text-slate-800">Nova Questão</h3>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2"><label className="text-sm font-bold text-slate-700">Assunto</label><input className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all" value={newQ.topic} onChange={e=>setNewQ({...newQ, topic: e.target.value})} placeholder="Ex: Progressão Geométrica" /></div>
            <div className="space-y-2"><label className="text-sm font-bold text-slate-700">Enunciado</label><textarea rows={3} className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all text-sm" value={newQ.text} onChange={e=>setNewQ({...newQ, text: e.target.value})} placeholder="Insira o texto da questão..." /></div>
            <div className="space-y-4"><label className="text-sm font-bold text-slate-700">Alternativas</label>
              {newQ.options.map((opt, idx) => (
                <div key={idx} className="flex gap-3 items-center">
                  <div className={`h-10 w-10 flex-shrink-0 rounded-xl flex items-center justify-center font-black ${newQ.correctIndex === idx ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}>{String.fromCharCode(65 + idx)}</div>
                  <input className="flex-1 h-10 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none" value={opt} onChange={e=>{const o=[...newQ.options]; o[idx]=e.target.value; setNewQ({...newQ, options: o});}} />
                  <input type="radio" checked={newQ.correctIndex===idx} onChange={()=>setNewQ({...newQ, correctIndex: idx})} className="h-5 w-5 accent-indigo-600" />
                </div>
              ))}
            </div>
            <div className="space-y-2"><label className="text-sm font-bold text-slate-700">Explicação / Resolução</label><textarea rows={3} className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all text-sm italic" value={newQ.explanation} onChange={e=>setNewQ({...newQ, explanation: e.target.value})} placeholder="Explique o raciocínio..." /></div>
            <button type="submit" className="h-14 w-full rounded-2xl bg-indigo-600 text-white font-bold text-lg shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 active:scale-95 transition-all">Salvar Questão</button>
          </form>
        </div></div>
      )}
    </div>
  );
}

// --- Internal UI Lib (Tailwind wrappers) ---
function Card({ children, className }: { children: React.ReactNode, className?: string }) {
  return <div className={`bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden ${className}`}>{children}</div>;
}
function Badge({ children, variant = 'primary' }: { children: React.ReactNode, variant?: string }) {
  const styles: any = { primary: 'bg-indigo-50 text-indigo-600', secondary: 'bg-slate-100 text-slate-600', outline: 'border border-slate-200 text-slate-500' };
  return <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${styles[variant] || styles.primary}`}>{children}</span>;
}

// --- Main App Logic ---
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'dashboard' | 'quiz' | 'monitor'>('dashboard');
  const [quizConfig, setQuizConfig] = useState<{ count: number; topic?: string } | null>(null);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;
    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (unsubscribeProfile) { unsubscribeProfile(); unsubscribeProfile = null; }
      if (u) {
        let p = await dbService.getUserProfile(u.uid);
        if (!p) {
          const isMonitor = u.email === 'brennomcpe10@gmail.com';
          const newP: UserProfile = { uid: u.uid, name: u.displayName || 'Estudante', email: u.email || '', role: isMonitor ? 'monitor' : 'student' };
          await dbService.createUserProfile(newP);
        }
        unsubscribeProfile = onSnapshot(doc(db, 'users', u.uid), s => { if (s.exists()) setProfile({ uid: u.uid, ...s.data() } as UserProfile); setLoading(false); });
      } else { setProfile(null); setLoading(false); }
    });
    return () => { unsubscribeAuth(); if (unsubscribeProfile) unsubscribeProfile(); };
  }, []);

  useEffect(() => { if (user) seedInitialData(); }, [user]);

  const signIn = () => signInWithPopup(auth, new GoogleAuthProvider()).catch(e => toast.error('Falha no login'));
  const signOut = () => firebaseSignOut(auth);

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50 flex-col gap-4 text-indigo-600 font-bold"><Calculator className="h-12 w-12 animate-bounce" /><p className="animate-pulse">Monitoria Matemática 3º Ano C...</p></div>;
  if (!user || !profile) return <><AuthPage onSignIn={signIn} /><Toaster position="top-center" richColors/></>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <header className="sticky top-0 z-50 border-b border-indigo-50 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <div className="flex cursor-pointer items-center gap-3" onClick={() => setCurrentView('dashboard')}>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 transition-transform hover:scale-110 active:scale-95"><Calculator className="h-7 w-7" /></div>
            <div><h1 className="text-xl font-black tracking-tighter text-slate-900">Monitoria <span className="text-indigo-600">3º Ano C</span></h1><p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600/50">Matemática Ninja</p></div>
          </div>
          <nav className="hidden items-center gap-2 md:flex">
            <button onClick={() => setCurrentView('dashboard')} className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${currentView === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:bg-slate-100'}`}><LayoutDashboard className="h-4 w-4" /> Início</button>
            {profile.role === 'monitor' && <button onClick={() => setCurrentView('monitor')} className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${currentView === 'monitor' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:bg-slate-100'}`}><Users className="h-4 w-4" /> Monitoria</button>}
          </nav>
          <div className="flex items-center gap-4">
            <div className="hidden border-r border-slate-100 pr-4 text-right sm:block text-slate-800"><p className="text-sm font-black">{profile.name}</p><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{profile.role}</p></div>
            <button onClick={signOut} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition-all hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50"><LogOut className="h-5 w-5" /></button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl p-6 py-12 md:p-10">
        <AnimatePresence mode="wait">
          <motion.div key={currentView} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3, ease: 'easeOut' }}>
            {currentView === 'dashboard' && <Dashboard onStartQuiz={(c, t)=>{setQuizConfig({count:c, topic:t}); setCurrentView('quiz');}} profile={profile} />}
            {currentView === 'quiz' && quizConfig && <Quiz config={quizConfig} profile={profile} onComplete={() => setCurrentView('dashboard')} />}
            {currentView === 'monitor' && <MonitorPanel />}
          </motion.div>
        </AnimatePresence>
      </main>
      <Toaster position="top-center" richColors />
    </div>
  );
}
