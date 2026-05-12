-- ═══════════════════════════════════════════════════════════════════════════════
-- Operix — New Message Notification Trigger
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════
-- When a new chat_message is inserted, send a notification to the receiver.
-- The notification uses related_module = 'messages' so the TopNavBar
-- deep-links to the Messages page when clicked.

CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  sender_name TEXT;
BEGIN
  -- Look up the sender's name
  SELECT COALESCE(
    NULLIF(TRIM(CONCAT(first_name, ' ', last_name)), ''),
    'Someone'
  )
  INTO sender_name
  FROM public.users
  WHERE id = NEW.sender_id;

  -- Don't notify yourself
  IF NEW.sender_id IS DISTINCT FROM NEW.receiver_id AND NEW.receiver_id IS NOT NULL THEN
    INSERT INTO public.notifications
      (user_id, title, message, related_module, related_id, priority, notification_type)
    VALUES (
      NEW.receiver_id,
      'New Message',
      sender_name || ': ' || LEFT(COALESCE(NEW.message, '📷 Image'), 80),
      'messages',
      NEW.sender_id,   -- related_id = sender's user id (so TopNavBar can navigate)
      'normal',
      'informational'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_new_message_notification ON public.chat_messages;
CREATE TRIGGER trg_new_message_notification
AFTER INSERT ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION notify_new_message();
