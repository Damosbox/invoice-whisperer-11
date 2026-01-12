import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface TestAccount {
  email: string;
  fullName: string;
  role: AppRole;
  password: string;
}

interface AccountResult {
  email: string;
  role: AppRole;
  status: 'success' | 'error' | 'pending';
  message: string;
}

const TEST_ACCOUNTS: TestAccount[] = [
  { email: 'comptable.test@facturapro.test', fullName: 'Marie Comptable', role: 'comptable', password: 'Test123!' },
  { email: 'daf.test@facturapro.test', fullName: 'Pierre DAF', role: 'daf', password: 'Test123!' },
  { email: 'dg.test@facturapro.test', fullName: 'Sophie DG', role: 'dg', password: 'Test123!' },
  { email: 'admin.test@facturapro.test', fullName: 'Jean Admin', role: 'admin', password: 'Test123!' },
  { email: 'auditeur.test@facturapro.test', fullName: 'Paul Auditeur', role: 'auditeur', password: 'Test123!' },
];

export function useSeedTestAccounts() {
  const [isCreating, setIsCreating] = useState(false);
  const [results, setResults] = useState<AccountResult[]>([]);
  const [progress, setProgress] = useState(0);

  const createTestAccounts = async () => {
    setIsCreating(true);
    setResults([]);
    setProgress(0);

    const newResults: AccountResult[] = TEST_ACCOUNTS.map(account => ({
      email: account.email,
      role: account.role,
      status: 'pending' as const,
      message: 'En attente...',
    }));
    setResults([...newResults]);

    for (let i = 0; i < TEST_ACCOUNTS.length; i++) {
      const account = TEST_ACCOUNTS[i];
      
      try {
        // Check if user already exists via profiles
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('email', account.email)
          .single();

        if (existingProfile) {
          // User exists, check if role is already assigned
          const { data: existingRole } = await supabase
            .from('user_roles')
            .select('id')
            .eq('user_id', existingProfile.user_id)
            .eq('role', account.role)
            .single();

          if (existingRole) {
            newResults[i] = {
              ...newResults[i],
              status: 'success',
              message: 'Compte déjà existant avec ce rôle',
            };
          } else {
            // Assign role to existing user
            const { error: roleError } = await supabase
              .from('user_roles')
              .insert({ user_id: existingProfile.user_id, role: account.role });

            if (roleError) {
              throw new Error(`Erreur attribution rôle: ${roleError.message}`);
            }

            newResults[i] = {
              ...newResults[i],
              status: 'success',
              message: 'Rôle ajouté au compte existant',
            };
          }
        } else {
          // Create new user
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: account.email,
            password: account.password,
            options: {
              data: { full_name: account.fullName },
              emailRedirectTo: window.location.origin,
            },
          });

          if (signUpError) {
            throw new Error(`Erreur inscription: ${signUpError.message}`);
          }

          if (!signUpData.user) {
            throw new Error('Utilisateur non créé');
          }

          // Wait a bit for the trigger to create the profile
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Assign role
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({ user_id: signUpData.user.id, role: account.role });

          if (roleError) {
            throw new Error(`Erreur attribution rôle: ${roleError.message}`);
          }

          newResults[i] = {
            ...newResults[i],
            status: 'success',
            message: 'Compte créé avec succès',
          };
        }
      } catch (error) {
        newResults[i] = {
          ...newResults[i],
          status: 'error',
          message: error instanceof Error ? error.message : 'Erreur inconnue',
        };
      }

      setResults([...newResults]);
      setProgress(((i + 1) / TEST_ACCOUNTS.length) * 100);
    }

    setIsCreating(false);

    const successCount = newResults.filter(r => r.status === 'success').length;
    const errorCount = newResults.filter(r => r.status === 'error').length;

    if (errorCount === 0) {
      toast.success(`${successCount} comptes de test créés avec succès`);
    } else if (successCount > 0) {
      toast.warning(`${successCount} comptes créés, ${errorCount} erreurs`);
    } else {
      toast.error('Échec de la création des comptes de test');
    }
  };

  return {
    testAccounts: TEST_ACCOUNTS,
    isCreating,
    results,
    progress,
    createTestAccounts,
  };
}
