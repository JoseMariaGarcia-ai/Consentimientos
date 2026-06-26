import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const ALL_MODULES = ['dashboard', 'patients', 'doctors', 'consents', 'templates', 'clinic']

async function handleUsers(method: string, path: string, body: any, query: any) {
  const parts = path.split('/').filter(Boolean)
  // parts: ['users'] or ['users', id] or ['users', id, 'permissions']

  // GET /users
  if (method === 'GET' && parts.length === 1) {
    const { data, error } = await supabase
      .from('app_users')
      .select('*, user_permissions(*)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return { status: 200, body: data }
  }

  // POST /users — create user + default permissions
  if (method === 'POST' && parts.length === 1) {
    const { email, full_name, role, clinic_id, permissions } = body

    const { data: user, error } = await supabase
      .from('app_users')
      .insert({ email, full_name, role: role || 'clinica', clinic_id })
      .select()
      .single()
    if (error) throw error

    // Insert permissions (for 'clinica' role)
    const perms = ALL_MODULES.map(module => ({
      user_id: user.id,
      module,
      can_access: permissions ? (permissions[module] ?? module !== 'settings') : module !== 'settings',
    }))
    await supabase.from('user_permissions').insert(perms)

    // Send Supabase magic link invite
    try {
      await supabase.auth.admin.inviteUserByEmail(email)
    } catch (_) {
      // Non-fatal: user may already exist in auth
    }

    return { status: 201, body: { ...user, user_permissions: perms } }
  }

  // PUT /users/:id — update user
  if (method === 'PUT' && parts.length === 2) {
    const id = parts[1]
    const { full_name, role, is_active } = body

    const { data, error } = await supabase
      .from('app_users')
      .update({ full_name, role, is_active, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return { status: 200, body: data }
  }

  // PUT /users/:id/permissions — update permissions
  if (method === 'PUT' && parts.length === 3 && parts[2] === 'permissions') {
    const user_id = parts[1]
    const permissions: Record<string, boolean> = body

    const upserts = Object.entries(permissions).map(([module, can_access]) => ({
      user_id,
      module,
      can_access,
    }))
    const { error } = await supabase
      .from('user_permissions')
      .upsert(upserts, { onConflict: 'user_id,module' })
    if (error) throw error
    return { status: 200, body: { updated: true } }
  }

  // DELETE /users/:id
  if (method === 'DELETE' && parts.length === 2) {
    const id = parts[1]
    await supabase.from('user_permissions').delete().eq('user_id', id)
    const { error } = await supabase.from('app_users').delete().eq('id', id)
    if (error) throw error
    return { status: 200, body: { deleted: true } }
  }

  return { status: 404, body: { error: 'Not found' } }
}

export const handler = async (event: any) => {
  try {
    const path = event.path.replace('/.netlify/functions/users', '') || '/'
    const body = event.body ? JSON.parse(event.body) : {}
    const result = await handleUsers(event.httpMethod, path, body, event.queryStringParameters)
    return { statusCode: result.status, body: JSON.stringify(result.body) }
  } catch (err: any) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
