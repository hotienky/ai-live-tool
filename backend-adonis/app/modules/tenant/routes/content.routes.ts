import router from '@adonisjs/core/services/router'

const CmsPagesController = () => import('#controllers/cms_pages_controller')
const BannersController = () => import('#controllers/banners_controller')
const NavLinksController = () => import('#controllers/nav_links_controller')

/**
 * Content routes — CMS Pages, Banners, Nav Links
 */
export function registerContentRoutes(group: ReturnType<typeof router.group>) {
  // CMS Pages
  group.get('/cms-pages', [CmsPagesController, 'index'])
  group.post('/cms-pages', [CmsPagesController, 'store'])
  group.get('/cms-pages/:id', [CmsPagesController, 'show'])
  group.put('/cms-pages/:id', [CmsPagesController, 'update'])
  group.delete('/cms-pages/:id', [CmsPagesController, 'destroy'])

  // Banners
  group.get('/banners', [BannersController, 'index'])
  group.post('/banners', [BannersController, 'store'])
  group.put('/banners/:id', [BannersController, 'update'])
  group.delete('/banners/:id', [BannersController, 'destroy'])

  // Nav Links
  group.get('/nav-links', [NavLinksController, 'index'])
  group.get('/nav-links/flat', [NavLinksController, 'flat'])
  group.post('/nav-links', [NavLinksController, 'store'])
  group.put('/nav-links/:id', [NavLinksController, 'update'])
  group.delete('/nav-links/:id', [NavLinksController, 'destroy'])
  group.post('/nav-links/reorder', [NavLinksController, 'reorder'])
}
