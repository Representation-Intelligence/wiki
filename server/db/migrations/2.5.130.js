exports.up = async knex => {
  const teamRules = [
    { id: 'team', roles: ['read:pages', 'write:pages', 'read:source', 'read:history', 'read:assets', 'write:assets'], match: 'START', deny: false, path: 'team/', locales: [] },
    { id: 'public', roles: ['read:pages', 'read:source', 'read:assets'], match: 'START', deny: false, path: 'public/', locales: [] }
  ]
  const publicRules = [{ id: 'public', roles: ['read:pages', 'read:assets'], match: 'START', deny: false, path: 'public/', locales: [] }]
  if (!await knex('groups').where('id', 4).first()) await knex('groups').insert({ id: 4, name: 'Team Members', permissions: JSON.stringify([]), pageRules: JSON.stringify([]), isSystem: false })
  await knex('groups').where('id', 2).update({ permissions: JSON.stringify(['read:pages', 'read:assets', 'read:comments']), pageRules: JSON.stringify(publicRules) })
  await knex('groups').where('id', 4).update({ permissions: JSON.stringify(['read:pages', 'read:source', 'read:history', 'read:assets', 'write:pages', 'write:assets']), pageRules: JSON.stringify(teamRules) })
  await knex('authentication').where('key', 'local').update({ selfRegistration: true, domainWhitelist: JSON.stringify(['ewo.so']), autoEnrollGroups: JSON.stringify([4]) })
}

exports.down = knex => knex('authentication').where('key', 'local').update({ selfRegistration: false, domainWhitelist: JSON.stringify([]), autoEnrollGroups: JSON.stringify([]) })
