// FR-0.7/FR-0.8/FR-1.8 (LGPD/menores, D6): shared "is this athlete a minor"
// check, reused by the onboarding guardian-consent step and the meu-perfil
// privacy section so both sides of the UI agree on the same age math used
// by the athletes.profile_visibility DB trigger (see
// supabase/migrations/00007_lgpd_minors.sql::athlete_is_minor). Unknown
// birth_date is treated as a minor — conservative default, mirrors the SQL
// function's NULL handling.
export function isMinor(birthDate: string | null | undefined): boolean {
  if (!birthDate) return true;

  const today = new Date();
  const birth = new Date(birthDate + "T00:00:00");
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age < 18;
}
