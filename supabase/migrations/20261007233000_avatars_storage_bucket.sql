-- Migration: 20261007233000_avatars_storage_bucket.sql
-- Description: Create public storage bucket 'avatars' for profile picture uploads with RLS policies

-- ==============================================================================
-- 1. CONFIGURE PUBLIC BUCKET 'avatars'
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  TRUE,
  5242880, -- 5 MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = TRUE,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ==============================================================================
-- 2. STORAGE RLS POLICIES FOR 'avatars'
-- ==============================================================================

DROP POLICY IF EXISTS "storage_avatars_public_select" ON storage.objects;
CREATE POLICY "storage_avatars_public_select" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "storage_avatars_authenticated_insert" ON storage.objects;
CREATE POLICY "storage_avatars_authenticated_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
  );

DROP POLICY IF EXISTS "storage_avatars_authenticated_update" ON storage.objects;
CREATE POLICY "storage_avatars_authenticated_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars')
  WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "storage_avatars_authenticated_delete" ON storage.objects;
CREATE POLICY "storage_avatars_authenticated_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars');

-- ==============================================================================
-- 3. UPDATE update_my_profile TO ALLOW CLEARING OR SETTING AVATAR
-- ==============================================================================

CREATE OR REPLACE FUNCTION update_my_profile(
  p_display_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_updated RECORD;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE profiles
  SET
    display_name = COALESCE(p_display_name, display_name),
    phone = COALESCE(p_phone, phone),
    avatar_url = CASE 
      WHEN p_avatar_url IS NOT NULL AND p_avatar_url = '' THEN NULL 
      WHEN p_avatar_url IS NOT NULL THEN p_avatar_url 
      ELSE avatar_url 
    END,
    updated_at = NOW()
  WHERE id = v_uid
  RETURNING id, display_name, phone, avatar_url INTO v_updated;

  RETURN jsonb_build_object(
    'id', v_updated.id,
    'display_name', v_updated.display_name,
    'phone', v_updated.phone,
    'avatar_url', v_updated.avatar_url
  );
END;
$$;
