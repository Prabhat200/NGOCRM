-- Migration: 20261007191501_rls_policies.sql
-- Description: Production Row Level Security policies across all tables

-- ==============================================================================
-- 1. ORGANIZATIONS
-- ==============================================================================
CREATE POLICY "organizations_select_member" ON organizations
  FOR SELECT TO authenticated
  USING (id = current_organization_id());

CREATE POLICY "organizations_update_admin" ON organizations
  FOR UPDATE TO authenticated
  USING (id = current_organization_id() AND has_permission('settings.manage'))
  WITH CHECK (id = current_organization_id() AND has_permission('settings.manage'));


-- ==============================================================================
-- 2. PROFILES
-- ==============================================================================
CREATE POLICY "profiles_select_self_or_admin" ON profiles
  FOR SELECT TO authenticated
  USING (
    organization_id = current_organization_id()
    AND (id = auth.uid() OR has_permission('users.view'))
  );

-- Self-service update on safe profile fields only (cannot escalate organization_id, status, or member_id)
CREATE POLICY "profiles_update_self" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() AND organization_id = current_organization_id())
  WITH CHECK (
    id = auth.uid()
    AND organization_id = current_organization_id()
    AND status = (SELECT p.status FROM profiles p WHERE p.id = auth.uid())
    AND member_id IS NOT DISTINCT FROM (SELECT p.member_id FROM profiles p WHERE p.id = auth.uid())
  );

CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE TO authenticated
  USING (organization_id = current_organization_id() AND has_permission('users.disable'))
  WITH CHECK (organization_id = current_organization_id() AND has_permission('users.disable'));


-- ==============================================================================
-- 3. MEMBERS
-- ==============================================================================
CREATE POLICY "members_select_authorized" ON members
  FOR SELECT TO authenticated
  USING (
    organization_id = current_organization_id()
    AND has_permission('members.view')
  );

CREATE POLICY "members_insert_authorized" ON members
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = current_organization_id()
    AND has_permission('members.create')
  );

CREATE POLICY "members_update_authorized" ON members
  FOR UPDATE TO authenticated
  USING (organization_id = current_organization_id() AND has_permission('members.edit'))
  WITH CHECK (organization_id = current_organization_id() AND has_permission('members.edit'));


-- ==============================================================================
-- 4. ROLES & PERMISSIONS
-- ==============================================================================
CREATE POLICY "roles_select_org" ON roles
  FOR SELECT TO authenticated
  USING (organization_id = current_organization_id() AND is_active_user());

CREATE POLICY "roles_mutate_admin" ON roles
  FOR ALL TO authenticated
  USING (
    organization_id = current_organization_id()
    AND has_permission('settings.manage')
    AND NOT is_system_role
  )
  WITH CHECK (
    organization_id = current_organization_id()
    AND has_permission('settings.manage')
    AND NOT is_system_role
  );

CREATE POLICY "permissions_select_active" ON permissions
  FOR SELECT TO authenticated
  USING (is_active_user());

-- USER ROLES with privilege escalation protection (Rule 57)
CREATE POLICY "user_roles_select_org" ON user_roles
  FOR SELECT TO authenticated
  USING (organization_id = current_organization_id() AND is_active_user());

CREATE POLICY "user_roles_insert_admin" ON user_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = current_organization_id()
    AND has_permission('users.manage_roles')
    AND user_id <> auth.uid() -- Cannot assign roles to oneself
    AND (
      -- Only existing Super Admin can grant Super Admin role
      (SELECT slug FROM roles WHERE id = role_id) <> 'super_admin'
      OR is_super_admin()
    )
  );

CREATE POLICY "user_roles_delete_admin" ON user_roles
  FOR DELETE TO authenticated
  USING (
    organization_id = current_organization_id()
    AND has_permission('users.manage_roles')
    AND user_id <> auth.uid() -- Cannot revoke roles from oneself
    AND (
      (SELECT slug FROM roles WHERE id = role_id) <> 'super_admin'
      OR is_super_admin()
    )
  );

