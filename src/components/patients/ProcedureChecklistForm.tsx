"use client";

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, ArrowLeft, Check, X, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Patient, ProcedureChecklist } from '@/types';
import { cn } from '@/lib/utils';

const checklistItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  status: z.enum(['yes', 'no', 'n/a']),
  comments: z.string().optional(),
});

const procedureChecklistSchema = z.object({
  patientName: z.string().min(1, 'Patient name is required'),
  age: z.string().min(1, 'Age is required'),
  gender: z.string().min(1, 'Gender is required'),
  procedure: z.string().min(1, 'Procedure is required'),
  indication: z.string().min(1, 'Indication is required'),
  diagnosis: z.string().min(1, 'Diagnosis is required'),
  date: z.string().min(1, 'Date is required'),
  radiologicalDiagnosis: z.string().optional(),
  pathologicalDiagnosis: z.string().optional(),
  procedureNote: z.string().optional(),
  preProcedureVitals: z.object({
    bp: z.string().optional(),
    pulse: z.string().optional(),
    spo2: z.string().optional(),
    temp: z.string().optional(),
  }),
  preProcedureItems: z.array(checklistItemSchema),
  procedureItems: z.array(checklistItemSchema),
  postProcedureItems: z.array(checklistItemSchema),
});

type ProcedureChecklistFormData = z.infer<typeof procedureChecklistSchema>;

interface ProcedureChecklistFormProps {
  patient: Patient;
  initialData?: ProcedureChecklist;
  onSubmit: (data: ProcedureChecklistFormData) => Promise<void>;
  loading: boolean;
}

const PRE_PROCEDURE_ITEMS = [
  "Discussed referring Physician/MDT",
  "Imaging Sss Reviewed",
  "Relevant Medical History",
  "Informed Consent",
  "Antibiotics Prophylaxis",
  "Specific Tools/consumumables Present",
  "Allergy",
  "Coagulatory profile (INR)",
  "Fed or Fasting",
  "Anaestesia / Analgesia",
  "Post interventional bed or admission",
  "Other lab result (FBC)",
  "HIV positive",
  "Random blood sugar (RBS)"
];

const PROCEDURE_ITEMS = [
  "IV access",
  "Consent signed",
  "Clearance",
  "Fed or Fasting",
  "Procedure site",
  "Confirm correct patient",
  "Antibiotics administered"
];

const POST_PROCEDURE_ITEMS = [
  "Post Procedure note and order",
  "Sample labeleed and sent",
  "Procedure outcome discussed with patient.",
  "Discharged instruction and follow up.",
  "Post procedure vitals",
  "Check xray"
];

