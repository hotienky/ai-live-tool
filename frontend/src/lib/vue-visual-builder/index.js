import { registry } from './core/registry'
import { useBuilderState } from './core/state'
import VisualBuilder from './components/VisualBuilder.vue'
import LiveCanvas from './components/LiveCanvas.vue'
import StyleControlPanel from './components/StyleControlPanel.vue'

// Tùy chọn import global CSS cho tool
// import './styles/builder.css'

/**
 * Vue Plugin Entry
 * Cho phép người dùng gọi `app.use(VueVisualBuilder)` để đăng ký component global
 */
const VueVisualBuilder = {
  install(app, options = {}) {
    app.component('VisualBuilder', VisualBuilder)
    app.component('LiveCanvas', LiveCanvas)
    app.component('StyleControlPanel', StyleControlPanel)
    
    // Nếu user pass dictionary block schemas khi install
    if (options.blocks) {
      registry.registerBlocks(options.blocks)
    }
  }
}

// Export named objects để dev tự import lẻ tẻ nếu cần
export {
  VueVisualBuilder,
  registry as BuilderRegistry,
  useBuilderState,
  VisualBuilder,
  LiveCanvas,
  StyleControlPanel
}

export default VueVisualBuilder
