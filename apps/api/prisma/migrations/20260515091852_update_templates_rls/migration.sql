DROP POLICY IF EXISTS "templates_tenant" ON "templates";

CREATE POLICY "templates_select" ON "templates"
  FOR SELECT USING (app.is_super_admin() OR "workspace_id" = app.current_workspace_id() OR "is_global" = true);
  
CREATE POLICY "templates_insert" ON "templates"
  FOR INSERT WITH CHECK (app.is_super_admin() OR "workspace_id" = app.current_workspace_id());
  
CREATE POLICY "templates_update" ON "templates"
  FOR UPDATE USING (app.is_super_admin() OR "workspace_id" = app.current_workspace_id())
  WITH CHECK (app.is_super_admin() OR "workspace_id" = app.current_workspace_id());
  
CREATE POLICY "templates_delete" ON "templates"
  FOR DELETE USING (app.is_super_admin() OR "workspace_id" = app.current_workspace_id());