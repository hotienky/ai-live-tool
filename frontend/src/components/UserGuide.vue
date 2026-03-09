<template>
  <div class="guide">
    <!-- Hero -->
    <div class="guide-hero">
      <h1 class="guide-hero__title">
        <BookOpen :size="28" /> Hướng Dẫn Sử Dụng AI Live Tool
      </h1>
      <p class="guide-hero__desc">
        Nền tảng quản lý livestream thương mại toàn diện — từ theo dõi bình
        luận, phân loại khách hàng, đến quản lý đơn hàng và vận chuyển.
      </p>
    </div>

    <!-- Table of Contents -->
    <nav class="guide-toc">
      <h3 class="guide-toc__title"><List :size="16" /> Mục lục</h3>
      <div class="guide-toc__grid">
        <button
          v-for="s in sections"
          :key="s.id"
          class="guide-toc__item"
          @click="scrollTo(s.id)"
        >
          <component :is="s.icon" :size="16" />
          <span>{{ s.label }}</span>
        </button>
      </div>
    </nav>

    <!-- Workflow Overview -->
    <div class="guide-section guide-section--workflow">
      <h2 class="guide-section__title">
        <GitBranch :size="20" /> Luồng Làm Việc Chính
      </h2>
      <div class="guide-workflow">
        <div
          v-for="(step, i) in workflowSteps"
          :key="i"
          class="guide-workflow__step"
          @click="scrollTo(step.target)"
        >
          <div class="guide-workflow__icon">
            <component :is="step.icon" :size="18" />
          </div>
          <div class="guide-workflow__info">
            <span class="guide-workflow__name">{{ step.name }}</span>
            <span class="guide-workflow__desc">{{ step.desc }}</span>
          </div>
          <ChevronRight
            v-if="i < workflowSteps.length - 1"
            :size="14"
            class="guide-workflow__arrow"
          />
        </div>
      </div>
    </div>

    <!-- Feature Sections -->
    <div v-for="s in sections" :key="s.id" :id="s.id" class="guide-section">
      <div class="guide-section__header">
        <h2 class="guide-section__title">
          <component :is="s.icon" :size="20" /> {{ s.label }}
        </h2>
        <button
          class="guide-section__nav-btn"
          @click="$emit('navigate', s.navKey)"
          v-if="s.navKey"
        >
          <ExternalLink :size="13" /> Mở trang
        </button>
      </div>

      <p class="guide-section__desc">{{ s.description }}</p>

      <!-- Features List -->
      <div class="guide-features">
        <h4><Zap :size="14" /> Chức năng chính</h4>
        <ul>
          <li v-for="f in s.features" :key="f">{{ f }}</li>
        </ul>
      </div>

      <!-- Steps -->
      <div class="guide-steps">
        <h4><ListOrdered :size="14" /> Các bước sử dụng</h4>
        <ol>
          <li v-for="st in s.steps" :key="st">{{ st }}</li>
        </ol>
      </div>

      <!-- Screenshots -->
      <div class="guide-media" v-if="s.screenshots?.length">
        <h4><Image :size="14" /> Minh họa</h4>
        <div class="guide-gallery">
          <div
            v-for="(img, idx) in s.screenshots"
            :key="idx"
            class="guide-gallery__item"
            @click="openLightbox(img)"
          >
            <img :src="img.src" :alt="img.alt" loading="lazy" />
            <span class="guide-gallery__caption">{{ img.alt }}</span>
          </div>
        </div>
      </div>

      <!-- Video -->
      <div class="guide-media" v-if="s.video">
        <h4><Play :size="14" /> Video Demo</h4>
        <div class="guide-video">
          <img :src="s.video" alt="Video demo" class="guide-video__player" />
        </div>
      </div>
    </div>

    <!-- Lightbox -->
    <Teleport to="body">
      <div
        class="guide-lightbox"
        v-if="lightboxImg"
        @click="lightboxImg = null"
      >
        <img :src="lightboxImg.src" :alt="lightboxImg.alt" />
        <p class="guide-lightbox__caption">{{ lightboxImg.alt }}</p>
        <button class="guide-lightbox__close"><X :size="20" /></button>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref } from "vue";
