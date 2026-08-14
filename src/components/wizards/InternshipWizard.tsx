import React, { useState } from 'react';
import { HeartHandshake } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { hapticSuccess } from '../../lib/haptics';
import { WizardScaffold, type WizardStep } from './WizardScaffold';
import { DateInput, FieldLabel, ReviewCard, TextArea, TextInput } from './wizardFields';

const today = () => new Date().toISOString().split('T')[0];

export const InternshipWizard: React.FC = () => {
  const { handleAddInternshipLog, closeWizard, showToast } = useApp();

  const [step, setStep] = useState(0);
  const [activity, setActivity] = useState('');
  const [hours, setHours] = useState('4');
  const [date, setDate] = useState(today());
  const [supervisionNotes, setSupervisionNotes] = useState('');
  const [reflections, setReflections] = useState('');

  const steps: WizardStep[] = [
    {
      id: 'estagio-atividade',
      title: 'atividade',
      content: (
        <div className="space-y-2">
          <FieldLabel>atividade de estágio realizada</FieldLabel>
          <TextArea
            rows={5}
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            placeholder="ex: acolhimento na triagem da clínica escola"
            autoFocus
          />
        </div>
      ),
    },
    {
      id: 'estagio-horas',
      title: 'horas & data',
      content: (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>horas</FieldLabel>
            <TextInput
              type="number"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="ex: 4"
            />
          </div>
          <div>
            <FieldLabel>data</FieldLabel>
            <DateInput value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
      ),
    },
    {
      id: 'estagio-reflexao',
      title: 'reflexão',
      content: (
        <div className="space-y-4">
          <div>
            <FieldLabel>notas da supervisão</FieldLabel>
            <TextArea
              rows={4}
              value={supervisionNotes}
              onChange={(e) => setSupervisionNotes(e.target.value)}
              placeholder="orientação da supervisora..."
            />
          </div>
          <div>
            <FieldLabel>reflexões do dia</FieldLabel>
            <TextArea
              rows={4}
              value={reflections}
              onChange={(e) => setReflections(e.target.value)}
              placeholder="como foi pra você? o que aprendeu?"
            />
          </div>
        </div>
      ),
    },
    {
      id: 'estagio-revisar',
      title: 'revisar',
      content: (
        <div className="space-y-3">
          <p className="text-xs font-medium text-ceci-secondary">
            confere se está tudo certinho antes de guardar:
          </p>
          <ReviewCard
            rows={[
              { label: 'atividade', value: activity.trim() },
              { label: 'horas', value: `${hours} h` },
              { label: 'data', value: date ? new Date(date).toLocaleDateString('pt-BR') : today() },
              { label: 'supervisão', value: supervisionNotes.trim() || 'sem notas' },
              { label: 'reflexões', value: reflections.trim() || 'sem reflexões' },
            ]}
          />
        </div>
      ),
    },
  ];

  const handleSave = () => {
    handleAddInternshipLog({
      id: 'ilog-' + Date.now(),
      date: date || today(),
      hours: parseFloat(hours) || 4,
      activity: activity.trim(),
      supervisionNotes: supervisionNotes.trim() || 'supervisão registrada no cecistudy.',
      reflections: reflections.trim() || 'reflexão registrada no diário do cecistudy.',
    });
    hapticSuccess();
    closeWizard();
    showToast('registro de estágio guardado ♡');
  };

  return (
    <WizardScaffold
      title="novo registro de estágio"
      icon={<HeartHandshake className="w-3.5 h-3.5" />}
      iconClass="bg-surface-rose border-ceci-border-brand text-ceci-brand-strong"
      steps={steps}
      step={step}
      onStepChange={setStep}
      canNext={activity.trim().length > 0}
      onSave={handleSave}
      onClose={closeWizard}
      saveLabel="guardar registro ♡"
    />
  );
};
