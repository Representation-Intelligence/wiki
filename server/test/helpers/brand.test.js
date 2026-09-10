const resolveBrand = require('../../helpers/brand')

describe('ewo site branding', () => {
  test('replaces persisted upstream defaults without mutating saved settings', () => {
    const saved = { title: 'Wiki.js', logoUrl: 'https://static.requarks.io/logo/wikijs-butterfly.svg' }
    expect(resolveBrand(saved)).toEqual({ title: 'ewo Wiki', logoUrl: '/_assets/brand/ewo-mark-light.svg' })
    expect(saved.title).toBe('Wiki.js')
    expect(saved.logoUrl).toBe('https://static.requarks.io/logo/wikijs-butterfly.svg')
  })

  test('preserves administrator branding, including custom assets with a similar filename', () => {
    const custom = { title: 'Team handbook', logoUrl: 'https://example.com/logo-wikijs.svg' }
    expect(resolveBrand(custom)).toEqual(custom)
  })

  test('resolves the logo and title independently', () => {
    expect(resolveBrand({ title: 'Team handbook', logoUrl: '/_assets/svg/logo-wikijs.svg' })).toEqual({
      title: 'Team handbook',
      logoUrl: '/_assets/brand/ewo-mark-light.svg'
    })
    expect(resolveBrand({ title: 'Wiki.js', logoUrl: '/uploads/team.svg' })).toEqual({
      title: 'ewo Wiki',
      logoUrl: '/uploads/team.svg'
    })
  })

  test('supplies local defaults for empty settings and is idempotent', () => {
    const effective = resolveBrand({})
    expect(effective).toEqual({ title: 'ewo Wiki', logoUrl: '/_assets/brand/ewo-mark-light.svg' })
    expect(resolveBrand(effective)).toEqual(effective)
  })
})
