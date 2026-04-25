import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Calculator, 
  Play, 
  History, 
  TrendingUp, 
  AlertCircle,
  BarChart3,
  BookOpen
} from 'lucide-react';
import { dbService } from '../services/db';
import { QuizResult, UserProfile } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardProps {
  onStartQuiz: (count: number, topic?: string) => void;
  profile: UserProfile;
}

export default function Dashboard({ onStartQuiz, profile }: DashboardProps) {
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

  return (
    <div className="space-y-8">
      {/* Welcome & Quick Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 border-none bg-gradient-to-br from-primary to-indigo-700 text-white shadow-xl shadow-primary/20 overflow-hidden relative">
          <div className="absolute right-0 top-0 h-64 w-64 translate-x-1/4 -translate-y-1/4 rounded-full bg-white/10 blur-3xl"></div>
          <CardHeader className="relative z-10">
            <CardTitle className="text-2xl md:text-3xl font-bold">Olá, {profile.name}! 👋</CardTitle>
            <CardDescription className="text-white/80 font-medium">Pronto para a monitoria de hoje?</CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex flex-wrap gap-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-white/60">Simulados Feitos</p>
                <p className="text-3xl font-bold">{results.length}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-white/60">Precisão Geral</p>
                <div className="flex items-end gap-1">
                  <p className="text-3xl font-bold">{accuracy.toFixed(0)}%</p>
                  <TrendingUp className="mb-1 h-5 w-5 text-emerald-400" />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="relative z-10">
            <Button 
              variant="secondary" 
              className="font-bold sm:w-auto w-full h-12"
              onClick={() => onStartQuiz(selectedCount, selectedTopic)}
            >
              <Play className="mr-2 h-5 w-5 fill-current" />
              Começar Novo Simulado
            </Button>
          </CardFooter>
        </Card>

        <Card className="flex flex-col border-none shadow-xl shadow-slate-200/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="h-5 w-5 text-primary" />
              Último Desempenho
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            {latestResult ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Acertos</p>
                    <p className="text-xl font-bold">{latestResult.score}/{latestResult.total}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary flex items-center justify-center font-bold text-xs">
                    {((latestResult.score / latestResult.total) * 100).toFixed(0)}%
                  </div>
                </div>
                <p className="text-xs text-slate-400">
                  Realizado em {format(latestResult.date.toDate(), "dd 'de' MMMM", { locale: ptBR })}
                </p>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
                <BarChart3 className="mb-2 h-12 w-12 opacity-20" />
                <p className="text-sm font-medium">Nenhum simulado ainda.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quiz Config */}
      <div className="grid gap-8 md:grid-cols-2">
        <Card className="border-none shadow-xl shadow-slate-200/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calculator className="h-5 w-5 text-primary" />
              Configurar Simulado
            </CardTitle>
            <CardDescription>Escolha a quantidade de questões e o assunto.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700">Quantidade de Questões</label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 20].map((count) => (
                  <Button
                    key={count}
                    variant={selectedCount === count ? 'default' : 'outline'}
                    onClick={() => setSelectedCount(count)}
                    className="font-bold"
                  >
                    {count}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700">Assunto (Opcional)</label>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={selectedTopic === undefined ? 'default' : 'outline'}
                  onClick={() => setSelectedTopic(undefined)}
                  className="rounded-full text-xs"
                >
                  Todos
                </Button>
                {topics.map((topic) => (
                  <Button
                    key={topic}
                    size="sm"
                    variant={selectedTopic === topic ? 'default' : 'outline'}
                    onClick={() => setSelectedTopic(topic)}
                    className="rounded-full text-xs"
                  >
                    {topic}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Areas of focus */}
        <Card className="border-none shadow-xl shadow-slate-200/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Pontos de Atenção
            </CardTitle>
            <CardDescription>Assuntos com maior índice de erro.</CardDescription>
          </CardHeader>
          <CardContent>
            {results.length > 0 ? (
              <div className="space-y-4">
                {Object.entries(
                  results.reduce((acc, curr) => {
                    Object.entries(curr.topicStats).forEach(([topic, stats]) => {
                      if (!acc[topic]) acc[topic] = { total: 0, errors: 0 };
                      acc[topic].total += stats.total;
                      acc[topic].errors += stats.errors;
                    });
                    return acc;
                  }, {} as Record<string, { total: number; errors: number }>)
                )
                  .sort((a, b) => (b[1] as any).errors / (b[1] as any).total - (a[1] as any).errors / (a[1] as any).total)
                  .slice(0, 3)
                  .map(([topic, stats]) => (
                    <div key={topic} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">{topic}</Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-500">{(((stats as any).errors / (stats as any).total) * 100).toFixed(0)}% de Erro</p>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
                <p className="text-sm font-medium">Continue praticando para ver suas estatísticas.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
