/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, FormEvent } from 'react';
import { 
  Calculator, 
  BookOpen,
  Microscope,
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
  Trash2,
  Trophy,
  Target,
  Timer,
  Youtube,
  ExternalLink,
  Menu,
  ShieldCheck,
  ChevronDown,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';

// Firebase Imports
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs, 
  getDoc,
  orderBy,
  increment,
  writeBatch,
  updateDoc
} from 'firebase/firestore';

// --- Firebase Config ---
const firebaseConfig = {
  apiKey: 'AIzaSyCpVxucRWHOev_glPdkGPlbReGlDMXWkeM',
  authDomain: 'monitoria-241b7.firebaseapp.com',
  projectId: 'monitoria-241b7',
  storageBucket: 'monitoria-241b7.firebasestorage.app',
  messagingSenderId: '103385176949',
  appId: '1:103385176949:web:f217c4adc07d024e7d113c',
  measurementId: 'G-J0R4QS27C4'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- Themes ---
const COURSE_THEMES: Record<Course, { primary: string, hex: string, icon: any, title: string, classes: any }> = {
  'Matemática': {
    primary: 'indigo',
    hex: '#4f46e5',
    icon: Calculator,
    title: 'Matemática Ninja',
    classes: {
      bg: 'bg-indigo-600',
      text: 'text-indigo-600',
      ring: 'focus:ring-indigo-600/10',
      border: 'focus:border-indigo-600',
      shadow: 'shadow-indigo-600/30',
      hoverBg: 'hover:bg-indigo-50',
      lightBg: 'bg-indigo-50',
      darkHover: 'hover:bg-indigo-700',
      accText: 'text-indigo-600/50',
      decoration: 'decoration-indigo-600'
    }
  },
  'Biologia': {
    primary: 'emerald',
    hex: '#22c55e',
    icon: Microscope,
    title: 'Biologia Celular',
    classes: {
      bg: 'bg-emerald-600',
      text: 'text-emerald-600',
      ring: 'focus:ring-emerald-600/10',
      border: 'focus:border-emerald-600',
      shadow: 'shadow-emerald-600/30',
      hoverBg: 'hover:bg-emerald-50',
      lightBg: 'bg-emerald-50',
      darkHover: 'hover:bg-emerald-700',
      accText: 'text-emerald-600/50',
      decoration: 'decoration-emerald-600'
    }
  },
  'Língua Portuguesa': {
    primary: 'violet',
    hex: '#8b5cf6',
    icon: BookOpen,
    title: 'Língua Portuguesa',
    classes: {
      bg: 'bg-violet-600',
      text: 'text-violet-600',
      ring: 'focus:ring-violet-600/10',
      border: 'focus:border-violet-600',
      shadow: 'shadow-violet-600/30',
      hoverBg: 'hover:bg-violet-50',
      lightBg: 'bg-violet-50',
      darkHover: 'hover:bg-violet-700',
      accText: 'text-violet-600/50',
      decoration: 'decoration-violet-600'
    }
  }
};

// --- Types & Interfaces ---
type Role = 'estudante' | 'monitor';
type Course = 'Matemática' | 'Biologia' | 'Língua Portuguesa';

interface CourseProgress {
  lastMissedQuestionIds: string[];
  missedTopics: string[];
  totalSimulated: number;
  totalCorrect: number;
  totalQuestions: number;
  latestResult?: {
    score: number;
    total: number;
    date: string;
    topicsCount: number;
  };
}

interface UserProfile {
  name: string;
  email: string;
  role: Role;
  approved: boolean;
  permissions?: Record<string, 'monitor' | 'estudante'>;
  // Progress (Per Course)
  courses?: Record<string, CourseProgress>;
  
  // Legacy fields (will keep for compatibility)
  lastMissedQuestionIds: string[];
  missedTopics?: string[];
  totalSimulated?: number;
  totalCorrect?: number;
  totalQuestions?: number;
  latestResult?: {
    score: number;
    total: number;
    date: string;
    topicsCount: number;
  };
}

interface UserSummary {
  name: string;
  email: string;
  role: Role;
  approved: boolean;
  permissions?: Record<string, 'monitor' | 'estudante'>;
  missedTopics?: string[];
  totalSimulated?: number;
  totalCorrect?: number;
  totalQuestions?: number;
}

interface Question {
  id: string;
  text: string;
  topic: string;
  course: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  imageUrl?: string;
}

interface VideoClass {
  id: string;
  title: string;
  youtubeUrl: string;
  course: string;
  date: string;
}

interface QuizResult {
  id: string;
  date: string;
  total: number;
  score: number;
  course?: string;
  answers: { questionId: string, selectedIndex: number }[];
  topicStats: {
    [topic: string]: {
      total: number;
      errors: number;
    };
  };
  missedQuestionIds: string[];
  userEmail?: string;
  userName?: string;
}

// --- Helpers ---

const normalizeCourseKey = (course: string): string => {
  const map: Record<string, string> = {
    'Matemática': 'matematica',
    'Biologia': 'biologia',
    'Língua Portuguesa': 'portugues'
  };
  return map[course] || course.toLowerCase();
};

const verificarSeEhMonitor = (profile: UserProfile | null, activeCourse: Course): boolean => {
  if (!profile) return false;
  
  const isAdmin = profile.email === 'brennomcpe10@gmail.com';
  if (isAdmin) return true;
  
  const normalizedCourse = normalizeCourseKey(activeCourse);
  const permissions = profile.permissions || {};
  
  // Acesso estritamente vinculado ao curso ativo no objeto de permissões
  const isCourseMonitor = permissions[normalizedCourse] === 'monitor';
  
  if (!isCourseMonitor) {
    console.log(`Acesso negado para ${activeCourse} (key: ${normalizedCourse}) pois permissão é:`, permissions[normalizedCourse] || 'estudante');
  } else {
    console.log(`Acesso concedido para ${activeCourse} (key: ${normalizedCourse})`);
  }
  
  return isCourseMonitor;
};

// --- Initial Mock Data ---
const INITIAL_QUESTIONS: Question[] = [
  { id: '1', course: 'Matemática', topic: 'Funções de 1º Grau', text: 'Qual é o valor do coeficiente angular da reta que passa pelos pontos A(1, 2) e B(3, 8)?', options: ['2', '3', '4', '6'], correctIndex: 1, explanation: 'O coeficiente angular (m) é dado por (y2 - y1) / (x2 - x1). Logo, (8 - 2) / (3 - 1) = 6 / 2 = 3.' },
  { id: '2', course: 'Matemática', topic: 'Trigonometria', text: 'Se sen(x) = 1/2 e x está no primeiro quadrante, qual o valor de cos(x)?', options: ['√3/2', '√2/2', '1/2', '0'], correctIndex: 0, explanation: 'Pela relação fundamental: sen²x + cos²x = 1. (1/2)² + cos²x = 1 -> 1/4 + cos²x = 1 -> cos²x = 3/4 -> cosx = √3/2.' },
  { id: '3', course: 'Matemática', topic: 'Probabilidade', text: 'Ao lançar um dado justo de 6 faces, qual a probabilidade de sair um número primo?', options: ['1/6', '1/3', '1/2', '2/3'], correctIndex: 2, explanation: 'Os números primos entre 1 e 6 são 2, 3 e 5. São 3 favoritos num total de 6 possibilidades. 3/6 = 1/2.' },
  { id: '4', course: 'Matemática', topic: 'Geometria Espacial', text: 'Qual o volume de um cilindro com raio da base 2cm e altura 5cm? (Considere π = 3)', options: ['30 cm³', '45 cm³', '60 cm³', '90 cm³'], correctIndex: 2, explanation: 'V = π * r² * h. V = 3 * 2² * 5 = 3 * 4 * 5 = 60 cm³.' },
  { id: '5', course: 'Matemática', topic: 'Estatística', text: 'Em um conjunto de dados {2, 2, 5, 7, 9}, qual é a mediana?', options: ['2', '5', '7', '9'], correctIndex: 1, explanation: 'A mediana é o valor central. Ordenado: 2, 2, 5, 7, 9. O valor central é 5.' },
  { id: '6', course: 'Matemática', topic: 'Logaritmos', text: 'Determine o valor de log₂ (32).', options: ['2', '4', '5', '6'], correctIndex: 2, explanation: 'log₂ (32) = x -> 2^x = 32. Como 32 = 2^5, então x = 5.' },
  { id: '7', course: 'Matemática', topic: 'Progressão Aritmética', text: 'Qual o 10º termo da PA (3, 7, 11, ...)?', options: ['36', '39', '43', '47'], correctIndex: 1, explanation: 'Usando a fórmula do termo geral: an = a1 + (n-1)r. a10 = 3 + (10-1)*4 = 3 + 36 = 39.' },
  { id: '8', course: 'Matemática', topic: 'Geometria Analítica', text: 'A distância entre os pontos (0,0) e (3,4) no plano cartesiano é:', options: ['3', '4', '5', '7'], correctIndex: 2, explanation: 'd = √((x2-x1)² + (y2-y1)²). d = √(3² + 4²) = √(9+16) = √25 = 5.' }
];

// --- Sub-Components (Standard HTML/Tailwind) ---

const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, color = "indigo" }: { children: React.ReactNode, color?: "indigo" | "emerald" | "amber" | "rose" | "violet" }) => {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    violet: "bg-violet-50 text-violet-600 border-violet-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100"
  };
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${colors[color]}`}>
      {children}
    </span>
  );
};

// --- Main Application ---

export default function App() {
  // --- Auth State ---
  const [sessionEmail, setSessionEmail] = useState<string | null>(() => {
    return localStorage.getItem('mm_session_email');
  });
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loginData, setLoginData] = useState({ name: '', email: '' });

  // --- App State ---
  const [allUsers, setAllUsers] = useState<UserSummary[]>([]);
  const [activeCourse, setActiveCourse] = useState<Course>('Matemática');
  const [currentView, setCurrentView] = useState<'dashboard' | 'quiz' | 'monitor' | 'videos'>('dashboard');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showMobileCourses, setShowMobileCourses] = useState(false);

  const [hasSelectedInitialCourse, setHasSelectedInitialCourse] = useState(false);

  // Segurança: Bloqueio de Acesso indevido à Monitoria
  useEffect(() => {
    if (profile && currentView === 'monitor') {
      const temAcesso = verificarSeEhMonitor(profile, activeCourse);
      if (!temAcesso) {
        console.warn(`[SECURITY] Redirecionando usuário ${profile.email} - Sem permissão para monitoria em ${activeCourse}`);
        setCurrentView('dashboard');
        toast.error('Acesso Negado: Você não é monitor de ' + activeCourse);
      }
    }
  }, [currentView, activeCourse, profile]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [videos, setVideos] = useState<VideoClass[]>([]);
  const [userResults, setUserResults] = useState<QuizResult[]>([]);
  const [systemResults, setSystemResults] = useState<QuizResult[]>([]);
  const [quizConfig, setQuizConfig] = useState<{ count: number, topics: string[] } | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [targetCourse, setTargetCourse] = useState<Course | null>(null);

  const [isFinishing, setIsFinishing] = useState(false);

  const handleCourseSwitch = (course: Course) => {
    if (course === activeCourse) {
      setShowMenu(false);
      return;
    }
    setTargetCourse(course);
    setIsTransitioning(true);
    setShowMenu(false);
    
    // Simulate cutscene duration
    setTimeout(() => {
      setActiveCourse(course);
      setCurrentView('dashboard');
      setTimeout(() => {
        setIsTransitioning(false);
        setTargetCourse(null);
      }, 800);
    }, 1200);
  };

  // 1. Sync Profile in real-time
  useEffect(() => {
    if (!sessionEmail) {
      setProfile(null);
      return;
    }

    const unsub = onSnapshot(doc(db, 'users', sessionEmail), (docSnap) => {
      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      } else {
        // Handle case where user might have been deleted
        setProfile(null);
        setSessionEmail(null);
        localStorage.removeItem('mm_session_email');
      }
    }, (error) => {
      console.error('Error fetching profile:', error);
      toast.error('Erro ao sincronizar perfil em tempo real.');
    });

    return () => unsub();
  }, [sessionEmail]);

  // 2. Sync Questions in real-time (filtered by course)
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'questions'), (snap) => {
      const qData = snap.docs
        .map(d => ({ ...d.data(), id: d.id } as Question))
        .filter(q => {
          // Se não houver campo 'course' ou 'curso', trata como 'Matemática'
          const course = q.course || (q as any).curso || 'Matemática';
          
          // Se estamos em Matemática, aceitamos questões sem curso
          if (activeCourse === 'Matemática' && (!q.course && !(q as any).curso)) {
            // Correção Automática Opcional: Salvar cursoAtivo se não existir
            updateDoc(doc(db, 'questions', q.id), { course: 'Matemática' }).catch(() => {});
            return true;
          }

          return course === activeCourse;
        });
      setQuestions(qData);
    });
    return () => unsub();
  }, [activeCourse]);

  // 2.5 Sync Videos (filtered by course)
  useEffect(() => {
    const unsubVideos = onSnapshot(collection(db, 'videos'), (snap) => {
      const vData = snap.docs
        .map(d => ({ ...d.data(), id: d.id } as VideoClass))
        .filter(v => {
          const course = v.course || 'Matemática';
          return course === activeCourse;
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setVideos(vData);
    });
    return () => unsubVideos();
  }, [activeCourse]);

  // 3. Sync All Users (for Monitor View)
  useEffect(() => {
    if (verificarSeEhMonitor(profile, activeCourse)) {
      const unsub = onSnapshot(collection(db, 'users'), (snap) => {
        const uData = snap.docs.map(d => ({ ...d.data() } as UserSummary));
        setAllUsers(uData);
      });
      return () => unsub();
    }
  }, [profile, activeCourse]);

  // 4. Sync Personal Results (filtered by course)
  useEffect(() => {
    if (profile) {
      const q = query(
        collection(db, 'results'), 
        where('userEmail', '==', profile.email),
        orderBy('date', 'desc')
      );

      const unsub = onSnapshot(q, (snap) => {
        const rData = snap.docs
          .map(d => ({ ...d.data(), id: d.id } as QuizResult))
          .filter(r => (r.course || 'Matemática') === activeCourse);
        setUserResults(rData);
      }, (error) => {
        console.error('Error fetching personal results:', error);
        if (error.message?.includes('index')) {
           toast.error('Erro de índice no Firebase. As estatísticas pessoais podem demorar a aparecer.');
        }
      });
      return () => unsub();
    } else {
      setUserResults([]);
    }
  }, [profile?.email, activeCourse]);

  // 5. Sync All Results (System Dashboard for Monitors)
  useEffect(() => {
    if (verificarSeEhMonitor(profile, activeCourse)) {
      const q = query(collection(db, 'results'), orderBy('date', 'desc'));
      const unsub = onSnapshot(q, (snap) => {
        const rData = snap.docs
          .map(d => ({ ...d.data(), id: d.id } as QuizResult))
          .filter(r => (r.course || 'Matemática') === activeCourse);
        setSystemResults(rData);
      }, (error) => {
        console.error('Error fetching system results:', error);
      });
      return () => unsub();
    } else {
      setSystemResults([]);
    }
  }, [profile, activeCourse]);

  // Logout
  const handleLogout = () => {
    setSessionEmail(null);
    setProfile(null);
    localStorage.removeItem('mm_session_email');
    setCurrentView('dashboard');
  };

  // Login Logic
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!loginData.name || !loginData.email) return toast.error('Preencha os campos!');
    
    const email = loginData.email.toLowerCase().trim();
    const isAdmin = email === 'brennomcpe10@gmail.com';
    const name = isAdmin ? 'Halysson Brenno' : loginData.name;
    
    try {
      const userRef = doc(db, 'users', email);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        const newProfile: UserProfile = {
          name: name,
          email: email,
          role: isAdmin ? 'monitor' : 'estudante',
          approved: isAdmin ? true : false,
          lastMissedQuestionIds: []
        };
        await setDoc(userRef, newProfile);
        toast.success(newProfile.approved ? 'Bem-vindo!' : 'Cadastro realizado! Aguarde aprovação.');
      } else {
        // If admin logs in, ensure they are always monitor/approved even if data was manually changed
        if (isAdmin) {
          await setDoc(userRef, { role: 'monitor', approved: true }, { merge: true });
        }
        toast.success('Bem-vindo de volta!');
      }

      setSessionEmail(email);
      localStorage.setItem('mm_session_email', email);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao conectar ao Firebase.');
    }
  };

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 selection:bg-indigo-100">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="rounded-[2.5rem] bg-white p-10 shadow-2xl shadow-slate-200 border border-slate-100">
            <div className="flex flex-col items-center mb-10 text-center">
              <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white mb-6 shadow-xl shadow-indigo-600/30">
                <Calculator className="w-8 h-8" />
              </div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-none mb-2">Monitoria 3º Ano C</h1>
              <p className="text-slate-400 font-medium">Sua jornada rumo ao conhecimento em todas as áreas.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Seu Nome</label>
                <input 
                  className="w-full h-12 px-5 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all font-medium" 
                  value={loginData.name} onChange={e => setLoginData({...loginData, name: e.target.value})} placeholder="Ex: João Silva" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">E-mail</label>
                <input 
                  className="w-full h-12 px-5 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all font-medium" 
                  value={loginData.email} onChange={e => setLoginData({...loginData, email: e.target.value})} placeholder="jose@escola.com" 
                />
              </div>
              <button 
                type="submit"
                className="w-full h-14 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 active:scale-[0.98] transition-all mt-4"
              >
                Entrar na Plataforma
              </button>
            </form>
            <div className="mt-8 pt-8 border-t border-slate-100 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Apenas Estudantes Autorizados</p>
            </div>
          </div>
        </motion.div>
        <Toaster richColors position="top-center" />
      </div>
    );
  }

  if (!profile.approved) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
          <Card className="p-10 text-center">
             <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mx-auto mb-6 shadow-lg shadow-amber-500/10">
               <AlertCircle className="w-10 h-10" />
             </div>
             <h2 className="text-2xl font-black text-slate-800 mb-2">Acesso Pendente</h2>
             <p className="text-slate-500 font-medium mb-8">Seu cadastro foi realizado, mas ainda não foi aprovado pelo monitor responsável. Volte mais tarde!</p>
             <button onClick={handleLogout} className="w-full h-14 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all">Sair do Sistema</button>
             <div className="mt-8 pt-8 border-t border-slate-100">
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Contato: Halysson Brenno - WhatsApp: (77) 99117-7472</p>
             </div>
          </Card>
        </motion.div>
        <Toaster richColors position="top-center" />
      </div>
    );
  }

  // 2. Course Selection Screen (Netflix Style)
  if (!hasSelectedInitialCourse) {
    return (
      <motion.div 
        key="course-selector"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[900] bg-slate-50 flex flex-col items-center py-12 px-6 sm:justify-center overflow-y-auto"
      >
        <div className="max-w-6xl w-full text-center flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-10 sm:mb-20"
          >
            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight italic mb-4">
              O que vamos aprender hoje, <span className="text-indigo-600">{profile.name.split(' ')[0]}</span>?
            </h1>
            <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px] sm:text-xs">Selecione um módulo para iniciar</p>
          </motion.div>
          
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
            className="flex flex-col sm:grid sm:grid-cols-3 gap-8 sm:gap-10 w-full items-center"
          >
            {(['Matemática', 'Biologia', 'Língua Portuguesa'] as Course[]).map((c) => {
              const theme = COURSE_THEMES[c];
              return (
                <motion.button 
                  key={c}
                  variants={{
                    hidden: { opacity: 0, y: 30 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  whileHover={{ scale: 1.05, y: -8 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setActiveCourse(c);
                    setHasSelectedInitialCourse(true);
                  }}
                  className="group relative w-full flex justify-center"
                >
                  <div className={`w-full max-w-[320px] sm:max-w-none rounded-[2.5rem] sm:rounded-[3rem] ${theme.classes.bg} py-12 px-8 sm:py-20 sm:px-10 flex flex-col items-center justify-center text-white shadow-2xl ${theme.classes.shadow} transition-all duration-300 relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 blur-[50px] rounded-full"></div>
                    
                    <div className="relative mb-6 sm:mb-10 transform transition-all duration-300 group-hover:scale-110">
                       <theme.icon className="w-14 h-14 sm:w-24 sm:h-24 stroke-[1.5]" />
                    </div>
                    
                    <h2 className="relative text-2xl sm:text-3xl font-black italic uppercase tracking-tighter mb-2">{c}</h2>
                    <p className="relative text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Entrar no Módulo</p>
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
          
          <motion.button 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            onClick={handleLogout}
            className="mt-12 sm:mt-24 text-slate-300 hover:text-rose-500 font-black uppercase text-[10px] tracking-[0.4em] transition-all flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Sair da Conta
          </motion.button>
        </div>
      </motion.div>
    );
  }

  const theme = COURSE_THEMES[activeCourse];
  const targetTheme = targetCourse ? COURSE_THEMES[targetCourse] : theme;

  return (
    <div className={`min-h-screen bg-slate-50 font-sans selection:bg-${theme.primary}-100 pt-20`}>
      {/* Navbar Fixed */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100 px-4 sm:px-6 h-20 flex items-center">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 cursor-pointer" onClick={() => { setCurrentView('dashboard'); setShowMobileSidebar(false); }}>
            <div className={`w-10 h-10 sm:w-12 sm:h-12 ${theme.classes.bg} rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-lg ${theme.classes.shadow}`}>
              <theme.icon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="block">
              <h2 className="text-sm sm:text-xl font-black tracking-tighter leading-none mb-0.5 sm:mb-1">Monitoria <span className={theme.classes.text}>3º C</span></h2>
              <p className={`text-[8px] sm:text-[10px] font-black uppercase tracking-widest ${theme.classes.accText}`}>Módulo de {activeCourse}</p>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-2">
            <button 
              onClick={() => { setCurrentView('dashboard'); setShowMenu(false); }}
              className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all ${currentView === 'dashboard' ? `${theme.classes.bg} text-white shadow-lg ${theme.classes.shadow} px-6` : 'text-slate-400 hover:text-slate-600'}`}
            >
              <LayoutDashboard className="w-4 h-4" /> Início
            </button>

            <div className="relative">
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all ${showMenu || currentView === 'videos' ? `${theme.classes.bg} text-white shadow-lg ${theme.classes.shadow} px-6` : 'text-slate-400 hover:text-slate-600'}`}
              >
                <BookOpen className="w-4 h-4" /> Menu
              </button>
              
              <AnimatePresence>
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm sm:bg-transparent sm:backdrop-blur-none" onClick={() => setShowMenu(false)}></div>
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="fixed inset-x-4 top-24 sm:absolute sm:inset-auto sm:right-0 sm:top-full mt-2 sm:w-64 bg-white rounded-[2rem] sm:rounded-3xl shadow-2xl border border-slate-100 p-2 z-50 overflow-hidden"
                    >
                       <div className="hidden sm:block">
                         <button 
                           onClick={() => { setCurrentView('videos'); setShowMenu(false); }}
                           className={`flex items-center gap-3 w-full p-4 rounded-2xl ${theme.classes.hoverBg} text-slate-600 hover:${theme.classes.text} transition-all text-left`}
                         >
                           <div className={`w-10 h-10 ${theme.classes.lightBg} rounded-xl flex items-center justify-center ${theme.classes.text}`}>
                             <Youtube className="w-5 h-5" />
                           </div>
                           <div>
                             <p className="font-black text-sm">Videoaulas</p>
                             <p className="text-[10px] font-medium text-slate-400 leading-none">Aulas gravadas</p>
                           </div>
                         </button>
                         <div className="mx-4 my-2 h-px bg-slate-50"></div>
                       </div>
                       
                       <p className="px-4 py-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">Trocar de Curso</p>
                       {(['Matemática', 'Biologia', 'Língua Portuguesa'] as Course[]).map(c => (
                         <button 
                           key={c}
                           onClick={() => handleCourseSwitch(c)}
                           className={`flex items-center gap-3 w-full p-4 rounded-2xl transition-all text-left ${activeCourse === c ? `${theme.classes.bg} text-white shadow-lg ${theme.classes.shadow}` : `hover:bg-slate-50 text-slate-600 hover:${theme.classes.text}`}`}
                         >
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeCourse === c ? 'bg-white/20' : 'bg-slate-100 text-slate-400'}`}>
                             {React.createElement(COURSE_THEMES[c].icon, { className: "w-4 h-4" })}
                           </div>
                           <p className="font-black text-sm">{c}</p>
                         </button>
                       ))}

                       <div className="sm:hidden mt-2 pt-2 border-t border-slate-50">
                         <button 
                           onClick={() => setShowMenu(false)}
                           className="w-full py-4 text-xs font-black text-slate-400 uppercase tracking-widest"
                         >
                           Fechar
                         </button>
                       </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {verificarSeEhMonitor(profile, activeCourse) && (
              <button 
                onClick={() => { setCurrentView('monitor'); setShowMenu(false); }}
                className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all ${currentView === 'monitor' ? `${theme.classes.bg} text-white shadow-lg ${theme.classes.shadow} px-6` : 'text-slate-400 hover:text-slate-600'}`}
              >
                <ShieldCheck className="w-4 h-4" /> Monitoria
              </button>
            )}
          </nav>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:block text-right pr-4 border-r border-slate-100">
              <p className="text-sm font-black text-slate-800 leading-none">{profile.name.split(' ')[0]}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
                {profile.email === 'brennomcpe10@gmail.com' ? 'Admin' : (profile.permissions?.[normalizeCourseKey(activeCourse)] === 'monitor' ? 'Monitor' : 'Estudante')}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button onClick={handleLogout} className="hidden sm:flex w-10 h-10 rounded-xl bg-slate-50 items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all border border-slate-200 active:scale-95">
                <LogOut className="w-5 h-5" />
              </button>
              
              <button 
                onClick={() => setShowMobileSidebar(true)}
                className="md:hidden w-11 h-11 flex items-center justify-center bg-slate-100 rounded-xl text-slate-700 active:scale-95 transition-all shadow-sm border border-slate-200"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer (Sidebar) */}
      <AnimatePresence>
        {showMobileSidebar && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileSidebar(false)}
              className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm md:hidden"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 bottom-0 left-0 w-[280px] z-[101] bg-white shadow-2xl p-6 md:hidden flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${theme.classes.bg} rounded-xl flex items-center justify-center text-white shadow-lg`}>
                    <theme.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="font-black text-slate-800 leading-none">Monitoria</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{activeCourse}</p>
                  </div>
                </div>
                <button onClick={() => setShowMobileSidebar(false)} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1.5 flex-grow overflow-y-auto">
                <button 
                  onClick={() => { setCurrentView('dashboard'); setShowMobileSidebar(false); setShowMobileCourses(false); }}
                  className={`w-full p-5 rounded-[1.5rem] flex items-center gap-4 font-black transition-all ${currentView === 'dashboard' ? `${theme.classes.bg} text-white shadow-lg` : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  <LayoutDashboard className="w-6 h-6" /> Início
                </button>
                
                <button 
                  onClick={() => setShowMobileCourses(!showMobileCourses)}
                  className={`w-full p-5 rounded-[1.5rem] flex items-center justify-between font-black transition-all ${showMobileCourses ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-4 text-left">
                    <BookOpen className="w-6 h-6" /> Trocar Curso
                  </div>
                  <ChevronDown className={`w-5 h-5 transition-transform ${showMobileCourses ? 'rotate-180 text-slate-400' : ''}`} />
                </button>

                <AnimatePresence>
                  {showMobileCourses && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-slate-50 rounded-3xl mb-2"
                    >
                      <div className="p-2 space-y-1">
                        {(['Matemática', 'Biologia', 'Língua Portuguesa'] as Course[]).map(c => (
                          <button 
                            key={c}
                            onClick={() => { handleCourseSwitch(c); setShowMobileSidebar(false); setShowMobileCourses(false); }}
                            className={`flex items-center gap-3 w-full p-4 rounded-2xl transition-all text-left ${activeCourse === c ? `${theme.classes.bg} text-white shadow-md` : 'hover:bg-slate-100 text-slate-600'}`}
                          >
                             <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeCourse === c ? 'bg-white/20' : 'bg-white text-slate-400 shadow-sm'}`}>
                               {React.createElement(COURSE_THEMES[c].icon, { className: "w-4 h-4" })}
                             </div>
                             <p className="font-bold text-sm">{c}</p>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button 
                  onClick={() => { setCurrentView('videos'); setShowMobileSidebar(false); setShowMobileCourses(false); }}
                  className={`w-full p-5 rounded-[1.5rem] flex items-center gap-4 font-black transition-all ${currentView === 'videos' ? `${theme.classes.bg} text-white shadow-lg` : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  <Youtube className="w-6 h-6" /> Videoaulas
                </button>
                {verificarSeEhMonitor(profile, activeCourse) && (
                  <button 
                    onClick={() => { setCurrentView('monitor'); setShowMobileSidebar(false); setShowMobileCourses(false); }}
                    className={`w-full p-5 rounded-[1.5rem] flex items-center gap-4 font-black transition-all ${currentView === 'monitor' ? `${theme.classes.bg} text-white shadow-lg` : 'text-indigo-600 bg-indigo-50 shadow-sm border border-indigo-100'}`}
                  >
                    <ShieldCheck className="w-6 h-6" /> Ver Monitoria
                  </button>
                )}
              </div>

              <div className="pt-6 border-t border-slate-100 space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl ${theme.classes.lightBg} flex items-center justify-center ${theme.classes.text} font-black text-xl`}>
                    {profile.name.charAt(0)}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-black text-slate-800 truncate">{profile.name}</p>
                    <p className="text-xs text-slate-400 font-medium truncate">{profile.email}</p>
                  </div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="w-full h-14 bg-rose-50 text-rose-600 rounded-2xl font-black flex items-center justify-center gap-3 transition-all active:scale-95"
                >
                  <LogOut className="w-5 h-5" /> Sair da Conta
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            {currentView === 'dashboard' && (
              <Dashboard 
                results={userResults} 
                onStart={(c, t) => { setQuizConfig({count:c, topics:t}); setCurrentView('quiz'); }} 
                questions={questions} 
                profile={profile!} 
                activeCourse={activeCourse} 
              />
            )}
            {currentView === 'quiz' && quizConfig && (
              <QuizView 
                config={quizConfig} 
                allQuestions={questions} 
                profile={profile}
                activeCourse={activeCourse}
                isSyncing={isFinishing}
                onFinish={async (res: QuizResult | null) => { 
                  if (res) {
                    setIsFinishing(true);
                    try {
                      // Save result to Firestore
                      const resId = Math.random().toString(36).substring(2, 11);
                      const resultData = { 
                        ...res, 
                        userEmail: profile.email,
                        userName: profile.name,
                        course: activeCourse
                      };
                      await setDoc(doc(db, 'results', resId), resultData);
                      
                      // Update user's specific progress AND statistics in real-time
                      const missedTopicsFromThisQuiz = res.missedQuestionIds.map(id => {
                        const q = questions.find(q => q.id === id);
                        return q ? q.topic : null;
                      }).filter(Boolean) as string[];

                      const courseKey = normalizeCourseKey(activeCourse);
                      const currentCourseProgress = profile.courses?.[courseKey];
                      const newMissedTopics = [...(currentCourseProgress?.missedTopics || []), ...missedTopicsFromThisQuiz];

                      const userRef = doc(db, 'users', profile.email);
                      await updateDoc(userRef, {
                        [`courses.${courseKey}.lastMissedQuestionIds`]: res.missedQuestionIds,
                        [`courses.${courseKey}.missedTopics`]: newMissedTopics,
                        [`courses.${courseKey}.totalSimulated`]: increment(1),
                        [`courses.${courseKey}.totalCorrect`]: increment(res.score),
                        [`courses.${courseKey}.totalQuestions`]: increment(res.total),
                        [`courses.${courseKey}.latestResult`]: {
                          score: res.score,
                          total: res.total,
                          date: res.date,
                          topicsCount: Object.keys(res.topicStats).length
                        }
                      });
                    } catch (e) {
                      console.error(e);
                      toast.error('Erro ao salvar resultado no banco.');
                    } finally {
                      setIsFinishing(false);
                    }
                  }
                  setCurrentView('dashboard');
                  window.scrollTo(0, 0);
                }} 
              />
            )}
            {currentView === 'monitor' && (
              <MonitorView 
                results={systemResults} 
                questions={questions} 
                videos={videos}
                allUsers={allUsers} 
                activeCourse={activeCourse}
                isAdmin={profile.email === 'brennomcpe10@gmail.com'}
                profile={profile}
              />
            )}
            {currentView === 'videos' && (
              <VideosView videos={videos} activeCourse={activeCourse} profile={profile} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
      
      {/* Cutscene Transition Overlay */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[100] flex items-center justify-center bg-white`}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.1, opacity: 0 }}
              className="flex flex-col items-center text-center"
            >
              <div className={`w-24 h-24 rounded-[2rem] ${targetTheme.classes.bg} flex items-center justify-center text-white shadow-2xl ${targetTheme.classes.shadow} mb-8`}>
                {React.createElement(targetTheme.icon, { className: "w-12 h-12" })}
              </div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight italic uppercase">{targetCourse}</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mt-2">Carregando Módulos...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toaster richColors position="top-center" />
    </div>
  );
}

// --- Views ---

function VideosView({ videos, activeCourse, profile }: { videos: VideoClass[], activeCourse: Course, profile: UserProfile | null }) {
  const theme = COURSE_THEMES[activeCourse];
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  const getYTId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleDeleteVideo = async (id: string) => {
    if (confirm('Deseja excluir esta videoaula permanentemente?')) {
      try {
        await deleteDoc(doc(db, 'videos', id));
        toast.success('Videoaula removida com sucesso!');
      } catch (e) {
        toast.error('Erro ao excluir videoaula.');
      }
    }
  };

  const isMonitor = verificarSeEhMonitor(profile, activeCourse);

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none italic uppercase">Videoaulas Gravadas</h2>
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest leading-none">{activeCourse} • Reforce seu aprendizado</p>
      </div>

      {playingVideoId && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-10"
        >
          <div className="relative w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl">
            <button 
              onClick={() => setPlayingVideoId(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <iframe 
              src={`https://www.youtube.com/embed/${playingVideoId}?autoplay=1`}
              title="YouTube video player"
              className="w-full h-full border-none"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </motion.div>
      )}

      {videos.length > 0 ? (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((v) => {
            const ytId = getYTId(v.youtubeUrl);
            const thumb = ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : null;
            return (
              <div key={v.id} className="relative group">
                <Card className={`group hover:shadow-2xl hover:${theme.classes.shadow} transition-all border-none`}>
                   <div className="relative aspect-video overflow-hidden">
                    {thumb ? (
                      <img src={thumb} alt={v.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                        <Youtube className="w-12 h-12" />
                      </div>
                    )}
                    <button 
                      onClick={() => ytId && setPlayingVideoId(ytId)}
                      className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm cursor-pointer"
                    >
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-rose-600 shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-300">
                        <Play className="w-8 h-8 fill-rose-600" />
                      </div>
                    </button>
                    <div className="absolute top-4 left-4">
                      <Badge color="rose">Aula</Badge>
                    </div>
                    {isMonitor && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteVideo(v.id); }}
                        className="absolute top-4 right-4 w-9 h-9 bg-rose-600 text-white rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-rose-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="p-6 space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(v.date).toLocaleDateString('pt-BR')}</p>
                    <h3 className="text-lg font-black text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">{v.title}</h3>
                    <button 
                      onClick={() => ytId && setPlayingVideoId(ytId)}
                      className="text-indigo-600 text-xs font-bold flex items-center gap-1 hover:underline"
                    >
                      Assistir Agora <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center space-y-4">
          <Youtube className="w-20 h-20 text-slate-100 mx-auto" />
          <p className="text-slate-300 font-bold italic text-lg">Nenhuma videoaula disponível no momento.</p>
        </div>
      )}
    </div>
  );
}

function Dashboard({ results, onStart, questions, profile, activeCourse }: { results: QuizResult[], onStart: (count: number, topics: string[]) => void, questions: Question[], profile: UserProfile, activeCourse: Course }) {
  const [selectedCount, setSelectedCount] = useState(10);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]); // Empty = Todos
  
  if (!profile) return null;

  const theme = COURSE_THEMES[activeCourse];
  const isMonitor = verificarSeEhMonitor(profile, activeCourse);
  const topics = Array.from(new Set(questions.map((q: any) => q.topic)));
  
  const courseKey = normalizeCourseKey(activeCourse);
  const courseProgress = profile.courses?.[courseKey];

  const latestResult = courseProgress?.latestResult || null;
  const totalQuizzes = courseProgress?.totalSimulated || 0;
  
  let acc = "0";
  if (courseProgress && courseProgress.totalQuestions > 0) {
    acc = ((courseProgress.totalCorrect / courseProgress.totalQuestions) * 100).toFixed(0);
  }

  const missedTopics = courseProgress?.missedTopics || [];

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-3">
        <div className={`relative overflow-hidden ${theme.classes.bg} rounded-[2.5rem] p-10 text-white shadow-2xl ${theme.classes.shadow} md:col-span-2`}>
          <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 blur-[100px] rounded-full translate-x-1/3 -translate-y-1/3"></div>
          <div className="relative z-10 flex flex-col h-full">
            <h2 className="text-4xl font-black mb-2 leading-none tracking-tight">Opa, {profile.name}! 👋</h2>
            <p className="opacity-80 font-medium mb-10">Mantenha o foco. O aprendizado é degrau por degrau.</p>
            <div className="mt-auto grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Simulados</p><p className="text-3xl font-black">{totalQuizzes}</p></div>
              <div><p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">{isMonitor ? 'Média Geral' : 'Precisão'}</p><p className="text-3xl font-black opacity-90">{acc}%</p></div>
            </div>
          </div>
        </div>

        <Card className="flex flex-col p-8">
          <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2"><Trophy className={`w-5 h-5 ${theme.classes.text}`} /> Último Desempenho</h3>
          {latestResult ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl border border-slate-100">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Acertos</p>
                  <p className="text-2xl font-black text-slate-800">{latestResult.score}/{latestResult.total}</p>
                </div>
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90">
                    <circle 
                      cx="32" cy="32" r="28" 
                      className="stroke-slate-100 fill-none" 
                      strokeWidth="6" 
                    />
                    <circle 
                      cx="32" cy="32" r="28" 
                      className={`${theme.classes.primary === 'indigo' ? 'stroke-indigo-600' : theme.classes.primary === 'emerald' ? 'stroke-emerald-600' : 'stroke-violet-600'} fill-none transition-all duration-1000`} 
                      strokeWidth="6" 
                      strokeDasharray={175.9} 
                      strokeDashoffset={175.9 - (175.9 * (latestResult.score / latestResult.total))}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className={`absolute font-black text-[10px] ${theme.classes.text}`}>
                    {((latestResult.score / latestResult.total) * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                <Target className="w-3.5 h-3.5" /> Focado em {latestResult.topicsCount} assunto(s)
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
              <BarChart3 className="w-16 h-16 text-slate-100 mb-4" />
              <p className="text-sm font-bold text-slate-300">Sem histórico ainda.</p>
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-6">
           <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2">Configurar Simulado</h3>
              <Badge color={theme.primary as any}>Beta v1.0</Badge>
           </div>
           
           <Card className="p-8 space-y-8">
              <div className="space-y-4">
                <label className="text-sm font-black uppercase tracking-widest text-slate-400">Questões</label>
                <div className="grid grid-cols-4 gap-3">
                  {[5, 10, 15, 20].map(c => (
                    <button key={c} onClick={() => setSelectedCount(c)} className={`h-12 rounded-2xl font-black transition-all ${selectedCount === c ? `${theme.classes.bg} text-white shadow-lg ${theme.classes.shadow} ring-2 ring-offset-2 ${theme.classes.primary === 'indigo' ? 'ring-indigo-600' : theme.classes.primary === 'emerald' ? 'ring-emerald-600' : 'ring-violet-600'}` : 'bg-slate-50 text-slate-500 hover:bg-slate-100 shadow-sm border border-slate-100'}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-black uppercase tracking-widest text-slate-400">Assunto</label>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => setSelectedTopics([])} 
                    className={`px-5 py-2 rounded-xl text-xs font-bold transition-all border ${selectedTopics.length === 0 ? `${theme.classes.bg} text-white border-none` : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'}`}
                  >
                    Todos
                  </button>
                  {topics.map((t:any) => (
                    <button 
                      key={t} 
                      onClick={() => {
                        setSelectedTopics(prev => {
                          if (prev.includes(t)) {
                            const filtered = prev.filter(item => item !== t);
                            return filtered;
                          } else {
                            return [...prev, t];
                          }
                        });
                      }} 
                      className={`px-5 py-2 rounded-xl text-xs font-bold transition-all border ${selectedTopics.includes(t) ? `${theme.classes.bg} text-white border-none` : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => onStart(selectedCount, selectedTopics)}
                className={`w-full h-16 ${theme.classes.bg} text-white rounded-[1.5rem] font-black text-xl shadow-xl ${theme.classes.shadow} ${theme.classes.darkHover} active:scale-[0.98] transition-all flex items-center justify-center gap-2`}
              >
                <Play className="w-6 h-6 fill-white" /> Iniciar Agora
              </button>
           </Card>
        </div>

        <div className="space-y-6">
           <h3 className="text-xl font-bold flex items-center gap-2">Pontos Fracos</h3>
           <Card className={`p-8 flex flex-col h-full bg-slate-900 text-white border-none shadow-lg ${theme.classes.shadow}`}>
              <p className="text-slate-400 text-sm mb-8">Assuntos que você precisa reforçar de acordo com seus erros.</p>
              {missedTopics.length > 0 ? (
                <div className="space-y-6 flex-1">
                   {Object.entries(missedTopics.reduce((acc: any, topic: string) => {
                      acc[topic] = (acc[topic] || 0) + 1;
                      return acc;
                    }, {})).sort((a: any, b: any) => b[1] - a[1]).slice(0, 3).map(([topic, count]: any) => (
                      <div key={topic} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${theme.classes.bg} group-hover:scale-150 transition-all`}></div>
                          <span className="font-bold text-slate-200">{topic}</span>
                        </div>
                        <span className={`text-xs font-black ${theme.classes.text}`}>{count} {count === 1 ? 'erro' : 'erros'}</span>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-600 font-bold border-2 border-dashed border-slate-800 rounded-3xl p-10 text-center">
                   Complete simulados para descobrir seus pontos fracos.
                </div>
              )}
           </Card>
        </div>
      </div>
    </div>
  );
}

function QuizView({ config, allQuestions, onFinish, profile, isSyncing, activeCourse }: any) {
  const theme = COURSE_THEMES[activeCourse as Course];
  const [questions, setQuestions] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [ans, setAns] = useState<(number | null)[]>([]);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [idx]);

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);
    
    setTimeout(() => {
      try {
        // Validação de Dados: Garante que apenas questões completas sejam carregadas
        const validated = allQuestions.filter((q: any) => {
          const text = q.text || q.pergunta;
          const options = q.options || q.opcoes;
          const correct = q.correctIndex !== undefined ? q.correctIndex : q.correta;
          return text && Array.isArray(options) && options.length === 4 && correct !== undefined;
        });

        // Filtro por assunto solicitado
        const filtered = config.topics && config.topics.length > 0 
          ? validated.filter((q: any) => config.topics.includes(q.topic) || config.topics.includes(q.assunto)) 
          : validated;

        // Verificação de Assunto: impede o início se não houver questões válidas
        if (filtered.length === 0) {
          toast.error(config.topics && config.topics.length > 0 
            ? `Ops! Não encontramos questões válidas para os assuntos selecionados.` 
            : 'Erro: O banco de questões parece estar vazio ou inválido.');
          onFinish(null); // Retorna ao dashboard
          return;
        }

        // Embaralhamento e preparação final
        const final = [...filtered].sort(() => Math.random() - 0.5).slice(0, config.count);
        setQuestions(final);
        setAns(new Array(final.length).fill(null));
        setLoading(false);
      } catch (err) {
        console.error("Erro crítico ao carregar simulado:", err);
        toast.error('Erro ao carregar questões. Verifique o banco de dados.');
        onFinish(null);
      }
    }, 800);
  }, []);

  if (loading) return <div className="flex flex-col items-center justify-center py-40 animate-pulse"><Loader2 className={`w-12 h-12 animate-spin ${theme.classes.text} mb-4`} /><p className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Embaralhando questões...</p></div>;

  if (finished) {
    const score = ans.reduce((acc: number, v, i) => {
      if (questions[i] && v === questions[i].correctIndex) return acc + 1;
      return acc;
    }, 0);

    const result: QuizResult = {
      id: Math.random().toString(36).substring(2, 11),
      date: new Date().toISOString(),
      course: activeCourse,
      total: questions.length,
      score,
      answers: questions.map((q, i) => ({ questionId: q.id, selectedIndex: ans[i] as number })),
      topicStats: questions.reduce((acc, q, i) => {
        if (!acc[q.topic]) acc[q.topic] = { total: 0, errors: 0 };
        acc[q.topic].total += 1;
        if (ans[i] !== q.correctIndex) acc[q.topic].errors += 1;
        return acc;
      }, {} as any),
      missedQuestionIds: questions.filter((_, i) => ans[i] !== questions[i].correctIndex).map(q => q.id)
    };

    return (
      <div className="max-w-3xl mx-auto space-y-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="rounded-[2.5rem] bg-white shadow-2xl overflow-hidden text-center border border-slate-100">
           <div className={`p-16 text-white relative ${theme.classes.bg}`}>
              <CheckCircle2 className="mx-auto w-16 h-16 mb-6 scale-110" />
              <h2 className="text-4xl font-black mb-2 italic">TAMO JUNTO!</h2>
              <p className="opacity-70 font-bold uppercase tracking-widest text-[10px]">Simulado concluído com sucesso</p>
           </div>
           <div className="p-12 relative -mt-10 bg-white rounded-[2rem] mx-8 shadow-xl grid md:grid-cols-2 lg:grid-cols-3 gap-10 items-center">
              <div className="lg:col-span-1 border-r border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pontuação</p>
                <div className={`text-6xl font-black ${theme.classes.text}`}>{score}/{questions.length}</div>
                <Badge color={theme.primary as any}>{questions.length > 0 ? ((score / questions.length) * 100).toFixed(0) : 0}% Acertos</Badge>
              </div>
              <div className="text-left md:col-span-1 lg:col-span-2 space-y-4">
                 <h4 className="font-bold text-slate-500 uppercase text-xs tracking-widest flex items-center gap-2"><Target className="w-4 h-4" /> Desempenho</h4>
                 <div className="space-y-3">
                   {Object.entries(result.topicStats).map(([t, s]: any) => (
                      <div key={t} className="space-y-1">
                        <div className="flex justify-between text-xs font-black">
                          <span className="text-slate-700">{t}</span>
                          <span className="text-slate-400">{(s.total - s.errors)}/{s.total}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${theme.classes.bg}`} style={{ width: `${s.total > 0 ? ((s.total - s.errors) / s.total) * 100 : 0}%` }}></div>
                        </div>
                      </div>
                   ))}
                 </div>
              </div>
           </div>
           <div className="p-10">
             <button 
               disabled={isSyncing}
               onClick={(e) => { e.preventDefault(); onFinish(result); }} 
               className={`h-16 w-full lg:w-fit lg:px-20 ${theme.classes.bg} text-white rounded-2xl font-black text-lg shadow-xl ${theme.classes.shadow} ${theme.classes.darkHover} active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70`}
             >
               {isSyncing ? <><Loader2 className="w-5 h-5 animate-spin" /> Salvando...</> : 'Voltar para o Início'}
             </button>
           </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-2xl font-black text-slate-800 ml-4 italic">CORREÇÃO MONITORADA</h3>
          {questions.map((q, i) => (
            <div key={q.id}>
              <Card className={`p-8 border-l-[10px] ${ans[i] === q.correctIndex ? 'border-l-emerald-500' : 'border-l-rose-500'}`}>
              <div className="flex items-center justify-between mb-6">
                <Badge color={theme.primary as any}>{q.topic}</Badge>
                {ans[i] === q.correctIndex 
                  ? <span className="flex items-center gap-1 text-emerald-600 font-bold text-sm"><CheckCircle2 className="w-4 h-4" /> Correto</span>
                  : <span className="flex items-center gap-1 text-rose-600 font-bold text-sm"><XCircle className="w-4 h-4" /> Errou feio</span>
                }
              </div>
              {(q.imageUrl || (q as any).imagemUrl || (q as any).imagem) && (
                <div className="mb-[15px] rounded-[8px] overflow-hidden border border-slate-100 shadow-sm flex justify-center bg-slate-50 max-w-full">
                  <img 
                    src={q.imageUrl || (q as any).imagemUrl || (q as any).imagem} 
                    alt="Contexto da questão" 
                    className="max-w-full h-auto rounded-[8px]" 
                    onError={(e) => (e.currentTarget.parentElement!.style.display = 'none')}
                  />
                </div>
              )}
              <p className="text-xl font-bold text-slate-800 leading-relaxed mb-8">{q.text}</p>
              <div className="grid gap-2 mb-8">
                {q.options.map((o, oi) => (
                  <div key={oi} className={`p-4 rounded-2xl border text-sm font-bold flex items-center justify-between ${oi === q.correctIndex ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : oi === ans[i] ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                    {o} {oi === q.correctIndex && <CheckCircle2 className="w-4 h-4 text-emerald-600" />} {oi === ans[i] && oi !== q.correctIndex && <XCircle className="w-4 h-4 text-rose-600" />}
                  </div>
                ))}
              </div>
              <div className={`${theme.classes.lightBg} p-6 rounded-3xl border border-dashed border-opacity-20 italic ${theme.classes.text}`}>
                 <div className="flex items-center gap-2 font-black opacity-80 mb-2 uppercase text-[10px] tracking-widest"><Lightbulb className="w-4 h-4" /> Comentário do Monitor</div>
                 <p className="text-sm leading-relaxed">{q.explanation}</p>
              </div>
            </Card>
          </div>
        ))}
        </div>
      </div>
    );
  }

  const q = questions[idx];
  const courseKey = normalizeCourseKey(activeCourse);
  const isPreviouslyMissed = profile.courses?.[courseKey]?.lastMissedQuestionIds?.includes(q.id);

  return (
    <div className="max-w-4xl mx-auto">
       <div className="mb-10 space-y-4">
         <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black">{idx + 1}</div>
             <p className="font-black text-slate-400 uppercase text-xs tracking-widest">de {questions.length} Questões</p>
           </div>
           <div className="flex items-center gap-4 text-slate-400 font-bold text-xs uppercase tracking-widest">
             <div className="flex items-center gap-2"><Timer className="w-4 h-4" /> 00:00</div>
             <button onClick={() => { if(confirm('Deseja mesmo sair?')) onFinish(null); }} className="hover:text-rose-500">Sair</button>
           </div>
         </div>
         <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${((idx + 1)/questions.length)*100}%` }} className="h-full bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.5)]"></motion.div>
         </div>
       </div>

       <Card className="p-10 md:p-14 relative overflow-hidden">
         <div className="mb-8 flex flex-wrap gap-2">
           <Badge color="indigo">{q.topic}</Badge>
           {isPreviouslyMissed && (
             <span className="flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full text-[10px] font-black uppercase animate-bounce">
               <AlertTriangle className="w-3.5 h-3.5" /> Você errou essa na última!
             </span>
           )}
         </div>
         {(q.imageUrl || (q as any).imagemUrl || (q as any).imagem) && !imageError && (
           <div className="mb-[15px] rounded-[8px] overflow-hidden border border-slate-100 shadow-sm flex justify-center bg-slate-50">
             <img 
               src={q.imageUrl || (q as any).imagemUrl || (q as any).imagem} 
               alt="Contexto da questão" 
               className="max-w-full h-auto rounded-[8px]" 
               onError={() => setImageError(true)}
             />
           </div>
         )}
         <h2 className="text-2xl md:text-3xl font-bold text-slate-800 leading-tight mb-12">{q.text}</h2>
         
         <div className="grid gap-3">
           {q.options.map((o, i) => (
             <button 
                key={i} 
                onClick={() => setAns(p => { const n=[...p]; n[idx]=i; return n; })}
                className={`group flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${ans[idx] === i ? 'border-indigo-600 bg-indigo-50 shadow-md ring-4 ring-indigo-600/5' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}
             >
               <div className={`w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center font-black transition-all ${ans[idx] === i ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                 {String.fromCharCode(65 + i)}
               </div>
               <span className={`font-bold transition-all ${ans[idx] === i ? 'text-indigo-800' : 'text-slate-700'}`}>{o}</span>
             </button>
           ))}
         </div>

         <div className="flex items-center justify-between mt-12 pt-10 border-t border-slate-100">
           <button 
             onClick={() => setIdx(p => Math.max(0, p - 1))}
             disabled={idx === 0}
             className="flex items-center gap-2 font-bold text-slate-400 hover:text-slate-600 disabled:opacity-0 transition-all uppercase text-xs tracking-widest"
           >
             <ArrowLeft className="w-4 h-4" /> Anterior
           </button>
           
           {idx === questions.length - 1 ? (
             <button 
               onClick={(e) => { e.preventDefault(); if(ans[idx] !== null) { setFinished(true); window.scrollTo(0,0); } }}
               disabled={ans[idx] === null}
               className="h-14 px-12 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-50 transition-all"
             >
               Finalizar Simulado
             </button>
           ) : (
             <button 
               onClick={() => { if(ans[idx] !== null) setIdx(p => p + 1); }}
               disabled={ans[idx] === null}
               className="h-14 px-12 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2"
             >
               Próxima Questão <ArrowRight className="w-5 h-5" />
             </button>
           )}
         </div>
       </Card>
    </div>
  );
}

function MonitorView({ results, questions, videos, allUsers, activeCourse, isAdmin, profile }: { results: QuizResult[], questions: Question[], videos: VideoClass[], allUsers: UserSummary[], activeCourse: Course, isAdmin: boolean, profile: UserProfile }) {
  const theme = COURSE_THEMES[activeCourse];
  const [activeTab, setActiveTab] = useState<'stats' | 'list' | 'add' | 'users'>('stats');
  const [newQ, setNewQ] = useState({ text: '', topic: '', options: ['', '', '', ''], correctIndex: 0, explanation: '', imageUrl: '' });
  const [newVideo, setNewVideo] = useState({ title: '', youtubeUrl: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [bulkJson, setBulkJson] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [studentDetailedProfile, setStudentDetailedProfile] = useState<any>(null);
  const [showMissedByStudents, setShowMissedByStudents] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleteCode, setBulkDeleteCode] = useState('');
  const [userToApprove, setUserToApprove] = useState<any>(null);

  const handleCourseApproval = async (course: Course) => {
    if (!userToApprove) return;
    try {
      const userRef = doc(db, 'users', userToApprove.email);
      // Construct the update object for permissions
      const currentPermissions = userToApprove.permissions || {};
      
      await updateDoc(userRef, { 
        approved: true, 
        role: 'monitor',
        [`permissions.${normalizeCourseKey(course)}`]: 'monitor'
      });
      
      toast.success(`${userToApprove.name} agora é monitor de ${course}!`);
      setUserToApprove(null);
    } catch (e: any) {
      console.error(e);
      alert('Erro ao aprovar monitor: ' + e.message);
    }
  };

  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});

  const toggleTopic = (topic: string) => {
    setExpandedTopics(prev => ({ ...prev, [topic]: !prev[topic] }));
  };

  const handleApprove = async (email: string, role: Role) => {
    if (role === 'monitor' && !isAdmin) {
      return toast.error('Apenas o administrador pode aprovar novos monitores.');
    }
    try {
      await setDoc(doc(db, 'users', email), { approved: true, role }, { merge: true });
      toast.success(`Usuário aprovado como ${role}!`);
    } catch (e) {
      toast.error('Erro na aprovação.');
    }
  };

  const handleSeedQuestions = async () => {
    if (confirm('Deseja popular o banco de dados com as 8 questões iniciais padrão?')) {
      try {
        const promises = INITIAL_QUESTIONS.map(q => setDoc(doc(db, 'questions', q.id), q));
        await Promise.all(promises);
        toast.success('Banco de dados populado!');
      } catch (e) {
        toast.error('Erro ao popular banco.');
      }
    }
  };

  const handleDecline = async (email: string) => {
    if (confirm('Você tem certeza que deseja excluir esta conta?')) {
      try {
        await deleteDoc(doc(db, 'users', email));
        toast.info('Solicitação removida.');
      } catch (e) {
        toast.error('Erro ao remover.');
      }
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (confirm('Excluir esta questão permanentemente?')) {
      try {
        await deleteDoc(doc(db, 'questions', id));
        toast.success('Questão removida.');
      } catch (e) {
        toast.error('Erro ao excluir questão.');
      }
    }
  };

  const handleToggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllTopic = (topic: string, qs: any[]) => {
    const topicIds = qs.map(q => q.id);
    const allSelected = topicIds.every(id => selectedIds.has(id));
    
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        topicIds.forEach(id => next.delete(id));
      } else {
        topicIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const handleBulkDeleteData = async () => {
    if (bulkDeleteCode !== '67') {
      return toast.error('Código de confirmação incorreto!');
    }
    
    try {
      const batch = writeBatch(db);
      selectedIds.forEach(id => {
        batch.delete(doc(db, 'questions', id));
      });
      await batch.commit();
      
      toast.success(`${selectedIds.size} questões excluídas com sucesso!`);
      setSelectedIds(new Set());
      setShowBulkDeleteModal(false);
      setBulkDeleteCode('');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao excluir questões em massa.');
    }
  };

  const questionHeatmap = questions.map((q: any) => {
    const timesAnswered = results.filter((r: any) => r.answers?.some((a: any) => a.questionId === q.id)).length;
    const errors = results.filter((r: any) => r.missedQuestionIds?.includes(q.id)).length;
    return {
      ...q,
      timesAnswered,
      errorRate: timesAnswered > 0 ? (errors / timesAnswered) * 100 : 0
    };
  });

  // 2. Fetch selected student details from Firebase (Real-time)
  useEffect(() => {
    if (!selectedStudent) {
      setStudentDetailedProfile(null);
      return;
    }

    const user = allUsers.find((u: any) => u.email === selectedStudent);
    const q = query(
      collection(db, 'results'), 
      where('userEmail', '==', selectedStudent),
      orderBy('date', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const userResults = snap.docs
        .map(d => d.data() as QuizResult);
      
      // Group errors by course to avoid confusion
      const missedWithAnswers = userResults.flatMap((r: QuizResult) => {
        return (r.missedQuestionIds || []).map(mqId => {
          const q = questions.find((q: any) => q.id === mqId);
          const ansInfo = r.answers?.find(a => a.questionId === mqId);
          return q ? { 
            ...q, 
            marked: q.options[ansInfo?.selectedIndex || 0],
            date: r.date,
            quizCourse: r.course || 'Matemática' 
          } : null;
        }).filter(Boolean);
      });

      setStudentDetailedProfile({ user, results: userResults, missedWithAnswers });
    }, (error) => {
      console.error('Error syncing student details:', error);
    });

    return () => unsub();
  }, [selectedStudent, allUsers, questions, activeCourse]);

  // 3. User Statistics Map (Filtered by activeCourse via results prop)
  const userStatsMap = results.reduce((acc: any, r: QuizResult) => {
    if (!acc[r.userEmail]) {
      acc[r.userEmail] = { count: 0, totalQuestions: 0, totalCorrect: 0 };
    }
    acc[r.userEmail].count += 1;
    acc[r.userEmail].totalQuestions += r.total;
    acc[r.userEmail].totalCorrect += r.score;
    return acc;
  }, {});

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!newQ.text || !newQ.topic || newQ.options.some(o => !o) || !newQ.explanation) return toast.error('Complete todos os campos!');
    
    try {
      const id = editingId || Math.random().toString(36).substring(2, 11);
      await setDoc(doc(db, 'questions', id), { ...newQ, id, course: activeCourse });
      toast.success(editingId ? 'Questão atualizada!' : 'Questão cadastrada no banco!');
      setNewQ({ text: '', topic: '', options: ['', '', '', ''], correctIndex: 0, explanation: '', imageUrl: '' });
      setEditingId(null);
      setActiveTab('list');
    } catch (e) {
      toast.error('Erro ao salvar questão.');
    }
  };

  const handleEditQuestion = (q: Question) => {
    setNewQ({
      text: q.text,
      topic: q.topic,
      options: [...q.options],
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      imageUrl: q.imageUrl || ''
    });
    setEditingId(q.id);
    setActiveTab('add');
  };

  const handleBulkImport = async () => {
    if (!bulkJson.trim()) return toast.error('Cole o JSON das questões primeiro!');
    
    try {
      const data = JSON.parse(bulkJson);
      if (!Array.isArray(data)) throw new Error('O formato deve ser um array de questões.');
      
      setIsImporting(true);
      let count = 0;
      
      for (const q of data) {
        // Map user provided keys to internal question record fields
        const id = q.id || Math.random().toString(36).substring(2, 11);
        const questionData = {
          id,
          text: q.text || q.pergunta || q.enunciado || '',
          topic: q.topic || q.assunto || 'Sem Categoria',
          options: q.options || q.opcoes || q.alternativas || ['', '', '', ''],
          correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : (typeof q.correta === 'number' ? q.correta : (typeof q.resposta === 'number' ? q.resposta : 0)),
          explanation: q.explanation || q.explicacao || q.correcao || '',
          imageUrl: q.imageUrl || '',
          course: activeCourse
        };
        
        await setDoc(doc(db, 'questions', id), questionData);
        count++;
      }
      
      toast.success(`Sucesso! ${count} questões foram importadas.`);
      setBulkJson('');
    } catch (e: any) {
      console.error(e);
      toast.error('Erro no formato do JSON: ' + e.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleAddVideo = async (e: FormEvent) => {
    e.preventDefault();
    if (!newVideo.title || !newVideo.youtubeUrl) return toast.error('Preencha os campos da videoaula!');
    
    // Extract YouTube ID
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = newVideo.youtubeUrl.match(regExp);
    const ytId = (match && match[2].length === 11) ? match[2] : null;

    if (!ytId) {
      return toast.error('URL do YouTube inválida! Use o link completo ou o ID de 11 caracteres.');
    }

    try {
      const id = Math.random().toString(36).substring(2, 11);
      // We save the extracted ID as the youtubeUrl or stick to full URL but ensure we only use ID for playing
      await setDoc(doc(db, 'videos', id), { 
        ...newVideo, 
        youtubeUrl: `https://www.youtube.com/watch?v=${ytId}`, // Normalize
        id, 
        date: new Date().toISOString(), 
        course: activeCourse 
      });
      toast.success('Videoaula cadastrada!');
      setNewVideo({ title: '', youtubeUrl: '' });
    } catch (e) {
      toast.error('Erro ao salvar videoaula.');
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (confirm('Excluir esta videoaula?')) {
      try {
        await deleteDoc(doc(db, 'videos', id));
        toast.success('Videoaula removida.');
      } catch (e) {
        toast.error('Erro ao remover videoaula.');
      }
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h2 className={`text-4xl font-black text-slate-900 tracking-tight leading-none mb-2 underline ${theme.classes.decoration} decoration-8 underline-offset-4`}>Painel do Monitor</h2>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest leading-none">Análise de Performance • {activeCourse}</p>
        </div>
        <div className="bg-slate-200/50 p-1.5 rounded-2xl flex flex-wrap gap-1 w-fit">
           {verificarSeEhMonitor(profile, activeCourse) && (['stats', 'list', 'add', 'users'] as const).map(t => (
             <button key={t} onClick={() => setActiveTab(t as any)} className={`px-4 py-3.5 rounded-xl text-[10px] sm:text-xs font-black transition-all uppercase tracking-widest ${activeTab === t ? `bg-white ${theme.classes.text} shadow-sm` : 'text-slate-500 hover:text-slate-900'}`}>
               {t === 'stats' ? 'Dashboard' : t === 'list' ? 'Banco Dados' : t === 'add' ? 'Cadastrar' : 'Usuários'}
             </button>
           ))}
           {!verificarSeEhMonitor(profile, activeCourse) && (
             <p className="px-4 py-2.5 text-[10px] font-black text-rose-500 uppercase tracking-widest leading-none">Acesso restrito para monitores deste curso</p>
           )}
        </div>
      </div>

      {activeTab === 'users' && (
        <div className="space-y-6">
           <div className="flex items-center justify-between">
             <h3 className="text-xl font-bold flex items-center gap-2">Gestão de Usuários</h3>
             <Badge color="amber">Pendentes: {allUsers.filter((u:any) => !u.approved).length}</Badge>
           </div>
           
           <Card className="border-none shadow-2xl p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <th className="px-8 py-6">Nome</th>
                      <th className="px-8 py-6">E-mail</th>
                      <th className="px-8 py-6">Simulados</th>
                      <th className="px-8 py-6">Status</th>
                      <th className="px-8 py-6 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allUsers.map((u: any) => (
                      <tr key={u.email} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs">
                              {u.name.charAt(0)}
                            </div>
                            <span className="font-bold text-slate-700">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-sm text-slate-400 font-medium">{u.email}</td>
                        <td className="px-8 py-6">
                           <div className="flex flex-col">
                             <span className="text-sm font-black text-slate-700">{userStatsMap[u.email]?.count || 0}</span>
                             {userStatsMap[u.email]?.totalQuestions ? (
                               <span className={`text-[10px] font-bold ${theme.classes.text}`}>
                                 {((userStatsMap[u.email]?.totalCorrect || 0) / userStatsMap[u.email]?.totalQuestions * 100).toFixed(0)}% de acerto
                               </span>
                             ) : (
                               <span className="text-[10px] font-bold text-slate-300 italic">Sem dados</span>
                             )}
                           </div>
                        </td>
                        <td className="px-8 py-6">
                          {u.approved ? (
                            <Badge color={u.role === 'monitor' ? theme.primary as any : 'emerald'}>
                              {u.role === 'estudante' ? 'Estudante' : u.role}
                            </Badge>
                          ) : (
                            <span className="flex items-center gap-1.5 text-amber-500 text-[10px] font-black uppercase tracking-widest">
                              <Loader2 className="w-3 h-3 animate-spin" /> Pendente
                            </span>
                          )}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {u.approved && (
                              <>
                                <button 
                                  onClick={() => setSelectedStudent(u.email)}
                                  className={`h-8 px-3 rounded-lg text-[10px] font-black uppercase transition-all ${theme.classes.lightBg} ${theme.classes.text} hover:opacity-80`}
                                >
                                  Ver Detalhes
                                </button>
                                {u.email !== 'brennomcpe10@gmail.com' && (
                                  <button 
                                    onClick={() => handleDecline(u.email)}
                                    className="h-8 w-8 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center hover:text-rose-500 hover:bg-rose-50 transition-all border border-slate-100"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </>
                            )}
                            {!u.approved && (
                              <>
                                <button 
                                  onClick={() => handleApprove(u.email, 'estudante')}
                                  className="h-8 px-3 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase hover:bg-emerald-100"
                                >
                                  Aprovar Estudante
                                </button>
                                 {isAdmin && (
                                  <button 
                                    onClick={() => setUserToApprove(u)}
                                    className={`h-8 px-3 rounded-lg text-[10px] font-black uppercase transition-all ${theme.classes.lightBg} ${theme.classes.text} hover:opacity-80`}
                                  >
                                    Aprovar Monitor
                                  </button>
                                )}
                                <button 
                                  onClick={() => handleDecline(u.email)}
                                  className="h-8 w-8 bg-rose-50 text-rose-500 rounded-lg flex items-center justify-center hover:bg-rose-100"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </Card>
        </div>
      )}

      {selectedStudent && studentDetailedProfile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-indigo-600 text-white">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center font-black">{studentDetailedProfile.user.name.charAt(0)}</div>
                 <div>
                   <h3 className="text-xl font-black">{studentDetailedProfile.user.name}</h3>
                   <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest">{studentDetailedProfile.user.email}</p>
                 </div>
               </div>
               <div className="flex items-center gap-3">
                 {studentDetailedProfile.user.email !== 'brennomcpe10@gmail.com' && (
                   <button 
                     onClick={() => {
                       if (confirm('Deseja realmente EXCLUIR permanentemente este usuário?')) {
                         handleDecline(studentDetailedProfile.user.email);
                         setSelectedStudent(null);
                       }
                     }}
                     className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-100 flex items-center justify-center hover:bg-rose-500 transition-all"
                     title="Excluir Usuário"
                   >
                     <Trash2 className="w-5 h-5" />
                   </button>
                 )}
                 <button onClick={() => setSelectedStudent(null)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"><XCircle className="w-6 h-6" /></button>
               </div>
            </div>
            <div className="p-8 overflow-y-auto flex-1 space-y-8">
              <div className="grid grid-cols-3 gap-6">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Simulados</p>
                  <p className="text-2xl font-black text-slate-800">{studentDetailedProfile.results.length}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Média Geral</p>
                  <p className="text-2xl font-black text-indigo-600">
                    {studentDetailedProfile.results.length > 0 
                      ? (studentDetailedProfile.results.reduce((a:any, b:any) => a + b.score, 0) / studentDetailedProfile.results.reduce((a:any, b:any) => a + b.total, 0) * 100).toFixed(0) 
                      : 0}%
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Erros Totais</p>
                  <p className="text-2xl font-black text-rose-500">{studentDetailedProfile.missedWithAnswers.length}</p>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                  <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center gap-2 mb-4">
                    <TrendingUp className={`w-4 h-4 text-indigo-600`} /> Desempenho por Disciplina
                  </h4>
                  <div className="space-y-6">
                    {Object.entries((studentDetailedProfile.results || []).reduce((acc: any, r: any) => {
                      const courseName = r.course || 'Matemática';
                      if (!acc[courseName]) acc[courseName] = [];
                      acc[courseName].push(r);
                      return acc;
                    }, {})).map(([courseName, courseResults]: any) => {
                      const cTheme = COURSE_THEMES[courseName as Course] || theme;
                      return (
                        <div key={courseName} className="space-y-3">
                          <div className="flex items-center gap-2 px-2">
                             <cTheme.icon className={`w-4 h-4 ${cTheme.classes.text}`} />
                             <span className="text-xs font-black uppercase tracking-widest text-slate-500">{courseName}</span>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {courseResults.slice(0, 4).map((r: any) => (
                              <div key={r.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                <div className="flex flex-col">
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                                    {new Date(r.date).toLocaleDateString('pt-BR')} • {new Date(r.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  <span className="text-sm font-bold text-slate-700">Simulado de {courseName}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                   <div className="text-right">
                                      <span className={`text-lg font-black ${cTheme.classes.text}`}>{r.score}/{r.total}</span>
                                   </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    {(!studentDetailedProfile.results || studentDetailedProfile.results.length === 0) && (
                      <p className="text-center py-4 text-slate-400 italic text-sm">Nenhum simulado realizado ainda.</p>
                    )}
                  </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center gap-2">
                  <History className="w-4 h-4 text-rose-500" /> Histórico de Erros por Assunto
                </h4>
                {studentDetailedProfile.missedWithAnswers.length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(studentDetailedProfile.missedWithAnswers.reduce((acc: any, m: any) => {
                      const key = `${m.quizCourse} • ${m.topic}`;
                      if (!acc[key]) acc[key] = [];
                      acc[key].push(m);
                      return acc;
                    }, {})).map(([topicLabel, ms]: any) => {
                      const topicKey = `student_err_${topicLabel}`;
                      const isExpanded = expandedTopics[topicKey];
                      const [courseName] = topicLabel.split(' • ');
                      const cTheme = COURSE_THEMES[courseName as Course] || theme;

                      return (
                        <div key={topicLabel} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                          <button 
                            onClick={() => toggleTopic(topicKey)}
                            className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-all text-left"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 ${cTheme.classes.lightBg} rounded-xl flex items-center justify-center ${cTheme.classes.text}`}>
                                {React.createElement(cTheme.icon, { className: "w-4 h-4" })}
                              </div>
                              <div>
                                <p className="text-sm font-black text-slate-800 tracking-tight">{topicLabel}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{ms.length} {ms.length === 1 ? 'erro registrado' : 'erros registrados'}</p>
                              </div>
                            </div>
                            <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                              <ArrowRight className="w-4 h-4 text-slate-300 rotate-90" />
                            </div>
                          </button>
                          
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-t border-slate-50 overflow-hidden"
                              >
                                <div className="p-4 bg-slate-50/50 space-y-4">
                                  {ms.map((m: any, i: number) => (
                                    <div key={i} className="p-5 rounded-2xl border border-white bg-white shadow-sm flex flex-col gap-3">
                                      <div className="flex items-center justify-between">
                                        <Badge color="rose">Erro em {new Date(m.date).toLocaleDateString('pt-BR')}</Badge>
                                      </div>
                                      {(m.imageUrl || m.imagemUrl || m.imagem) && (
                                        <div className="mt-2 mb-[15px] rounded-[8px] overflow-hidden border border-slate-100 shadow-sm flex justify-center bg-slate-50">
                                          <img 
                                            src={m.imageUrl || m.imagemUrl || m.imagem} 
                                            alt="Contexto" 
                                            className="max-w-full h-auto rounded-[8px]"
                                            onError={(e) => (e.currentTarget.parentElement!.style.display = 'none')}
                                          />
                                        </div>
                                      )}
                                      <p className="text-sm font-bold text-slate-700 leading-relaxed">{m.text}</p>
                                      <div className="flex flex-col sm:flex-row gap-2">
                                        <div className="flex-1 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-tight flex items-center gap-2">
                                          <XCircle className="w-3.5 h-3.5" /> Marcou: {m.marked}
                                        </div>
                                        <div className="flex-1 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-tight flex items-center gap-2">
                                          <CheckCircle2 className="w-3.5 h-3.5" /> Correto: {m.options[m.correctIndex]}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center py-10 text-slate-300 font-bold italic">Nenhum erro registrado.</p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="space-y-8 animate-in fade-in duration-300">
           {showMissedByStudents && (
             <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl space-y-6">
                   <div className="flex items-center justify-between">
                      <h4 className="text-xl font-black text-slate-800">Quem errou esta questão?</h4>
                      <button onClick={(e) => { e.stopPropagation(); setShowMissedByStudents(null); }} className="text-slate-400 hover:text-slate-600"><XCircle className="w-6 h-6" /></button>
                   </div>
                   <div className="space-y-3 max-h-60 overflow-y-auto">
                      {(() => {
                        const studentsWhoMissed = results
                          .filter((r: any) => r.missedQuestionIds?.includes(showMissedByStudents))
                          .map((r: any) => ({ name: r.userName || 'Anônimo', email: r.userEmail }));
                        
                        // Deduplicate by email
                        const uniqueStudents = Array.from(new Map(studentsWhoMissed.map(item => [item.email, item])).values()) as { name: string, email: string }[];

                        if (uniqueStudents.length === 0) return <p className="text-center py-4 text-slate-400 italic">Ninguém errou esta questão ainda.</p>;

                        return uniqueStudents.map((s, i) => (
                          <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xs">{s.name ? s.name.charAt(0) : '?'}</div>
                             <div>
                               <p className="text-sm font-bold text-slate-700">{s.name}</p>
                               <p className="text-[10px] text-slate-400 font-medium">{s.email}</p>
                             </div>
                          </div>
                        ));
                      })()}
                   </div>
                </motion.div>
             </div>
           )}

           <div className="grid gap-6 md:grid-cols-3">
             <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl flex flex-col items-center justify-center text-center">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Simulados Totais</p>
               <p className="text-4xl font-black text-indigo-600">{results.length}</p>
             </div>
             <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl flex flex-col items-center justify-center text-center">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Banco Questões</p>
               <p className="text-4xl font-black text-emerald-500">{questions.length}</p>
             </div>
             <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl flex flex-col items-center justify-center text-center">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Aproveitamento Global</p>
               <p className="text-4xl font-black text-amber-500">
                 {results.length > 0 ? (results.reduce((a:any,b:any)=>a+b.score,0)/results.reduce((a:any,b:any)=>a+b.total,0)*100).toFixed(0):0}%
               </p>
             </div>
           </div>

           {results.length > 0 && (
             <Card className="p-8 flex flex-col bg-indigo-50 border-indigo-100">
               <h3 className="text-lg font-black text-indigo-800 mb-6 flex items-center gap-2"><Trophy className="w-5 h-5" /> Último Simulado da Turma</h3>
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black">{results[0].userName?.charAt(0) || '?'}</div>
                   <div>
                     <p className="text-sm font-black text-slate-800">{results[0].userName || 'Anônimo'}</p>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Finalizou em {new Date(results[0].date).toLocaleString('pt-BR')}</p>
                   </div>
                 </div>
                 <div className="text-right">
                   <p className="text-2xl font-black text-indigo-600">{results[0].score}/{results[0].total}</p>
                   <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{((results[0].score / results[0].total) * 100).toFixed(0)}% de acerto</p>
                 </div>
               </div>
             </Card>
           )}

           <Card className="p-8 overflow-hidden bg-white">
              <h3 className="text-xl font-bold mb-8 flex items-center gap-2 font-black italic tracking-tight"><TrendingUp className="w-5 h-5 text-indigo-600" /> Mapa de Calor por Assunto</h3>
              
              <div className="space-y-4">
                {Object.entries(questionHeatmap.reduce((acc: any, q: any) => {
                  if (!acc[q.topic]) acc[q.topic] = [];
                  acc[q.topic].push(q);
                  return acc;
                }, {})).map(([topic, qs]: any) => {
                  const isExpanded = expandedTopics[topic];
                  const topicErrors = qs.reduce((a:any, b:any) => a + (b.timesAnswered > 0 ? (b.errorRate/100 * b.timesAnswered) : 0), 0);
                  const topicTotal = qs.reduce((a:any, b:any) => a + b.timesAnswered, 0);
                  const topicRate = topicTotal > 0 ? (topicErrors / topicTotal * 100) : 0;

                  return (
                    <div key={topic} className="border border-slate-100 rounded-3xl overflow-hidden bg-slate-50/30">
                      <button 
                        onClick={() => toggleTopic(topic)}
                        className="w-full px-6 py-5 flex items-center justify-between hover:bg-slate-50 transition-all"
                      >
                        <div className="flex items-center gap-4">
                           <div className={`w-3 h-3 rounded-full ${topicRate >= 50 ? 'bg-rose-500' : topicRate > 20 ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                           <h4 className="font-black text-slate-800 text-sm tracking-tight">{topic}</h4>
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{qs.length} questões</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Taxa de Erro</p>
                            <p className={`text-lg font-black leading-none ${topicRate >= 50 ? 'text-rose-600' : 'text-slate-700'}`}>{topicRate.toFixed(0)}%</p>
                          </div>
                          <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                             <ArrowRight className="w-4 h-4 text-indigo-400 rotate-90" />
                          </div>
                        </div>
                      </button>
                      
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-white border-t border-slate-100 overflow-hidden"
                          >
                            <div className="overflow-x-auto">
                              <table className="w-full text-left">
                                <tbody className="divide-y divide-slate-50">
                                  {qs.sort((a:any, b:any) => b.errorRate - a.errorRate).map((q: any) => (
                                    <tr key={q.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setShowMissedByStudents(q.id)}>
                                      <td className="px-6 py-4 text-xs font-bold text-slate-600 max-w-xs md:max-w-md truncate">{q.text}</td>
                                      <td className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-tighter">{q.timesAnswered} resp.</td>
                                      <td className="px-6 py-4 text-right">
                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black ${q.errorRate >= 50 ? 'bg-rose-500 text-white' : q.errorRate > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'}`}>
                                          {q.errorRate.toFixed(0)}%
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </Card>
        </div>
      )}

      {activeTab === 'list' && (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-200">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-4">
               <h3 className="text-xl font-bold flex items-center gap-2 font-black italic tracking-tighter"><ClipboardList className="w-5 h-5 text-indigo-600" /> Banco de Questões</h3>
               {selectedIds.size > 0 && (
                 <Badge color="indigo">{selectedIds.size} selecionadas</Badge>
               )}
             </div>
             <Badge color="indigo">Total: {questions.length}</Badge>
          </div>
          
          {selectedIds.size > 0 && (
             <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-5 duration-300">
               <div className="bg-slate-900 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-6 border border-slate-800">
                 <p className="text-sm font-black italic"><span className="text-indigo-400">{selectedIds.size}</span> questões selecionadas</p>
                 <div className="w-px h-6 bg-slate-800"></div>
                 <div className="flex items-center gap-3">
                   <button 
                    onClick={() => setShowBulkDeleteModal(true)}
                    className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2"
                   >
                     <Trash2 className="w-4 h-4" /> Excluir Selecionados
                   </button>
                   <button 
                    onClick={() => setSelectedIds(new Set())}
                    className="text-slate-400 hover:text-white text-xs font-bold transition-colors px-2"
                   >
                     Desmarcar
                   </button>
                 </div>
               </div>
             </div>
           )}
          
          {questions.length > 0 ? (
            <div className="space-y-3">
               {Object.entries(questions.reduce((acc: any, q: any) => {
                 if (!acc[q.topic]) acc[q.topic] = [];
                 acc[q.topic].push(q);
                 return acc;
               }, {})).map(([topic, qs]: any) => {
                 const isExpanded = expandedTopics[`list_${topic}`];
                 return (
                   <div key={topic} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                     <button 
                       onClick={() => toggleTopic(`list_${topic}`)}
                       className="w-full px-8 py-5 flex items-center justify-between hover:bg-slate-50 transition-all text-left"
                     >
                       <div className="flex items-center gap-4 flex-1">
                         <button 
                           onClick={(e) => { e.stopPropagation(); handleSelectAllTopic(topic, qs); }}
                           className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all border ${qs.every((q:any) => selectedIds.has(q.id)) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-300 hover:border-indigo-300'}`}
                           title="Selecionar Tudo deste Assunto"
                         >
                           <Target className="w-4 h-4" />
                         </button>
                         <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                           <Target className="w-5 h-5" />
                         </div>
                         <div>
                           <h4 className="font-black text-slate-800 tracking-tight">{topic}</h4>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{qs.length} questões cadastradas</p>
                         </div>
                       </div>
                       <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                         <ArrowRight className="w-5 h-5 text-slate-300 rotate-90" />
                       </div>
                     </button>
                     
                     <AnimatePresence>
                       {isExpanded && (
                         <motion.div
                           initial={{ height: 0, opacity: 0 }}
                           animate={{ height: 'auto', opacity: 1 }}
                           exit={{ height: 0, opacity: 0 }}
                           className="border-t border-slate-50 overflow-hidden"
                         >
                           <div className="overflow-x-auto">
                             <table className="w-full text-left">
                               <tbody className="divide-y divide-slate-50">
                                 {qs.map((q: any) => (
                                   <tr key={q.id} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-50">
                                     <td className="pl-8 pr-2 py-4 w-10">
                                       <button 
                                         onClick={() => handleToggleSelection(q.id)}
                                         className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedIds.has(q.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 hover:border-indigo-300'}`}
                                       >
                                         {selectedIds.has(q.id) && <CheckCircle2 className="w-4 h-4" />}
                                       </button>
                                     </td>
                                     <td className="px-4 py-4">
                                       <p className="text-sm font-bold text-slate-700 mb-1">{q.text}</p>
                                       {q.explanation && (
                                         <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest flex items-center gap-1 italic">
                                           <Lightbulb className="w-3 h-3" /> Dica: {q.explanation.substring(0, 80)}{q.explanation.length > 80 ? '...' : ''}
                                         </p>
                                       )}
                                     </td>
                                     <td className="px-8 py-4 text-right align-top">
                                       <div className="flex items-center justify-end gap-2">
                                         <button 
                                           onClick={() => handleEditQuestion(q)}
                                           className="w-9 h-9 rounded-xl flex items-center justify-center text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-all border border-indigo-100"
                                           title="Editar"
                                         >
                                           <PlusSquare className="w-4 h-4" />
                                         </button>
                                         <button 
                                           onClick={() => handleDeleteQuestion(q.id)}
                                           className="w-9 h-9 rounded-xl flex items-center justify-center text-rose-600 bg-rose-50 hover:bg-rose-100 transition-all border border-rose-100"
                                           title="Excluir"
                                         >
                                           <Trash2 className="w-4 h-4" />
                                         </button>
                                       </div>
                                     </td>
                                   </tr>
                                 ))}
                               </tbody>
                             </table>
                           </div>
                         </motion.div>
                       )}
                     </AnimatePresence>
                   </div>
                 );
               })}
            </div>
          ) : (
            <Card className="p-20 text-center space-y-6">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
                <ClipboardList className="w-10 h-10" />
              </div>
              <div className="max-w-xs mx-auto">
                <h4 className="text-xl font-black text-slate-800 mb-2">Banco Vazio</h4>
                <p className="text-slate-400 font-medium text-sm mb-6">Nenhuma questão encontrada no sistema. Adicione manualmente ou carregue os padrões.</p>
                <button 
                  onClick={handleSeedQuestions}
                  className="h-12 px-8 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-lg shadow-indigo-600/20 hover:scale-105 transition-all"
                >
                  Popular Banco Padrão
                </button>
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'add' && (
        <div className="max-w-3xl mx-auto space-y-12 animate-in zoom-in-95 duration-200">
          <Card className="p-10 md:p-14">
             <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-2">
               <PlusSquare className="w-6 h-6 text-indigo-600" /> {editingId ? 'Editar Questão' : 'Cadastrar Questão'}
             </h3>
             <form onSubmit={handleAdd} className="space-y-8">
               <div className="grid md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Assunto da Aula</label>
                   <input className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 transition-all font-bold placeholder:text-slate-300" placeholder="Ex: Geometria Analítica" value={newQ.topic} onChange={e => setNewQ({...newQ, topic: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">URL da Imagem (Opcional)</label>
                   <input className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 transition-all font-bold placeholder:text-slate-300" placeholder="Link direto da imagem..." value={newQ.imageUrl} onChange={e => setNewQ({...newQ, imageUrl: e.target.value})} />
                 </div>
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Enunciado Completo</label>
                 <textarea rows={3} className="w-full p-6 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 transition-all font-bold placeholder:text-slate-300 text-sm" placeholder="O que o aluno deve calcular?" value={newQ.text} onChange={e => setNewQ({...newQ, text: e.target.value})} />
               </div>
               
               <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Alternativas</label>
                 {newQ.options.map((opt, i) => (
                   <div key={i} className="flex gap-4 items-center group">
                      <div className={`w-12 h-12 flex-shrink-0 rounded-2xl flex items-center justify-center font-black ${newQ.correctIndex === i ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                        {String.fromCharCode(65 + i)}
                      </div>
                      <input className="flex-1 h-12 px-5 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none text-sm font-bold" value={opt} onChange={e => { const o=[...newQ.options]; o[i]=e.target.value; setNewQ({...newQ, options:o}); }} placeholder={`Opção ${String.fromCharCode(65 + i)}`} />
                      <input type="radio" name="correct" checked={newQ.correctIndex === i} onChange={() => setNewQ({...newQ, correctIndex: i})} className="w-6 h-6 accent-indigo-600" />
                   </div>
                 ))}
                 <p className="text-[10px] font-bold text-slate-300 italic">Preencha o círculo radioativo na resposta correta</p>
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Correção Comentada (Dica do Monitor)</label>
                 <textarea rows={3} className="w-full p-6 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 transition-all font-bold placeholder:text-slate-300 text-sm italic" placeholder="Explique como resolver este problema..." value={newQ.explanation} onChange={e => setNewQ({...newQ, explanation: e.target.value})} />
               </div>

               <button type="submit" className="w-full h-16 bg-indigo-600 text-white rounded-2xl font-black text-xl shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all mt-6">
                 {editingId ? 'Salvar Alterações' : 'Salvar Questão no Banco'}
               </button>
             </form>
          </Card>

          {/* Bulk Import Tool */}
          <Card className="p-10 bg-slate-50 border-dashed border-2 border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <ClipboardList className="w-6 h-6 text-indigo-600" />
              <h3 className="text-xl font-black text-slate-800">Importação em Massa</h3>
            </div>
            <p className="text-sm text-slate-500 mb-6 font-medium">
              Cole abaixo uma lista de questões em formato JSON para cadastrá-las instantaneamente.
            </p>
            <textarea
              rows={6}
              className="w-full p-6 rounded-2xl bg-white border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 transition-all font-mono text-xs mb-6"
              placeholder='[ { "pergunta": "Pergunta?", "assunto": "Assunto", "opcoes": ["A", "B", "C", "D"], "correta": 0, "explicacao": "Explicação" }, ... ]'
              value={bulkJson}
              onChange={(e) => setBulkJson(e.target.value)}
            />
            <button
              onClick={handleBulkImport}
              disabled={isImporting}
              className="h-16 w-full bg-slate-800 text-white rounded-2xl font-black text-sm shadow-xl hover:bg-slate-900 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isImporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlusCircle className="w-5 h-5" />}
              Importar Lista de Questões
            </button>
          </Card>

          {/* Cadastrar Videoaula Form */}
          <Card className="p-10 bg-rose-50/30 border-dashed border-2 border-rose-200">
             <div className="flex items-center gap-3 mb-6">
                <Youtube className="w-6 h-6 text-rose-600" />
                <h3 className="text-xl font-black text-slate-800">Cadastrar Videoaula</h3>
             </div>
             
             <form onSubmit={handleAddVideo} className="grid md:grid-cols-2 gap-4">
               <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Título da Aula</label>
                 <input 
                   className="w-full h-12 px-5 rounded-2xl bg-white border border-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all font-medium" 
                   value={newVideo.title} onChange={e => setNewVideo({...newVideo, title: e.target.value})} placeholder="Ex: Introdução à Trigonometria" 
                 />
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Link do YouTube</label>
                 <div className="flex gap-2">
                    <input 
                      className="flex-1 h-12 px-5 rounded-2xl bg-white border border-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all font-medium" 
                      value={newVideo.youtubeUrl} onChange={e => setNewVideo({...newVideo, youtubeUrl: e.target.value})} placeholder="https://youtube.com/watch?v=..." 
                    />
                    <button type="submit" className="px-8 h-12 bg-rose-600 text-white rounded-2xl font-black shadow-lg shadow-rose-600/20 hover:bg-rose-700 transition-all text-xs uppercase tracking-widest">Salvar Aula</button>
                 </div>
               </div>
             </form>

             {videos.length > 0 && (
               <div className="mt-8 grid gap-2">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-2">Aulas Atuais</p>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {videos.map((v: any) => (
                      <div key={v.id} className="p-4 bg-white rounded-2xl border border-slate-100 flex items-center justify-between group">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center text-rose-600 flex-shrink-0">
                            <Youtube className="w-4 h-4" />
                          </div>
                          <p className="font-bold text-slate-700 text-xs truncate">{v.title}</p>
                        </div>
                        <button onClick={() => handleDeleteVideo(v.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
               </div>
             )}
          </Card>
        </div>
      )}

      <AnimatePresence>
        {showBulkDeleteModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl space-y-8"
            >
              <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-2">
                <AlertTriangle className="w-10 h-10" />
              </div>
              
              <div className="text-center space-y-2">
                <h4 className="text-2xl font-black text-slate-800">Ação Irreversível</h4>
                <p className="text-slate-500 font-medium text-sm">Você está prestes a excluir <span className="text-rose-600 font-black">{selectedIds.size}</span> questões selecionadas. Esta ação é irreversível.</p>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Digite o código de segurança para confirmar</p>
                <input 
                  type="text" 
                  className="w-full h-16 text-center text-4xl font-black tracking-[0.5em] rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-rose-600/10 transition-all text-slate-800"
                  value={bulkDeleteCode}
                  onChange={e => setBulkDeleteCode(e.target.value)}
                  maxLength={2}
                />
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => { setShowBulkDeleteModal(false); setBulkDeleteCode(''); }}
                  className="flex-1 h-16 rounded-2xl font-black text-slate-400 hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  disabled={bulkDeleteCode !== '67'}
                  onClick={handleBulkDeleteData}
                  className="flex-1 h-16 bg-rose-600 text-white rounded-2xl font-black shadow-xl shadow-rose-600/20 hover:bg-rose-700 disabled:opacity-30 disabled:grayscale transition-all"
                >
                  Confirmar Exclusão
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Aprovação de Monitor por Curso */}
      <AnimatePresence>
        {userToApprove && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                 <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2">Aprovar Monitor</h3>
              <p className="text-slate-500 text-sm font-medium mb-8">
                Escolha o curso para o qual <strong>{userToApprove.name}</strong> terá permissão de monitoria:
              </p>
              
              <div className="space-y-3">
                {(['Matemática', 'Biologia', 'Português'] as Course[]).map(c => (
                  <button
                    key={c}
                    onClick={() => handleCourseApproval(c)}
                    className="w-full py-4 px-6 bg-slate-50 hover:bg-indigo-600 hover:text-white rounded-2xl font-black text-sm transition-all border border-slate-100 flex items-center justify-between group"
                  >
                    <span>{c}</span>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
                  </button>
                ))}
              </div>
              
              <button 
                onClick={() => setUserToApprove(null)}
                className="mt-6 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
              >
                Cancelar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