CREATE POLICY "role_permissions_select_org" ON role_permissions
  FOR SELECT TO authenticated
  USING (
    organization_id = current_organization_id()
    AND (has_permission('settings.view') OR has_permission('users.manage_roles'))
  );

CREATE POLICY "role_permissions_mutate_admin" ON role_permissions
  FOR ALL TO authenticated
  USING (organization_id = current_organization_id() AND has_permission('settings.manage'))
  WITH CHECK (organization_id = current_organization_id() AND has_permission('settings.manage'));


-- ==============================================================================
-- 5. GROUPS & OCCASIONS
-- ==============================================================================
CREATE POLICY "groups_select_org" ON groups
  FOR SELECT TO authenticated
  USING (organization_id = current_organization_id() AND has_permission('groups.view'));

CREATE POLICY "groups_insert_org" ON groups
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = current_organization_id() AND has_permission('groups.create'));

CREATE POLICY "groups_update_org" ON groups
  FOR UPDATE TO authenticated
  USING (organization_id = current_organization_id() AND has_permission('groups.edit'))
  WITH CHECK (organization_id = current_organization_id() AND has_permission('groups.edit'));

CREATE POLICY "group_members_select_org" ON group_members
  FOR SELECT TO authenticated
  USING (organization_id = current_organization_id() AND has_permission('groups.view'));

CREATE POLICY "group_members_mutate_admin" ON group_members
  FOR ALL TO authenticated
  USING (organization_id = current_organization_id() AND has_permission('groups.manage_members'))
  WITH CHECK (organization_id = current_organization_id() AND has_permission('groups.manage_members'));

CREATE POLICY "occasion_types_select_org" ON occasion_types
  FOR SELECT TO authenticated
  USING (organization_id = current_organization_id() AND is_active_user());

CREATE POLICY "occasion_types_mutate_admin" ON occasion_types
  FOR ALL TO authenticated
  USING (organization_id = current_organization_id() AND has_permission('settings.manage'))
  WITH CHECK (organization_id = current_organization_id() AND has_permission('settings.manage'));

CREATE POLICY "occasions_select_org" ON occasions
  FOR SELECT TO authenticated
  USING (organization_id = current_organization_id() AND has_permission('occasions.view'));

CREATE POLICY "occasions_insert_org" ON occasions
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = current_organization_id() AND has_permission('occasions.create'));

CREATE POLICY "occasions_update_org" ON occasions
  FOR UPDATE TO authenticated
  USING (organization_id = current_organization_id() AND has_permission('occasions.edit'))
  WITH CHECK (organization_id = current_organization_id() AND has_permission('occasions.edit'));

CREATE POLICY "occasion_members_select_org" ON occasion_members
  FOR SELECT TO authenticated
  USING (organization_id = current_organization_id() AND has_permission('occasions.view'));

CREATE POLICY "occasion_members_mutate_admin" ON occasion_members
  FOR ALL TO authenticated
  USING (organization_id = current_organization_id() AND has_permission('occasions.edit'))
  WITH CHECK (organization_id = current_organization_id() AND has_permission('occasions.edit'));


-- ==============================================================================
-- 6. DOCUMENTS & VERSIONS (CORE SECURITY BOUNDARY)
-- ==============================================================================
CREATE POLICY "document_categories_select_org" ON document_categories
  FOR SELECT TO authenticated
  USING (organization_id = current_organization_id() AND is_active_user());

CREATE POLICY "document_categories_mutate_admin" ON document_categories
  FOR ALL TO authenticated
  USING (organization_id = current_organization_id() AND has_permission('settings.manage'))
  WITH CHECK (organization_id = current_organization_id() AND has_permission('settings.manage'));

-- DOCUMENTS: SELECT is strictly governed by can_view_document(id) (Rule 33)
CREATE POLICY "documents_select_authorized" ON documents
  FOR SELECT TO authenticated
  USING (can_view_document(id));

