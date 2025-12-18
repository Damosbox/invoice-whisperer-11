import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ApprovalRule, useCreateApprovalRule, useUpdateApprovalRule } from '@/hooks/useApprovalWorkflow';
import { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

const ROLES: { value: AppRole; label: string }[] = [
  { value: 'comptable', label: 'Comptable' },
  { value: 'daf', label: 'DAF' },
  { value: 'dg', label: 'DG' },
  { value: 'admin', label: 'Admin' },
];

const appRoles = ['admin', 'daf', 'dg', 'comptable', 'auditeur'] as const;

const formSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100),
  description: z.string().max(500).optional(),
  min_amount: z.coerce.number().min(0, 'Montant minimum invalide'),
  max_amount: z.coerce.number().nullable(),
  is_critical_supplier: z.boolean(),
  required_levels: z.coerce.number().min(1).max(3),
  level_1_role: z.enum(appRoles),
  level_2_role: z.enum(appRoles).nullable(),
  level_3_role: z.enum(appRoles).nullable(),
  priority: z.coerce.number().min(0),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface ApprovalRuleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: ApprovalRule | null;
}

export function ApprovalRuleForm({ open, onOpenChange, rule }: ApprovalRuleFormProps) {
  const createRule = useCreateApprovalRule();
  const updateRule = useUpdateApprovalRule();
  const isEditing = !!rule;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: rule?.name || '',
      description: rule?.description || '',
      min_amount: rule?.min_amount || 0,
      max_amount: rule?.max_amount ?? null,
      is_critical_supplier: rule?.is_critical_supplier || false,
      required_levels: rule?.required_levels || 1,
      level_1_role: (rule?.level_1_role as AppRole) || 'comptable',
      level_2_role: (rule?.level_2_role as AppRole | null) || null,
      level_3_role: (rule?.level_3_role as AppRole | null) || null,
      priority: rule?.priority || 0,
      is_active: rule?.is_active ?? true,
    },
  });

  const requiredLevels = form.watch('required_levels');

  const onSubmit = async (data: FormValues) => {
    const payload = {
      ...data,
      description: data.description || null,
      max_amount: data.max_amount || null,
      level_2_role: requiredLevels >= 2 ? data.level_2_role : null,
      level_3_role: requiredLevels >= 3 ? data.level_3_role : null,
    };

    if (isEditing && rule) {
      await updateRule.mutateAsync({ id: rule.id, ...payload });
    } else {
      await createRule.mutateAsync(payload as any);
    }
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifier la règle' : 'Nouvelle règle d\'approbation'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Montants élevés" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Description de la règle..." 
                      {...field} 
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="min_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant minimum (€)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant maximum (€)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Illimité" 
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormDescription>Laisser vide = illimité</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priorité</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>Plus élevé = prioritaire</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_critical_supplier"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fournisseur critique</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="mt-2"
                      />
                    </FormControl>
                    <FormDescription>Appliquer uniquement aux fournisseurs critiques</FormDescription>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="required_levels"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de niveaux d'approbation</FormLabel>
                  <Select 
                    onValueChange={(v) => field.onChange(Number(v))} 
                    defaultValue={String(field.value)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">1 niveau</SelectItem>
                      <SelectItem value="2">2 niveaux</SelectItem>
                      <SelectItem value="3">3 niveaux</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="level_1_role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rôle niveau 1</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ROLES.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {requiredLevels >= 2 && (
              <FormField
                control={form.control}
                name="level_2_role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rôle niveau 2</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un rôle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ROLES.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {requiredLevels >= 3 && (
              <FormField
                control={form.control}
                name="level_3_role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rôle niveau 3</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un rôle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ROLES.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Règle active</FormLabel>
                    <FormDescription>
                      Les règles inactives ne seront pas appliquées
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={createRule.isPending || updateRule.isPending}>
                {isEditing ? 'Enregistrer' : 'Créer'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
