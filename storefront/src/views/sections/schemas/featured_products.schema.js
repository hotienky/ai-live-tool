/**
 * Schema định nghĩa toàn bộ config cho section featured_products.
 * BlockConfigPanel đọc `groups` để render form tự động theo từng nhóm tab.
 * SectionRenderer đã xử lý: sectionBgColor, paddingTop, paddingBottom, bgImage.
 * Component xử lý: gap, titleColor, showViewAll, layoutStyle, columns.
 */
export default {
  type: 'featured_products',
  label: 'Sản phẩm nổi bật',
  icon: 'ShoppingBag',

  groups: [
    {
      key: 'content',
      label: 'Nội dung',
      fields: [
        {
          key: 'title',
          type: 'text',
          label: 'Tiêu đề section',
          placeholder: 'Sản phẩm nổi bật',
          default: 'Sản phẩm nổi bật',
        },
        {
          key: 'count',
          type: 'number',
          label: 'Số sản phẩm',
          placeholder: '8',
          default: 8,
        },
        {
          key: 'filterCategory',
          type: 'api-select',
          label: 'Lọc theo danh mục',
          endpoint: '/categories',
          placeholder: 'Tất cả danh mục',
        },
        {
          key: 'sortOrder',
          type: 'select',
          label: 'Sắp xếp theo',
          options: [
            { value: 'newest', label: 'Mới nhất' },
            { value: 'bestselling', label: 'Bán chạy nhất' },
            { value: 'price_asc', label: 'Giá tăng dần' },
            { value: 'price_desc', label: 'Giá giảm dần' },
          ],
          default: 'newest',
        },
        {
          key: 'viewAllLink',
          type: 'text',
          label: 'Link "Xem tất cả"',
          placeholder: '/products',
          default: '/products',
        },
        {
          key: 'showViewAll',
          type: 'toggle',
          label: 'Hiện nút Xem tất cả',
          default: true,
        },
      ],
    },

    {
      key: 'layout',
      label: 'Bố cục',
      fields: [
        {
          key: 'layoutStyle',
          type: 'radio',
          label: 'Kiểu hiển thị',
          options: [
            { value: 'grid', label: 'Lưới' },
            { value: 'carousel', label: 'Carousel' },
            { value: 'elegant', label: 'Elegant' },
            { value: 'minimal', label: 'Minimal' },
          ],
          default: 'grid',
        },
        {
          key: 'columns',
          type: 'slider',
          label: 'Số cột (Desktop)',
          min: 2,
          max: 6,
          step: 1,
          default: 4,
        },
        {
          key: 'tabletColumns',
          type: 'slider',
          label: 'Số cột (Tablet)',
          min: 1,
          max: 4,
          step: 1,
          default: 3,
        },
        {
          key: 'mobileColumns',
          type: 'slider',
          label: 'Số cột (Mobile)',
          min: 1,
          max: 3,
          step: 1,
          default: 2,
        },
        {
          key: 'gap',
          type: 'slider',
          label: 'Khoảng cách (px)',
          min: 4,
          max: 48,
          step: 2,
          default: 16,
        },
      ],
    },

    {
      key: 'style',
      label: 'Phong cách',
      fields: [
        {
          key: 'sectionBgColor',
          type: 'color',
          label: 'Màu nền section',
          default: '',
        },
        {
          key: 'titleColor',
          type: 'color',
          label: 'Màu tiêu đề',
          default: '',
        },
        {
          key: 'bgImage',
          type: 'image',
          label: 'Ảnh nền section',
          placeholder: 'https://...',
          default: '',
        },
        {
          key: 'paddingTop',
          type: 'number',
          label: 'Padding trên (px)',
          default: 48,
        },
        {
          key: 'paddingBottom',
          type: 'number',
          label: 'Padding dưới (px)',
          default: 48,
        },
      ],
    },
  ],
}
