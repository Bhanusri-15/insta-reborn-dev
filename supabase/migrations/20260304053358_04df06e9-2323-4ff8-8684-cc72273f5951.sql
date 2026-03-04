
-- Fix permissive INSERT policy on conversations - restrict to authenticated users only
DROP POLICY "Authenticated users can create conversations" ON public.conversations;
CREATE POLICY "Authenticated users can create conversations" ON public.conversations 
  FOR INSERT TO authenticated
  WITH CHECK (true);
