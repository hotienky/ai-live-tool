export default {
  type: 'categories',
  label: 'Danh mục SP',
  icon: 'FolderOpen',
  groups: [
    {
      key: 'content',
      label: 'Nội dung',
      fields: [
        {
          key: 'title',
          type: 'text',
          label: 'Tiêu đề',
          default: 'Danh mục',
        },
        {
          key: 'selectedCategoryIds',
          type: 'categoryList',
          label: 'Chọn danh mục',
          multiple: true,
        },
        {
          key: 'showDescription',
          type: 'toggle',
          label: 'Hiện mô tả danh mục',
          default: false,
        },
        {
          key: 'showCount',
          type: 'toggle',
          label: 'Hiện số lượng SP',
          default: true,
        },
        {
          key: 'showViewAll',
          type: 'toggle',
          label: 'Hiện nút Xem tất cả',
          default: true,
        }
      ]
    },
    {
      key: 'layout',
      label: 'Bố cục',
      fields: [
        {
          key: 'layoutStyle',
          type: 'radio',
          label: 'Bố cục',
          options: [
            { value: 'grid', label: 'Lưới' },
            { value: 'carousel', label: 'Carousel' },
            { value: 'circle_icon', label: 'Icon tròn' },
            { value: 'masonry', label: 'Lưới bất đối xứng' }
          ],
          default: 'grid'
        },
        {
          key: 'columns',
          type: 'slider',
          label: 'Số cột (Desktop)',
          min: 3, max: 10, step: 1,
          default: 6
        },
        {
          key: 'tabletColumns',
          type: 'slider',
          label: 'Số cột (Tablet)',
          min: 2, max: 8, step: 1,
          default: 4
        },
        {
          key: 'mobileColumns',
          type: 'slider',
          label: 'Số cột (Mobile)',
          min: 2, max: 6, step: 1,
          default: 3
        },
        {
          key: 'gap',
          type: 'slider',
          label: 'Khoảng cách (px)',
          min: 4, max: 48, step: 2,
          default: 16
        }
      ]
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
        }
      ]
    }
  ]
}
