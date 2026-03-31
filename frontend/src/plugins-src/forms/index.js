import FormsManager from './FormsManager.vue'
import FormSubmissions from './FormSubmissions.vue'

export default {
  id: 'forms',
  name: 'Forms & Submissions',
  version: '1.0.0',
  components: {
    'forms': FormsManager,
    'form-submissions': FormSubmissions
  },
  initHooks() {
    // Plugin hooks registration can go here
  }
}
