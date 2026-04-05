export default {
  type: 'pharmacy_hero',
  label: 'Hero Banner Dược',
  icon: 'Heart',
  groups: [
    {
      key: 'content',
      label: 'Nội dung',
      fields: [
        {
          key: 'primaryText',
          type: 'text',
          label: 'Tiêu đề chính',
          default: '',
        },
        {
          key: 'searchPlaceholder',
          type: 'text',
          label: 'Placeholder thanh tìm kiếm',
          default: 'Bạn đang tìm gì hôm nay...'
        },
        {
          key: 'hotKeywords',
          type: 'textarea',
          label: 'Từ khóa hot (phân cách bằng dấu phẩy)',
          default: 'phòng ngừa tay chân miệng, khẩu trang, sữa dinh dưỡng, xem thêm'
        },
        {
          key: '_content',
          type: 'list',
          label: 'Action Cards (Các nút chức năng nhanh)',
          fields: [
            { key: 'title', type: 'text', placeholder: 'Tên chức năng (VD: Đặt đơn thuốc)' },
            { key: 'url', type: 'url', placeholder: 'Link điều hướng' },
            { key: 'icon', type: 'image', placeholder: 'URL icon (tùy chọn)' },
            { key: 'lucideIcon', type: 'text', placeholder: 'Tên Lucide Icon (VD: Pill, Heart, Stethoscope)' }
          ]
        }
      ]
    },
    {
      key: 'style',
      label: 'Phong cách',
      fields: [
        {
          key: 'desktopImage',
          type: 'image',
          label: 'Ảnh nền Desktop',
          default: ''
        },
        {
          key: 'mobileImage',
          type: 'image',
          label: 'Ảnh nền Mobile (tùy chọn)',
          default: ''
        }
      ]
    }
  ]
}
