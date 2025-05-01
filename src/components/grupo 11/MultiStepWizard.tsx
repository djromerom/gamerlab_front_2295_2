import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Form,
} from '@/components/ui/form';
import { MultiFormProvider } from '@/contexts/MultiFormContext';
import StepRenderer from './StepRenderer';
import { CombinedFormValues, CombinedSchema } from '@/lib/schemas';

export default function MultiStepWizard() {
  const methods = useForm<CombinedFormValues>({
    resolver: zodResolver(CombinedSchema),
    defaultValues: {
      teamName: '',
      members: [{ nombre: '', correo: '', codigoEstudiantil: '', nrc: '' }],
      gameName: '',
      description: '',
      files: [],
      recaptcha: '',
    },
  });
  
  async function onSubmit(data: CombinedFormValues) {
    console.log(data);
    toast('¡Formulario completo enviado!', {
      description: 'Todos los datos han sido recibidos.',
      icon: '✅',
      duration: 3000,
    });
  }

  return (
    <MultiFormProvider>
      <FormProvider {...methods}>
        <Form {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
            <StepRenderer />
            
          </form>
        </Form>
      </FormProvider>
    </MultiFormProvider>
  );
}