import {
  BookOpen,
  List,
  GitBranch,
  ChevronRight,
  ExternalLink,
  Zap,
  ListOrdered,
  Image,
  Play,
  X,
  LayoutDashboard,
  Users,
  ShoppingCart,
  Warehouse,
  Truck,
  Radio,
  BarChart2,
  Settings,
  MonitorPlay,
  Gift,
  FileText,
  Keyboard,
  Bell,
  History,
  Sun,
  MessageSquare,
} from "lucide-vue-next";

const emit = defineEmits(["navigate"]);
const lightboxImg = ref(null);

function openLightbox(img) {
  lightboxImg.value = img;
}
function scrollTo(id) {
  document
    .getElementById(id)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

const workflowSteps = [
  {
    icon: Settings,
    name: "Cài đặt",
    desc: "Cấu hình shop & sản phẩm",
    target: "settings",
  },
  {
    icon: Radio,
    name: "Lên lịch",
    desc: "Lên lịch livestream",
    target: "schedule",
  },
  {
    icon: MonitorPlay,
    name: "Live",
    desc: "Bắt đầu buổi live",
    target: "dashboard",
  },
  { icon: Users, name: "CRM", desc: "Quản lý khách hàng", target: "crm" },
  { icon: ShoppingCart, name: "Đơn hàng", desc: "Tạo đơn", target: "orders" },
  { icon: Truck, name: "Vận chuyển", desc: "Giao hàng", target: "shipping" },
  { icon: BarChart2, name: "Báo cáo", desc: "Phân tích", target: "reports" },
];

const sections = [
  {
    id: "live-monitor",
    label: "Live Monitor — Theo dõi Livestream",
    icon: MonitorPlay,
    navKey: "live",
    description:
      "Trang chính của ứng dụng — theo dõi bình luận livestream realtime, phân loại khách hàng tiềm năng bằng AI, và tương tác trực tiếp.",
    features: [
      "Lead Panel: Hiển thị danh sách khách tiềm năng, phân loại HOT/WARM/COLD bằng AI",
      "Chat Stream: Dòng bình luận realtime với highlight từ khóa và tag sentiment",
      "Stats Bar: Tổng comments, HOT leads, conversion rate cập nhật liên tục",
      "Sentiment Gauge: Biểu đồ cảm xúc tổng thể (tích cực/tiêu cực)",
      "Smart Pricing: Gợi ý giá thông minh dựa trên ý kiến khách hàng",
      "Quick Reply: Trả lời nhanh bình luận ngay trên live",
      "TTS (Text-to-Speech): Đọc bình luận HOT bằng giọng nói",
    ],
    steps: [
      "Chọn Shop từ dropdown ở header",
      'Click \"Phiên Live\" → kết nối TikTok Live hoặc chạy Mock Data',
      "Bình luận sẽ hiện lên realtime ở Chat Stream bên phải",
      "AI tự động phân loại lead → hiển thị ở Lead Panel bên trái",
      "Click vào lead để xem chi tiết khách hàng",
      "Sử dụng nút TTS, Export, Biểu đồ trên thanh controls",
      "Nút FAB góc dưới phải: Lucky Draw, Script Prompter, Thông báo",
    ],
    screenshots: [
      {
        src: "/guide-assets/live_monitor.png",
        alt: "Live Monitor — Lead Panel + Chat Stream + Sentiment",
      },
    ],
    video: "/guide-assets/demo_live_monitor.webp",
  },
  {
    id: "replay",
    label: "Session Replay — Phát lại phiên Live",
    icon: History,
    navKey: "replay",
    description:
      "Xem lại các phiên livestream đã kết thúc, bao gồm bình luận, thống kê và phân tích AI.",
    features: [
      "Danh sách phiên: Chọn phiên live đã hoàn thành để xem lại",
      "Replay bình luận: Hiển thị lại dòng chat theo timeline",
      "AI Analysis: Tóm tắt phiên live — số lead, sentiment, urgent comments",
      "Thống kê phiên: Thời lượng, tổng comments, peak viewers",
    ],
    steps: [
      "Vào Replay từ navigation",
      "Chọn Shop (nếu chưa chọn)",
      "Chọn phiên live từ dropdown",
      "Xem lại timeline bình luận và thống kê",
      "Xem AI Analysis summary cho phiên",
    ],
    screenshots: [
      {
        src: "/guide-assets/replay.png",
        alt: "Session Replay — Chọn phiên và xem lại",
      },
    ],
  },
  {
    id: "lucky-draw",
    label: "Lucky Draw — Quay số trúng thưởng",
    icon: Gift,
    description:
      "Tính năng mini-game trong livestream: quay số trúng thưởng ngẫu nhiên từ những người bình luận đúng từ khóa.",
    features: [
      "Keyword filter: Chỉ chọn người bình luận chứa từ khóa nhất định",
      "Số người trúng: Cấu hình số lượng người chiến thắng",
      "Timer: Đếm ngược thời gian tham gia",
      "Random pick: Quay số ngẫu nhiên công bằng",
    ],
    steps: [
      "Trong Live Monitor → click nút 🎁 (Gift) ở FAB góc dưới phải",
      "Panel Lucky Draw mở ra bên phải",
      'Nhập từ khóa (VD: \"free\", \"mua\")',
      "Chọn số người trúng thưởng",
      "Đặt thời gian (giây)",
      'Click \"Bắt đầu\" → hệ thống tự quay số',
      "Kết quả hiển thị danh sách người thắng",
    ],
    screenshots: [
      {
        src: "/guide-assets/lucky_draw.png",
        alt: "Lucky Draw — Panel quay số trúng thưởng",
      },
    ],
  },
  {
    id: "script-prompter",
    label: "Script Prompter — Kịch bản Live",
    icon: FileText,
    description:
      "Teleprompter giúp người dẫn live theo dõi kịch bản đã chuẩn bị sẵn, cuộn tự động với tốc độ tùy chỉnh.",
    features: [
      "Hiển thị kịch bản: Text lớn dễ đọc khi đang live",
      "Cuộn tự động: Auto-scroll với tốc độ tùy chỉnh",
      "Floating panel: Không che chat stream, có thể di chuyển",
    ],
    steps: [
      "Trong Live Monitor → click nút 📄 (Script) ở FAB góc dưới phải",
      "Panel Script Prompter mở ra",
      "Nội dung kịch bản tự load từ lịch (nếu có)",
      "Hoặc nhập kịch bản trực tiếp",
      "Bật auto-scroll và điều chỉnh tốc độ",
      "Đóng panel khi không cần",
    ],
    screenshots: [
      {
        src: "/guide-assets/script_prompter.png",
        alt: "Script Prompter — Kịch bản teleprompter",
      },
    ],
  },
  {
    id: "shortcuts",
    label: "Phím tắt — Keyboard Shortcuts",
    icon: Keyboard,
    description:
      "Hệ thống phím tắt giúp thao tác nhanh trong ứng dụng mà không cần dùng chuột.",
    features: [
      "Ctrl+1 đến Ctrl+7: Chuyển nhanh giữa các tab",
      "Ctrl+K: Mở tìm kiếm bình luận",
      "Ctrl+M: Bắt đầu Mock Data",
      "Escape: Đóng tất cả modal/panel",
      "?: Hiển thị bảng phím tắt",
    ],
    steps: [
      "Nhấn ? (dấu hỏi) trên bàn phím → mở bảng phím tắt",
      "Sử dụng Ctrl + số (1-7) để chuyển nhanh giữa các trang",
      "Ctrl+K để tìm kiếm trong chat stream",
      "Escape để đóng bất kỳ modal/panel nào",
      "Nhấn ? lần nữa hoặc Escape để đóng bảng phím tắt",
    ],
    screenshots: [
      {
        src: "/guide-assets/shortcuts.png",
        alt: "Keyboard Shortcuts — Bảng phím tắt",
      },
    ],
  },
  {
    id: "notifications-theme",
    label: "Thông báo & Giao diện",
    icon: Bell,
    description:
      "Hệ thống thông báo realtime cho HOT leads và keyword matches, cùng chế độ Dark/Light/System.",
    features: [
      "HOT Lead Alert: Thông báo browser khi có lead HOT mới",
      "Keyword Match: Cảnh báo khi bình luận chứa từ khóa",
      "Notification Bell: Xem lịch sử thông báo",
      "Dark Mode: Giao diện tối, dễ nhìn ban đêm",
      "Light Mode: Giao diện sáng, rõ ràng ban ngày",
      "System Mode: Tự động theo cài đặt hệ điều hành",
    ],
    steps: [
      "Thông báo: Click 🔔 trên header để xem notification center",
      "Bật/tắt thông báo browser: Click nút chuông ở FAB trong Live Monitor",
      "Giao diện: Click nút ☀️/🌙 trên header để chuyển theme",
      "3 chế độ: Light → Dark → System (xoay vòng mỗi lần click)",
      "Tùy chỉnh accent color: Vào Settings → tab Giao diện",
    ],
  },
  {
    id: "dashboard",
    label: "Dashboard — Tổng quan",
    icon: LayoutDashboard,
    navKey: "dashboard",
    description:
      "Trang Dashboard hiển thị tổng quan hoạt động kinh doanh từ livestream với các chỉ số quan trọng, biểu đồ và danh sách khách hàng.",
    features: [
      "Thống kê nhanh: Số Leads, Comments, Conversion Rate hôm nay",
      "Biểu đồ: Xu hướng engagement theo ngày, tỷ lệ nền tảng",
      "Leads mới nhất: Danh sách khách tiềm năng gần đây",
      "Top khách hàng: Xếp hạng khách tương tác nhiều nhất",
    ],
    steps: [
      "Đăng nhập → hệ thống tự chuyển đến Dashboard",
      "Xem thống kê qua các card số liệu ở trên cùng",
      "Cuộn xuống xem biểu đồ engagement và conversion funnel",
      "Xem danh sách Leads mới nhất và Top khách hàng",
      "Click vào lead để chuyển sang chi tiết trong CRM",
    ],
    screenshots: [
      {
        src: "/guide-assets/dashboard.png",
        alt: "Dashboard — Stats cards và leads mới nhất",
      },
      {
        src: "/guide-assets/dashboard_2.png",
        alt: "Dashboard — Top khách hàng",
      },
    ],
    video: "/guide-assets/demo_dashboard.webp",
  },
  {
    id: "crm",
    label: "CRM — Quản lý khách hàng",
    icon: Users,
    navKey: "crm",
    description:
      "Bảng Kanban pipeline để quản lý leads theo trạng thái, xem chi tiết khách hàng và tạo đơn nhanh.",
    features: [
      "Kanban Board: Kéo thả leads giữa các cột (New → Contacting → Closed → Ignored)",
      "Chi tiết lead: Xem thông tin khách, lịch sử comment, sản phẩm quan tâm",
      "Tạo đơn nhanh: Chọn sản phẩm → tạo đơn trực tiếp từ lead",
      "Ghi chú nhân viên: Thêm note cho từng khách hàng",
    ],
    steps: [
      "Vào CRM từ navigation bar",
      "Xem tổng quan pipeline với các cột trạng thái",
      "Click vào card lead → mở modal chi tiết",
      "Xem thông tin khách, lịch sử comment, sản phẩm quan tâm",
      "Kéo thả card giữa các cột để chuyển trạng thái",
      'Click "Tạo đơn" → chọn sản phẩm → xác nhận → đơn tự tạo',
    ],
    screenshots: [
      { src: "/guide-assets/crm.png", alt: "CRM — Kanban Pipeline Board" },
      { src: "/guide-assets/crm_detail.png", alt: "CRM — Chi tiết Lead" },
      {
        src: "/guide-assets/crm_order.png",
        alt: "CRM — Tạo đơn từ lead với sản phẩm",
      },
    ],
    video: "/guide-assets/demo_crm.webp",
  },
  {
    id: "orders",
    label: "Orders — Quản lý đơn hàng",
    icon: ShoppingCart,
    navKey: "orders",
    description:
      "Quản lý toàn bộ đơn hàng, từ tạo đơn, xem chi tiết invoice đến cập nhật trạng thái.",
    features: [
      "Thống kê: Tổng đơn, doanh thu, thanh toán, tỷ lệ giao hàng",
      "Danh sách đơn: Bảng hiển thị trạng thái, khách hàng, tổng tiền",
      "Tạo đơn mới: Form nhập thông tin khách + chọn sản phẩm + tự tính tổng",
      "Invoice Preview: Xem hóa đơn chi tiết trước khi in",
    ],
    steps: [
      "Vào Orders từ navigation",
      "Xem thống kê qua 4 card (Tổng đơn, Revenue, Paid, Delivery Rate)",
      'Click "Tạo vận đơn mới" → nhập tên, SĐT, địa chỉ',
      "Chọn sản phẩm và số lượng → tổng tiền tự tính",
      "Xác nhận tạo đơn → đơn xuất hiện trong danh sách",
      "Click vào đơn → xem Invoice Preview chi tiết",
    ],
    screenshots: [
      {
        src: "/guide-assets/orders.png",
        alt: "Orders — Danh sách đơn và thống kê",
      },
      {
        src: "/guide-assets/orders_create.png",
        alt: "Orders — Form tạo đơn mới",
      },
      {
        src: "/guide-assets/orders_invoice.png",
        alt: "Orders — Invoice Preview",
      },
    ],
    video: "/guide-assets/demo_orders.webp",
  },
  {
    id: "inventory",
    label: "Kho — Quản lý tồn kho",
    icon: Warehouse,
    navKey: "inventory",
    description:
      "Quản lý sản phẩm và tồn kho với chức năng tìm kiếm realtime và điều chỉnh số lượng.",
    features: [
      "Danh sách sản phẩm: Tên, SKU, giá, tồn kho hiện tại, danh mục",
      "Tìm kiếm realtime: Filter sản phẩm theo tên hoặc mã SKU",
      "Điều chỉnh kho: Thêm (+) / bớt (-) tồn kho với lý do ghi nhận",
      "Thống kê: Tổng sản phẩm, tổng tồn kho, cảnh báo hết hàng",
    ],
    steps: [
      "Vào Kho từ navigation",
      "Xem danh sách sản phẩm với tồn kho hiện tại",
      "Gõ tên/mã sản phẩm vào ô tìm kiếm → lọc realtime",
      'Click "Điều chỉnh kho" trên sản phẩm cần thay đổi',
      "Chọn loại (Nhập thêm / Xuất bớt), nhập số lượng và lý do",
      'Click "Xác nhận" → tồn kho cập nhật ngay lập tức',
    ],
    screenshots: [
      { src: "/guide-assets/inventory.png", alt: "Kho — Danh sách sản phẩm" },
      {
        src: "/guide-assets/inventory_adjust.png",
        alt: "Kho — Điều chỉnh kho",
      },
    ],
    video: "/guide-assets/demo_inventory.webp",
  },
  {
    id: "shipping",
    label: "Ship — Quản lý vận chuyển",
    icon: Truck,
    navKey: "shipping",
    description:
      "Quản lý vận đơn, theo dõi giao hàng và tích hợp các hãng vận chuyển.",
    features: [
      "Thống kê: Tổng vận đơn, phí ship, đang giao, đã giao, tỷ lệ thành công",
      "Danh sách vận đơn: Mã đơn, người nhận, hãng vận chuyển, trạng thái",
      "Tạo vận đơn 3 bước: Thông tin → Shipping → Xác nhận",
      "Lọc trạng thái: Draft, Waiting, In Transit, Delivered, Cancelled",
      "Track & Print: Theo dõi lộ trình và in vận đơn",
    ],
    steps: [
      "Vào Ship từ navigation",
      "Xem thống kê tổng quan qua 5 card",
      'Click "Tạo vận đơn" → Bước 1: Nhập thông tin người nhận',
      "Bước 2: Chọn hãng vận chuyển (GHN, GHTK, Viettel Post)",
      "Bước 3: Xác nhận và tạo vận đơn",
      "Lọc vận đơn theo trạng thái qua dropdown filter",
      'Click "Track" để xem lộ trình hoặc "Print" để in vận đơn',
    ],
    screenshots: [
      { src: "/guide-assets/shipping.png", alt: "Ship — Danh sách vận đơn" },
      {
        src: "/guide-assets/shipping_create.png",
        alt: "Ship — Tạo vận đơn 3 bước",
      },
    ],
    video: "/guide-assets/demo_shipping.webp",
  },
  {
    id: "schedule",
    label: "Schedule — Lên lịch Livestream",
    icon: Radio,
    navKey: "schedule",
    description:
      "Lập kế hoạch và quản lý lịch livestream với kịch bản, thời gian và nền tảng.",
    features: [
      "Card lịch: Hiển thị nền tảng, ngày giờ, thời lượng, kịch bản",
      "Tạo lịch: Form đầy đủ (tiêu đề, ngày giờ, thời lượng, nền tảng, kịch bản)",
      "Go Live: Chuyển thẳng từ lịch sang chế độ Live Monitor",
      "Hủy/Xóa lịch: Quản lý các buổi live không cần thiết",
    ],
    steps: [
      "Vào Schedule từ navigation",
      "Xem danh sách lịch đã lên (hiển thị grid card)",
      'Click "+ Lên lịch" → nhập tiêu đề (VD: "Live bán hàng 20/03")',
      "Chọn ngày giờ, thời lượng, nền tảng (TikTok/Facebook/YouTube/Shopee)",
      "Viết kịch bản/script cho buổi live",
      'Click "Tạo lịch" để lưu',
      'Khi đến giờ → click "Go Live" để bắt đầu buổi live',
    ],
    screenshots: [
      {
        src: "/guide-assets/schedule.png",
        alt: "Schedule — Cards lịch livestream",
      },
    ],
    video: "/guide-assets/demo_schedule.webp",
  },
  {
    id: "reports",
    label: "Reports — Báo cáo & Phân tích",
    icon: BarChart2,
    navKey: "reports",
    description:
      "Phân tích hiệu suất livestream với biểu đồ, conversion funnel và chức năng xuất CSV.",
    features: [
      "Metrics tổng hợp: Tổng comments, HOT leads, HOT rate, TB/ngày",
      "Biểu đồ: Comments theo ngày (bar chart)",
      "Conversion Funnel: Phễu chuyển đổi New → Contacting → Closed",
      "Bộ lọc thời gian: 7 ngày, 30 ngày, custom range",
      "Xuất CSV: Export dữ liệu để phân tích bên ngoài",
    ],
    steps: [
      "Vào Reports từ navigation",
      "Xem thống kê qua 4 card metrics",
      "Chọn khoảng thời gian (7 ngày / 30 ngày / tùy chỉnh)",
      "Xem biểu đồ bar chart hiển thị xu hướng engagement",
      "Cuộn xuống xem Conversion Funnel (New → Closed) và tỷ lệ chuyển đổi",
      'Click "Xuất CSV" để download dữ liệu',
    ],
    screenshots: [
      {
        src: "/guide-assets/reports.png",
        alt: "Reports — Thống kê và conversion funnel",
      },
    ],
  },
  {
    id: "settings",
    label: "Settings — Cài đặt hệ thống",
    icon: Settings,
    navKey: "settings",
    description:
      "Quản lý toàn bộ cấu hình shop: kết nối nền tảng, sản phẩm, keywords, auto-reply, vận chuyển, giao diện.",
    features: [
      "Kết nối: Cấu hình TikTok Live, Facebook, YouTube, Shopee",
      "Sản phẩm: Quản lý danh sách sản phẩm (tên, giá, mô tả)",
      "Keywords: Thiết lập từ khóa cảnh báo (highlight, auto-reply)",
      "Auto Reply: Tin nhắn tự động trả lời với cooldown",
      "Vận chuyển: Tích hợp GHN, GHTK, Viettel Post",
      "Giao diện: Chuyển Dark/Light mode, chọn accent color",
    ],
    steps: [
      "Vào Settings từ navigation",
      "Chọn tab từ sidebar trái (Kết nối, Sản phẩm, Keywords...)",
      "Tab Kết nối: Toggle on/off từng platform, nhập API key",
      'Tab Sản phẩm: "Thêm sản phẩm" → nhập tên, giá, mô tả',
      "Tab Keywords: Thêm từ khóa cần cảnh báo, chọn loại alert",
      "Tab Giao diện: Chuyển đổi Dark/Light mode",
    ],
    screenshots: [
      { src: "/guide-assets/settings.png", alt: "Settings — Cài đặt shop" },
    ],
  },
];
</script>

<style scoped>
.guide {
  padding: 24px 32px 80px;
  max-width: 1100px;
  margin: 0 auto;
  overflow-y: auto;
  height: calc(100vh - 100px);
}

/* ── Hero ── */
.guide-hero {
  text-align: center;
  padding: 40px 20px 32px;
  background: linear-gradient(
    135deg,
    rgba(124, 58, 237, 0.08),
    rgba(236, 72, 153, 0.06)
  );
  border: 1px solid rgba(124, 58, 237, 0.15);
  border-radius: 20px;
  margin-bottom: 28px;
}
.guide-hero__title {
  font-size: 28px;
  font-weight: 800;
  margin: 0 0 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: linear-gradient(135deg, #7c3aed, #ec4899);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.guide-hero__desc {
  font-size: 15px;
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.6;
  max-width: 600px;
  margin: 0 auto;
}

/* ── TOC ── */
.guide-toc {
  background: var(--glass-bg);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 28px;
}
.guide-toc__title {
  font-size: 15px;
  font-weight: 700;
  margin: 0 0 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--color-text-primary);
}
.guide-toc__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
}
.guide-toc__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.guide-toc__item:hover {
  border-color: rgba(124, 58, 237, 0.3);
  color: var(--color-text-primary);
  background: rgba(124, 58, 237, 0.06);
}

