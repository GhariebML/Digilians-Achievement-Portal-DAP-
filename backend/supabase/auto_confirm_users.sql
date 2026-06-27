-- ==========================================
-- AUTO-CONFIRM ALL USERS (BYPASS EMAIL OTP)
-- ==========================================

-- 1. Confirm any existing users who are 'stuck'
UPDATE auth.users 
SET email_confirmed_at = now(), 
    confirmed_at = now() 
WHERE email_confirmed_at IS NULL;

-- 2. Create a function to automatically confirm all NEW users
CREATE OR REPLACE FUNCTION public.auto_confirm_new_user()
RETURNS trigger AS $ $
BEGIN
  UPDATE auth.users
  SET email_confirmed_at = now(),
      confirmed_at = now()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$ $ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Attach the trigger to the auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created_auto_confirm ON auth.users;
CREATE TRIGGER on_auth_user_created_auto_confirm
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.auto_confirm_new_user();
