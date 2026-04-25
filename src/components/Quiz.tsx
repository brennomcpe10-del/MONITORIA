import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { 
  TrendingUp, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Lightbulb,
  Loader2,
  RefreshCcw
} from 'lucide-react';
import { dbService } from '../services/db';
import { Question, UserProfile, QuizResult } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface QuizProps {
  config: { count: number; topic?: string };
  profile: UserProfile;
  onComplete: () => void;
}

export default function Quiz({ config, profile, onComplete }: QuizProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [startTime] = useState(new Date());

  useEffect(() => {
    const fetchQuestions = async () => {
      const all = await dbService.getQuestionsByTopic(config.topic);
      // Shuffle and slice
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
    
    // Calculate stats
    const correctCount = selectedAnswers.reduce((acc, ans, idx) => {
      return ans === questions[idx].correctIndex ? acc + 1 : acc;
    }, 0);

    const topicStats: QuizResult['topicStats'] = {};
    const missedIds: string[] = [];

    questions.forEach((q, idx) => {
      if (!topicStats[q.topic]) {
        topicStats[q.topic] = { total: 0, errors: 0 };
      }
      topicStats[q.topic].total += 1;
      if (selectedAnswers[idx] !== q.correctIndex) {
        topicStats[q.topic].errors += 1;
        missedIds.push(q.id);
      }
    });

    // Save result
    await dbService.saveQuizResult({
      userId: profile.uid,
      total: questions.length,
      score: correctCount,
      topicStats,
      missedQuestionIds: missedIds
    });

    // Update user's last missed
    await dbService.updateUserLastMissed(profile.uid, missedIds);
    
    toast.success('Simulado finalizado com sucesso!');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 font-medium text-slate-500">Preparando suas questões...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <Card className="text-center">
        <CardContent className="py-12">
          <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
          <h3 className="mt-4 text-xl font-bold">Nenhuma questão encontrada</h3>
          <p className="text-slate-500">Tente selecionar outro assunto ou fale com o monitor.</p>
          <Button className="mt-6" onClick={onComplete}>Voltar para o Início</Button>
        </CardContent>
      </Card>
    );
  }

  if (isFinished) {
    const finalScore = selectedAnswers.reduce((acc, ans, idx) => {
      return ans === questions[idx].correctIndex ? acc + 1 : acc;
    }, 0);
    const percentage = (finalScore / questions.length) * 100;

    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
        className="mx-auto max-w-4xl space-y-8"
      >
        <Card className="border-none shadow-2xl">
          <CardHeader className="bg-primary text-white text-center pb-12 pt-16 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent"></div>
             <CheckCircle2 className="mx-auto h-16 w-16 mb-4" />
             <CardTitle className="text-3xl font-bold">Resultado Final</CardTitle>
             <p className="text-white/80 font-medium">Você concluiu o simulado!</p>
          </CardHeader>
          <CardContent className="relative -mt-8 mx-6 bg-white rounded-2xl shadow-xl p-8">
            <div className="grid md:grid-cols-3 gap-8 items-center">
              <div className="text-center space-y-2">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest text-balance">Sua Pontuação</p>
                <p className="text-5xl font-black text-primary">{finalScore}/{questions.length}</p>
                <Badge variant="secondary" className="px-3 py-1 text-sm">{percentage.toFixed(0)}% de Acerto</Badge>
              </div>
              <div className="md:col-span-2 space-y-4">
                <h4 className="font-bold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                  Desempenho por Assunto
                </h4>
                <div className="space-y-3">
                  {Object.entries(questions.reduce((acc, q, idx) => {
                    const isCorrect = selectedAnswers[idx] === q.correctIndex;
                    if (!acc[q.topic]) acc[q.topic] = { total: 0, correct: 0 };
                    acc[q.topic].total += 1;
                    if (isCorrect) acc[q.topic].correct += 1;
                    return acc;
                  }, {} as Record<string, { total: number, correct: number }>)).map(([topic, stats]) => (
                    <div key={topic} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-600">{topic}</span>
                        <span className="text-slate-400">{(stats as any).correct}/{(stats as any).total}</span>
                      </div>
                      <Progress value={((stats as any).correct / (stats as any).total) * 100} className="h-2" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-4 justify-center bg-slate-50 border-t p-6 pb-8">
            <Button size="lg" className="sm:flex-1 h-12 font-bold" onClick={onComplete}>
               Voltar para o Painel
            </Button>
          </CardFooter>
        </Card>

        <h3 className="text-2xl font-bold mt-12 mb-6">Correção Detalhada</h3>
        <div className="space-y-6">
          {questions.map((q, idx) => (
            <Card key={q.id} className={`border-l-4 ${selectedAnswers[idx] === q.correctIndex ? 'border-l-emerald-500' : 'border-l-rose-500'}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline">{q.topic}</Badge>
                  {selectedAnswers[idx] === q.correctIndex ? (
                    <div className="flex items-center gap-1 text-emerald-600 font-bold text-sm">
                      <CheckCircle2 className="h-4 w-4" /> Correto
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-rose-600 font-bold text-sm">
                      <XCircle className="h-4 w-4" /> Incorreto
                    </div>
                  )}
                </div>
                <CardTitle className="text-lg leading-relaxed">{q.text}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  {q.options.map((option, optIdx) => (
                    <div 
                      key={optIdx} 
                      className={`p-3 rounded-xl border flex items-center justify-between ${
                        optIdx === q.correctIndex ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-medium' : 
                        optIdx === selectedAnswers[idx] ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-slate-50 border-slate-100 opacity-60'
                      }`}
                    >
                      <span className="text-sm">{option}</span>
                      {optIdx === q.correctIndex && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                      {optIdx === selectedAnswers[idx] && optIdx !== q.correctIndex && <XCircle className="h-4 w-4 text-rose-600" />}
                    </div>
                  ))}
                </div>
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mt-4">
                   <div className="flex items-center gap-2 text-blue-700 font-bold mb-2">
                     <Lightbulb className="h-4 w-4" /> Explicação do Monitor
                   </div>
                   <p className="text-sm text-blue-900/80 leading-relaxed italic">
                     {q.explanation}
                   </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="px-3 py-1 h-8">Questão {currentIndex + 1} de {questions.length}</Badge>
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
               <p className="text-[10px] font-bold text-slate-400 uppercase">Tempo DecoRido</p>
               <p className="text-xs font-mono font-bold text-slate-600">00:00</p>
             </div>
             <Button variant="ghost" size="sm" onClick={onComplete} className="text-slate-400">Desistir</Button>
          </div>
        </div>
        <Progress value={((currentIndex + 1) / questions.length) * 100} className="h-2" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
           key={currentIndex}
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           exit={{ opacity: 0, x: -20 }}
           transition={{ duration: 0.2 }}
        >
          <Card className="border-none shadow-xl shadow-slate-200/50">
            <CardHeader className="pb-4">
              <div className="flex flex-wrap gap-2 mb-4">
                 <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">{currentQuestion.topic}</Badge>
                 {isPreviouslyMissed && (
                   <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1 animate-bounce">
                     <AlertTriangle className="h-3 w-3" /> Você errou essa questão na última tentativa
                   </Badge>
                 )}
              </div>
              <CardTitle className="text-xl md:text-2xl leading-relaxed text-slate-800">
                {currentQuestion.text}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentQuestion.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all group flex items-center gap-4 ${
                    selectedAnswers[currentIndex] === idx 
                      ? 'border-primary bg-primary/5 shadow-md ring-1 ring-primary/20' 
                      : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold transition-colors ${
                    selectedAnswers[currentIndex] === idx 
                      ? 'bg-primary text-white' 
                      : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span className={`flex-1 font-medium ${
                    selectedAnswers[currentIndex] === idx ? 'text-primary' : 'text-slate-700'
                  }`}>
                    {option}
                  </span>
                </button>
              ))}
            </CardContent>
            <CardFooter className="flex items-center justify-between border-t p-6 mt-4">
              <Button 
                variant="ghost" 
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" /> Anterior
              </Button>

              {currentIndex === questions.length - 1 ? (
                <Button 
                  onClick={finishQuiz} 
                  disabled={selectedAnswers[currentIndex] === null}
                  className="gap-2 px-8 h-12 rounded-full font-bold shadow-lg shadow-primary/20"
                >
                  Finalizar Simulado <CheckCircle2 className="h-5 w-5" />
                </Button>
              ) : (
                <Button 
                  onClick={() => setCurrentIndex(currentIndex + 1)} 
                  disabled={selectedAnswers[currentIndex] === null}
                  className="gap-2 px-8 h-12 rounded-full font-bold shadow-lg shadow-primary/20"
                >
                  Próxima <ArrowRight className="h-5 w-5" />
                </Button>
              )}
            </CardFooter>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
