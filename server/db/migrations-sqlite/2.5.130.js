exports.up = async knex => {
  if (!await knex('users').where('id', 1).first()) return
  let members = await knex('groups').where('name', 'Team Members').first()
  if (!members) {
    await knex('groups').insert({ name: 'Team Members', permissions: '[]', pageRules: '[]', isSystem: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    members = await knex('groups').where('name', 'Team Members').first()
  }
  const before = { groups: await knex('groups').whereIn('id', [2, members.id]), authentication: await knex('authentication').select('key', 'selfRegistration', 'domainWhitelist', 'autoEnrollGroups').where('key', 'local') }
  await knex('settings').insert({ key: 'mcpAccessBefore', value: JSON.stringify(before), updatedAt: new Date().toISOString() })
  const teamRules = [
    { id: 'team', roles: ['read:pages', 'write:pages', 'read:source', 'read:history', 'read:assets', 'write:assets'], match: 'START', deny: false, path: 'team/', locales: [] },
    { id: 'public', roles: ['read:pages', 'read:source', 'read:assets', 'write:pages', 'write:assets'], match: 'START', deny: false, path: 'public/', locales: [] }
  ]
  const publicRules = [{ id: 'public', roles: ['read:pages', 'read:assets'], match: 'START', deny: false, path: 'public/', locales: [] }]
  await knex('groups').where('id', 2).update({ permissions: JSON.stringify(['read:pages', 'read:assets', 'read:comments']), pageRules: JSON.stringify(publicRules) })
  await knex('groups').where('id', members.id).update({ permissions: JSON.stringify(['read:pages', 'read:source', 'read:history', 'read:assets', 'write:pages', 'write:assets']), pageRules: JSON.stringify(teamRules) })
  await knex('authentication').where('key', 'local').update({ selfRegistration: false, domainWhitelist: JSON.stringify({ v: ['ewo.so'] }), autoEnrollGroups: JSON.stringify({ v: [members.id] }) })
}

exports.down = async knex => {
  const row = await knex('settings').where('key', 'mcpAccessBefore').first()
  if (!row) return
  const before = typeof row.value === 'string' ? JSON.parse(row.value) : row.value
  for (const group of before.groups) await knex('groups').where('id', group.id).update({ permissions: typeof group.permissions === 'string' ? group.permissions : JSON.stringify(group.permissions), pageRules: typeof group.pageRules === 'string' ? group.pageRules : JSON.stringify(group.pageRules) })
  for (const auth of before.authentication) await knex('authentication').where('key', auth.key).update({ selfRegistration: auth.selfRegistration, domainWhitelist: typeof auth.domainWhitelist === 'string' ? auth.domainWhitelist : JSON.stringify(auth.domainWhitelist), autoEnrollGroups: typeof auth.autoEnrollGroups === 'string' ? auth.autoEnrollGroups : JSON.stringify(auth.autoEnrollGroups) })
}
