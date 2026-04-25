import { Button } from './ui/button';
import { Calculator, GraduationCap } from 'lucide-react';
import { motion } from 'motion/react';

interface AuthPageProps {
  onSignIn: () => void;
}

export default function AuthPage({ onSignIn }: AuthPageProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="rounded-3xl border bg-white p-8 shadow-xl shadow-slate-200/50 md:p-12">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/30">
              <Calculator className="h-8 w-8" />
            </div>
            <h2 className="mb-2 text-3xl font-bold tracking-tight">Monitoria Matemática</h2>
            <p className="text-slate-500">Pratique questões, acompanhe seu desempenho e tire suas dúvidas de matemática.</p>
          </div>

          <div className="space-y-4">
            <Button 
              className="h-12 w-full gap-3 text-base font-semibold" 
              onClick={onSignIn}
            >
              <img 
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                alt="Google" 
                className="h-5 w-5 bg-white rounded-full p-0.5"
              />
              Entrar com Google
            </Button>
            
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

        <p className="mt-8 text-center text-xs text-slate-400">
          Desenvolvido para auxiliar no aprendizado de matemática.
        </p>
      </motion.div>
    </div>
  );
}
