
-- Enable RLS on realtime.messages and restrict subscriptions to admins only.
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins receive realtime messages" ON realtime.messages;
CREATE POLICY "Admins receive realtime messages"
ON realtime.messages
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));
