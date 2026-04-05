export default {
  type: 'banner',
  label: 'Banner / Slider',
  icon: 'Image',
  groups: [
    {
      key: 'content',
      label: 'Nội dung',
      fields: [
        {
          key: '_content',
          type: 'list',
          label: 'Danh sách Slide',
          fields: [
            { key: 'image', type: 'image', placeholder: 'URL ảnh nền (Desktop / Đa năng)' },
            { key: 'title', type: 'text', placeholder: 'Tiêu đề slide' },
            { key: 'description', type: 'textarea', placeholder: 'Mô tả ngắn' },
            { key: 'url', type: 'url', placeholder: 'Đường dẫn đích (link)' }
          ]
        }
      ]
    },
    {
      key: 'layout',
      label: 'Bố cục',
      fields: [
        {
          key: 'height',
          type: 'select',
          label: 'Chiều cao',
          options: [
            { value: 'sm', label: 'Nhỏ' },
            { value: 'md', label: 'Vừa' },
            { value: 'lg', label: 'Lớn' }
          ],
          default: 'md'
        }
      ]
    },
    {
      key: 'style',
      label: 'Phong cách',
      fields: [
        {
          key: 'autoplay',
          type: 'toggle',
          label: 'Tự chuyển (Autoplay)',
          default: true
        },
        {
          key: 'interval',
          type: 'slider',
          label: 'Tốc độ chuyển (ms)',
          min: 1000,
          max: 10000,
          step: 500,
          default: 5000
        },
        {
          key: 'showOverlay',
          type: 'toggle',
          label: 'Hiện chữ trên ảnh (Overlay)',
          default: true
        }
      ]
    }
  ]
}