/* ── Workflow ── */
.guide-section--workflow {
  background: linear-gradient(
    135deg,
    rgba(124, 58, 237, 0.05),
    rgba(236, 72, 153, 0.03)
  );
  border: 1px solid rgba(124, 58, 237, 0.12);
}
.guide-workflow {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}
.guide-workflow__step {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}
.guide-workflow__step:hover {
  border-color: rgba(124, 58, 237, 0.3);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
.guide-workflow__icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(124, 58, 237, 0.1);
  color: #a78bfa;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.guide-workflow__name {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-primary);
  display: block;
}
.guide-workflow__desc {
  font-size: 11px;
  color: var(--color-text-muted);
  display: block;
}
.guide-workflow__arrow {
  color: var(--color-text-muted);
  flex-shrink: 0;
}

/* ── Section ── */
.guide-section {
  background: var(--glass-bg);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 20px;
  scroll-margin-top: 20px;
}
.guide-section__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.guide-section__title {
  font-size: 20px;
  font-weight: 800;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-primary);
}
.guide-section__nav-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border-radius: 8px;
  border: 1px solid rgba(124, 58, 237, 0.3);
  background: rgba(124, 58, 237, 0.08);
  color: #a78bfa;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.guide-section__nav-btn:hover {
  background: rgba(124, 58, 237, 0.15);
  transform: translateY(-1px);
}
.guide-section__desc {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0 0 16px;
  line-height: 1.5;
}

