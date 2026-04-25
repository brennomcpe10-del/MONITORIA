import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { 
  PlusCircle, 
  BarChart3, 
  BookOpen, 
  Users, 
  Trash2, 
  AlertCircle,
  Plus,
  X,
  PlusSquare,
  ClipboardList
} from 'lucide-react';
import { dbService } from '../services/db';
import { Question, QuizResult } from '../types';
import { toast } from 'sonner';

export default function MonitorPanel() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New Question Form
  const [newQuestion, setNewQuestion] = useState({
    text: '',
    topic: '',
    options: ['', '', '', ''],
    correctIndex: 0,
    explanation: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const allQs = await dbService.getAllQuestions();
    const allResults = await dbService.getAllResults();
    setQuestions(allQs);
    setResults(allResults);
    setLoading(false);
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.text || !newQuestion.topic || newQuestion.options.some(o => !o) || !newQuestion.explanation) {
      toast.error('Preencha todos os campos corretamente.');
      return;
    }

    await dbService.addQuestion({
      ...newQuestion,
      createdBy: 'monitor', // Simplified for demo
    });
    
    toast.success('Questão cadastrada com sucesso!');
    setNewQuestion({
      text: '',
      topic: '',
      options: ['', '', '', ''],
      correctIndex: 0,
      explanation: ''
    });
    fetchData();
  };

  // Stats Calculations
  const totalQuizzes = results.length;
  const topicStats = results.reduce((acc, curr) => {
    Object.entries(curr.topicStats).forEach(([topic, stats]) => {
      if (!acc[topic]) acc[topic] = { total: 0, errors: 0 };
      acc[topic].total += stats.total;
      acc[topic].errors += stats.errors;
    });
    return acc;
  }, {} as Record<string, { total: number, errors: number }>);

  const mostMissedQuestions = questions.map(q => {
    const misses = results.reduce((acc, r) => {
      return acc + (r.missedQuestionIds.includes(q.id) ? 1 : 0);
    }, 0);
    return { ...q, misses };
  }).sort((a, b) => b.misses - a.misses).slice(0, 10);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Painel do Monitor</h2>
          <p className="text-slate-500">Gerencie questões e acompanhe o desempenho da turma.</p>
        </div>
      </div>

      <Tabs defaultValue="stats" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3 bg-slate-100 p-1">
          <TabsTrigger value="stats" className="gap-2">
             <BarChart3 className="h-4 w-4" /> Estatísticas
          </TabsTrigger>
          <TabsTrigger value="questions" className="gap-2">
             <ClipboardList className="h-4 w-4" /> Questões
          </TabsTrigger>
          <TabsTrigger value="add" className="gap-2">
             <PlusSquare className="h-4 w-4" /> Adicionar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="mt-8 space-y-8">
          <div className="grid gap-6 md:grid-cols-3">
             <Card>
               <CardHeader className="pb-2">
                 <CardDescription>Total de Simulados</CardDescription>
                 <CardTitle className="text-3xl font-bold">{totalQuizzes}</CardTitle>
               </CardHeader>
             </Card>
             <Card>
               <CardHeader className="pb-2">
                 <CardDescription>Questões no Banco</CardDescription>
                 <CardTitle className="text-3xl font-bold">{questions.length}</CardTitle>
               </CardHeader>
             </Card>
             <Card>
               <CardHeader className="pb-2">
                 <CardDescription>Média de Acertos</CardDescription>
                 <CardTitle className="text-3xl font-bold">
                   {totalQuizzes > 0 ? (results.reduce((a, b) => a + b.score, 0) / results.reduce((a, b) => a + b.total, 0) * 100).toFixed(1) : 0}%
                 </CardTitle>
               </CardHeader>
             </Card>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <Card className="border-none shadow-xl shadow-slate-200/50">
              <CardHeader>
                <CardTitle>Erros por Assunto</CardTitle>
                <CardDescription>Assuntos mais desafiadores para a turma.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Assunto</TableHead>
                      <TableHead className="text-right">Taxa de Erro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(topicStats)
                      .sort((a, b) => ((b[1] as any).errors / (b[1] as any).total) - ((a[1] as any).errors / (a[1] as any).total))
                      .map(([topic, stats]) => (
                        <TableRow key={topic}>
                          <TableCell className="font-medium">{topic}</TableCell>
                          <TableCell className="text-right">
                             <Badge variant={(stats as any).errors / (stats as any).total > 0.4 ? 'destructive' : 'secondary'}>
                               {(((stats as any).errors / (stats as any).total) * 100).toFixed(0)}%
                             </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl shadow-slate-200/50">
              <CardHeader>
                <CardTitle>Questões Críticas</CardTitle>
                <CardDescription>Questões com maior número de erros.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Enunciado</TableHead>
                      <TableHead className="text-right">Erros</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mostMissedQuestions.map(q => (
                      <TableRow key={q.id}>
                        <TableCell className="max-w-[200px] truncate">{q.text}</TableCell>
                        <TableCell className="text-right font-bold text-rose-600">{q.misses}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="questions" className="mt-8">
          <Card className="border-none shadow-xl shadow-slate-200/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Banco de Questões</CardTitle>
                <CardDescription>Lista detelhada de todas as questões cadastradas.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assunto</TableHead>
                    <TableHead>Enunciado</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {questions.map(q => (
                    <TableRow key={q.id}>
                      <TableCell><Badge variant="outline">{q.topic}</Badge></TableCell>
                      <TableCell className="max-w-md truncate font-medium">{q.text}</TableCell>
                      <TableCell className="text-right">
                         <Button variant="ghost" size="icon" className="text-slate-400 hover:text-rose-600">
                           <Trash2 className="h-4 w-4" />
                         </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add" className="mt-8">
           <Card className="max-w-3xl mx-auto border-none shadow-xl shadow-slate-200/50">
             <CardHeader>
               <CardTitle>Cadastrar Nova Questão</CardTitle>
               <CardDescription>Adicione uma nova questão ao banco de dados.</CardDescription>
             </CardHeader>
             <CardContent>
               <form onSubmit={handleAddQuestion} className="space-y-6">
                 <div className="space-y-2">
                   <Label htmlFor="topic">Assunto (ex: Geometria Analítica)</Label>
                   <Input 
                     id="topic" 
                     placeholder="Digite o assunto..." 
                     value={newQuestion.topic}
                     onChange={e => setNewQuestion({...newQuestion, topic: e.target.value})}
                   />
                 </div>

                 <div className="space-y-2">
                   <Label htmlFor="text">Enunciado da Questão</Label>
                   <textarea 
                     id="text" 
                     rows={3} 
                     className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                     placeholder="Digite a pergunta..." 
                     value={newQuestion.text}
                     onChange={e => setNewQuestion({...newQuestion, text: e.target.value})}
                   />
                 </div>

                 <div className="space-y-4">
                   <Label>Opções de Resposta</Label>
                   {newQuestion.options.map((opt, idx) => (
                     <div key={idx} className="flex items-center gap-3">
                       <div className={`h-8 w-8 rounded flex items-center justify-center font-bold text-sm ${newQuestion.correctIndex === idx ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
                         {String.fromCharCode(65 + idx)}
                       </div>
                       <Input 
                         value={opt} 
                         onChange={e => {
                           const opts = [...newQuestion.options];
                           opts[idx] = e.target.value;
                           setNewQuestion({...newQuestion, options: opts});
                         }}
                         placeholder={`Opção ${String.fromCharCode(65 + idx)}`}
                       />
                       <input 
                         type="radio" 
                         name="correct" 
                         checked={newQuestion.correctIndex === idx}
                         onChange={() => setNewQuestion({...newQuestion, correctIndex: idx})}
                         className="h-4 w-4 accent-primary"
                       />
                     </div>
                   ))}
                   <p className="text-[10px] uppercase font-bold text-slate-400">Selecione o rádio para marcar a resposta correta</p>
                 </div>

                 <div className="space-y-2">
                   <Label htmlFor="explanation">Resolução Comentada</Label>
                   <textarea 
                     id="explanation" 
                     rows={3} 
                     className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                     placeholder="Explique como chegar na resposta correta..." 
                     value={newQuestion.explanation}
                     onChange={e => setNewQuestion({...newQuestion, explanation: e.target.value})}
                   />
                 </div>

                 <Button type="submit" className="w-full h-12 gap-2 text-lg font-bold">
                   <PlusCircle className="h-5 w-5" /> Cadastrar Questão
                 </Button>
               </form>
             </CardContent>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