export function ProcedureChecklistForm({ patient, initialData, onSubmit, loading }: ProcedureChecklistFormProps) {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProcedureChecklistFormData>({
    resolver: zodResolver(procedureChecklistSchema),
    defaultValues: {
      patientName: initialData?.patientName || patient.name,
      age: initialData?.age || patient.age.toString(),
      gender: initialData?.gender || patient.gender,
      procedure: initialData?.procedure || patient.procedure || '',
      indication: initialData?.indication || '',
      diagnosis: initialData?.diagnosis || patient.diagnosis || '',
      date: initialData?.date 
        ? (initialData.date instanceof Date ? initialData.date : new Date(initialData.date)).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      radiologicalDiagnosis: initialData?.radiologicalDiagnosis || '',
      pathologicalDiagnosis: initialData?.pathologicalDiagnosis || '',
      procedureNote: initialData?.procedureNote || '',
      preProcedureVitals: {
        bp: initialData?.preProcedureVitals?.bp || '',
        pulse: initialData?.preProcedureVitals?.pulse || '',
        spo2: initialData?.preProcedureVitals?.spo2 || '',
        temp: initialData?.preProcedureVitals?.temp || '',
      },
      preProcedureItems: (initialData as any)?.sections?.preProcedure || (initialData as any)?.preProcedureItems || PRE_PROCEDURE_ITEMS.map((label, i) => ({
        id: `pre-${i}`,
        label,
        status: 'n/a',
        comments: '',
      })),
      procedureItems: (initialData as any)?.sections?.procedure || (initialData as any)?.procedureItems || PROCEDURE_ITEMS.map((label, i) => ({
        id: `proc-${i}`,
        label,
        status: 'n/a',
        comments: '',
      })),
      postProcedureItems: (initialData as any)?.sections?.postProcedure || (initialData as any)?.postProcedureItems || POST_PROCEDURE_ITEMS.map((label, i) => ({
        id: `post-${i}`,
        label,
        status: 'n/a',
        comments: '',
      })),

    },
  });

  const { fields: preFields } = useFieldArray({ control, name: 'preProcedureItems' });
  const { fields: procFields } = useFieldArray({ control, name: 'procedureItems' });
  const { fields: postFields } = useFieldArray({ control, name: 'postProcedureItems' });

  const renderChecklistTable = (fields: any[], name: 'preProcedureItems' | 'procedureItems' | 'postProcedureItems', title: string) => (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-primary uppercase tracking-wider">{title}</h3>
      <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/50">
        <Table>
          <TableHeader className="bg-slate-800/50">
            <TableRow>
              <TableHead className="text-slate-300 w-[40%]">Checklist Item</TableHead>
              <TableHead className="text-slate-300 text-center w-[10%]">YES</TableHead>
              <TableHead className="text-slate-300 text-center w-[10%]">NO</TableHead>
              <TableHead className="text-slate-300 text-center w-[10%]">N/A</TableHead>
              <TableHead className="text-slate-300">Comments</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field, index) => {
              const status = watch(`${name}.${index}.status`);
              return (
                <TableRow key={field.id} className="hover:bg-slate-800/30 transition-colors border-slate-800">
                  <TableCell className="font-medium text-slate-200">{field.label}</TableCell>
                  <TableCell className="text-center">
                    <button
                      type="button"
                      onClick={() => setValue(`${name}.${index}.status`, 'yes')}
                      className={cn(
                        "h-8 w-8 rounded-full inline-flex items-center justify-center transition-all",
                        status === 'yes' ? "bg-green-600 text-white shadow-lg shadow-green-900/20" : "bg-slate-800 text-slate-500 hover:bg-slate-700"
                      )}
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  </TableCell>
                  <TableCell className="text-center">
                    <button
                      type="button"
                      onClick={() => setValue(`${name}.${index}.status`, 'no')}
                      className={cn(
                        "h-8 w-8 rounded-full inline-flex items-center justify-center transition-all",
                        status === 'no' ? "bg-red-600 text-white shadow-lg shadow-red-900/20" : "bg-slate-800 text-slate-500 hover:bg-slate-700"
                      )}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </TableCell>
                  <TableCell className="text-center">
                    <button
                      type="button"
                      onClick={() => setValue(`${name}.${index}.status`, 'n/a')}
                      className={cn(
                        "h-8 w-8 rounded-full inline-flex items-center justify-center transition-all",
                        status === 'n/a' ? "bg-slate-600 text-white" : "bg-slate-800 text-slate-500 hover:bg-slate-700"
                      )}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                  </TableCell>
                  <TableCell>
                    <Input
                      {...register(`${name}.${index}.comments`)}
                      placeholder="Add comments..."
                      className="bg-slate-950/50 border-slate-800 h-8 text-xs focus:ring-primary/50"
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white uppercase tracking-tight">Procedure Check List</h1>
          <p className="text-slate-400 text-sm">LASUTH Interventional Radiology</p>
        </div>
        <Button 
          type="submit" 
          disabled={loading}
          className="bg-primary hover:bg-primary/90 text-white px-8 h-11 rounded-xl shadow-lg shadow-primary/20"
        >
          {loading ? 'Saving...' : 'Save Checklist'}
          <Save className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-md overflow-hidden">
        <CardHeader className="bg-slate-800/30 border-b border-slate-800">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-300">Patient Details & Vitals</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs uppercase font-bold">Patient Name</Label>
              <Input {...register('patientName')} className="bg-slate-950 border-slate-800 h-10" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs uppercase font-bold">Age</Label>
              <Input {...register('age')} className="bg-slate-950 border-slate-800 h-10" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs uppercase font-bold">Sex</Label>
              <select 
                {...register('gender')} 
                className="w-full h-10 rounded-md bg-slate-950 border border-slate-800 text-slate-100 px-3 text-sm focus:ring-primary"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs uppercase font-bold">Date</Label>
              <Input type="date" {...register('date')} className="bg-slate-950 border-slate-800 h-10" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs uppercase font-bold">Procedure</Label>
              <Input {...register('procedure')} className="bg-slate-950 border-slate-800 h-10" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs uppercase font-bold">Indication</Label>
              <Input {...register('indication')} className="bg-slate-950 border-slate-800 h-10" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs uppercase font-bold">Diagnosis</Label>
              <Input {...register('diagnosis')} className="bg-slate-950 border-slate-800 h-10" />
            </div>
          </div>

          <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-widest">Preprocedure Vitals</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label className="text-slate-500 text-[10px] uppercase font-bold">BP (mmHg)</Label>
                <Input {...register('preProcedureVitals.bp')} placeholder="e.g. 120/80" className="bg-slate-900 border-slate-800 h-10" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-500 text-[10px] uppercase font-bold">Pulse (bpm)</Label>
                <Input {...register('preProcedureVitals.pulse')} placeholder="72" className="bg-slate-900 border-slate-800 h-10" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-500 text-[10px] uppercase font-bold">SpO2 (%)</Label>
                <Input {...register('preProcedureVitals.spo2')} placeholder="98" className="bg-slate-900 border-slate-800 h-10" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-500 text-[10px] uppercase font-bold">Temp (°C)</Label>
                <Input {...register('preProcedureVitals.temp')} placeholder="36.5" className="bg-slate-900 border-slate-800 h-10" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-12">
        {renderChecklistTable(preFields, 'preProcedureItems', 'Pre-Procedure')}
        {renderChecklistTable(procFields, 'procedureItems', 'Procedure')}
        {renderChecklistTable(postFields, 'postProcedureItems', 'Post-Procedure')}
      </div>

      <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-md">
        <CardHeader className="bg-slate-800/30 border-b border-slate-800">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-300">Final Notes & Diagnosis</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs uppercase font-bold">Radiological Diagnosis</Label>
              <Input {...register('radiologicalDiagnosis')} className="bg-slate-950 border-slate-800 h-10" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs uppercase font-bold">Pathological Diagnosis</Label>
              <Input {...register('pathologicalDiagnosis')} className="bg-slate-950 border-slate-800 h-10" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-slate-400 text-xs uppercase font-bold">Procedure Note</Label>
            <Textarea 
              {...register('procedureNote')} 
              placeholder="Enter detailed procedure notes..."
              className="bg-slate-950 border-slate-800 min-h-[120px]"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-4">
        <Button 
          type="submit" 
          disabled={loading}
          className="bg-primary hover:bg-primary/90 text-white px-12 h-12 rounded-xl text-lg font-bold shadow-xl shadow-primary/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          {loading ? 'Saving Checklist...' : 'Complete & Save Checklist'}
        </Button>
      </div>
    </form>
  );
}