/* Features & Steps */
.guide-features,
.guide-steps {
  margin-bottom: 16px;
}
.guide-features h4,
.guide-steps h4,
.guide-media h4 {
  font-size: 14px;
  font-weight: 700;
  margin: 0 0 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--color-text-primary);
}
.guide-features ul,
.guide-steps ol {
  margin: 0;
  padding-left: 20px;
}
.guide-features li,
.guide-steps li {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.8;
}

/* ── Gallery ── */
.guide-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}
.guide-gallery__item {
  border: 1px solid var(--color-border);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
}
.guide-gallery__item:hover {
  border-color: rgba(124, 58, 237, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}
.guide-gallery__item img {
  width: 100%;
  height: auto;
  display: block;
}
.guide-gallery__caption {
  display: block;
  padding: 8px 12px;
  font-size: 11px;
  color: var(--color-text-muted);
  background: var(--color-bg-card);
  text-align: center;
}

/* ── Video ── */
.guide-video {
  border: 1px solid var(--color-border);
  border-radius: 12px;
  overflow: hidden;
}
.guide-video__player {
  width: 100%;
  height: auto;
  display: block;
}

/* ── Lightbox ── */
.guide-lightbox {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 40px;
  cursor: pointer;
}
.guide-lightbox img {
  max-width: 95vw;
  max-height: 80vh;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}
.guide-lightbox__caption {
  color: #fff;
  font-size: 14px;
  margin-top: 12px;
  text-align: center;
}
.guide-lightbox__close {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #fff;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}
.guide-lightbox__close:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