CREATE POLICY "documents_insert_authorized" ON documents
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = current_organization_id()
    AND has_permission('documents.create')
    AND created_by = auth.uid()
  );

CREATE POLICY "documents_update_authorized" ON documents
  FOR UPDATE TO authenticated
  USING (can_edit_document(id))
  WITH CHECK (can_edit_document(id));

-- DOCUMENT VERSIONS: SELECT governed by can_view_document(document_id)
CREATE POLICY "document_versions_select_authorized" ON document_versions
  FOR SELECT TO authenticated
  USING (
    organization_id = current_organization_id()
    AND can_view_document(document_id)
  );

CREATE POLICY "document_versions_insert_authorized" ON document_versions
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = current_organization_id()
    AND has_permission('documents.upload_version')
    AND can_edit_document(document_id)
    AND uploaded_by = auth.uid()
  );


-- ==============================================================================
-- 7. TAGS, ACCESS TABLES & FAVORITES
-- ==============================================================================
CREATE POLICY "tags_select_org" ON tags
  FOR SELECT TO authenticated
  USING (organization_id = current_organization_id() AND is_active_user());

CREATE POLICY "tags_insert_org" ON tags
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = current_organization_id() AND has_permission('documents.create'));

CREATE POLICY "document_tags_select" ON document_tags
  FOR SELECT TO authenticated
  USING (can_view_document(document_id));

CREATE POLICY "document_tags_mutate" ON document_tags
  FOR ALL TO authenticated
  USING (can_edit_document(document_id))
  WITH CHECK (can_edit_document(document_id));

-- Document Access Grants (Role, Group, User) - Inspect & Mutate only if can_manage_document
CREATE POLICY "doc_role_access_select" ON document_role_access
  FOR SELECT TO authenticated
  USING (can_manage_document(document_id));

CREATE POLICY "doc_role_access_mutate" ON document_role_access
  FOR ALL TO authenticated
  USING (organization_id = current_organization_id() AND has_permission('documents.manage_access') AND can_manage_document(document_id))
  WITH CHECK (organization_id = current_organization_id() AND has_permission('documents.manage_access') AND can_manage_document(document_id));

CREATE POLICY "doc_group_access_select" ON document_group_access
  FOR SELECT TO authenticated
  USING (can_manage_document(document_id));

CREATE POLICY "doc_group_access_mutate" ON document_group_access
  FOR ALL TO authenticated
  USING (organization_id = current_organization_id() AND has_permission('documents.manage_access') AND can_manage_document(document_id))
  WITH CHECK (organization_id = current_organization_id() AND has_permission('documents.manage_access') AND can_manage_document(document_id));

CREATE POLICY "doc_user_access_select" ON document_user_access
  FOR SELECT TO authenticated
  USING (can_manage_document(document_id));

CREATE POLICY "doc_user_access_mutate" ON document_user_access
  FOR ALL TO authenticated
  USING (organization_id = current_organization_id() AND has_permission('documents.manage_access') AND can_manage_document(document_id))
  WITH CHECK (organization_id = current_organization_id() AND has_permission('documents.manage_access') AND can_manage_document(document_id));

-- Favorites (Strictly isolated to user_id = auth.uid())
CREATE POLICY "favorites_select_own" ON document_favorites
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND organization_id = current_organization_id());

CREATE POLICY "favorites_insert_own" ON document_favorites
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND organization_id = current_organization_id()
    AND can_view_document(document_id)
  );

CREATE POLICY "favorites_delete_own" ON document_favorites
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND organization_id = current_organization_id());


-- ==============================================================================
-- 8. ACTIVITY LOGS & NOTIFICATIONS
-- ==============================================================================
CREATE POLICY "activity_logs_select_admin" ON activity_logs
  FOR SELECT TO authenticated
  USING (organization_id = current_organization_id() AND has_permission('audit.view'));

CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND organization_id = current_organization_id());

CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND organization_id = current_organization_id())
  WITH CHECK (user_id = auth.uid() AND organization_id = current_organization_id());
