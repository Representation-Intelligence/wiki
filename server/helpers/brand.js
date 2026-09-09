/**
 * Resolve upstream defaults without overwriting an administrator's own branding.
 * Applied in memory so an image rollback can still read the original settings.
 * @param {{title?: string, logoUrl?: string}} config Site configuration
 * @returns {{title: string, logoUrl: string}} Effective site branding
 */
module.exports = function resolveBrand (config) {
  const upstreamLogos = [
    'https://static.requarks.io/logo/wikijs-butterfly.svg',
    '/_assets/svg/logo-wikijs.svg',
    '/_assets/svg/logo-wikijs-full.svg'
  ]
  return {
    title: !config.title || config.title === 'Wiki.js' ? 'ewo Wiki' : config.title,
    logoUrl: !config.logoUrl || upstreamLogos.includes(config.logoUrl) ?
      '/_assets/brand/ewo-mark-light.svg' :
      config.logoUrl
  }
}
