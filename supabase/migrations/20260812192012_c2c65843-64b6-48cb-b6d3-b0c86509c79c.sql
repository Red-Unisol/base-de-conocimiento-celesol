CREATE POLICY "Lectura autenticada de material" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id IN ('process-videos', 'process-docs', 'process-attachments'));

CREATE POLICY "Admins suben material" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('process-videos', 'process-docs', 'process-attachments')
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins actualizan material" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id IN ('process-videos', 'process-docs', 'process-attachments')
    AND public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    bucket_id IN ('process-videos', 'process-docs', 'process-attachments')
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins borran material" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id IN ('process-videos', 'process-docs', 'process-attachments')
    AND public.has_role(auth.uid(), 'admin')
  );