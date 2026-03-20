/**
 * System Config Schema
 * Định nghĩa toàn bộ nhóm cấu hình, loại dịch vụ, và các fields cần nhập.
 * Backend vẫn lưu theo key/value — file này chỉ là metadata cho UI.
 */

export const CONFIG_SCHEMA = {

  // ─── EMAIL ───────────────────────────────────────────────────────────────────
  mail: {
    label: 'Email',
    icon: 'Mail',
    description: 'Cấu hình dịch vụ gửi email thông báo đơn hàng, xác nhận tài khoản...',
    driverKey: 'mail_driver',         // key DB lưu loại dịch vụ đang dùng
    services: {
      smtp: {
        label: 'SMTP',
        description: 'Dùng máy chủ SMTP bất kỳ: Gmail, Outlook, Zoho...',
        fields: [
          {
            key: 'mail_host',
            label: 'SMTP Host',
            type: 'text',
            required: true,
            placeholder: 'smtp.gmail.com',
            description: 'Địa chỉ máy chủ SMTP của nhà cung cấp email',
          },
          {
            key: 'mail_port',
            label: 'Port',
            type: 'number',
            required: true,
            placeholder: '587',
            description: 'Cổng kết nối. Thường dùng 587 (TLS) hoặc 465 (SSL)',
          },
          {
            key: 'mail_encryption',
            label: 'Mã hoá',
            type: 'select',
            required: true,
            options: ['tls', 'ssl', 'none'],
            description: 'Giao thức mã hoá kết nối tới máy chủ SMTP',
          },
          {
            key: 'mail_username',
            label: 'Tài khoản (Username)',
            type: 'text',
            required: true,
            placeholder: 'your@gmail.com',
            description: 'Email dùng để đăng nhập vào máy chủ SMTP',
          },
          {
            key: 'mail_password',
            label: 'Mật khẩu (Password)',
            type: 'password',
            required: true,
            placeholder: '••••••••',
            description: 'Mật khẩu SMTP. Với Gmail hãy dùng "App Password" thay vì mật khẩu thường',
          },
          {
            key: 'mail_from_address',
            label: 'Email người gửi',
            type: 'text',
            required: true,
            placeholder: 'noreply@yourdomain.com',
            description: 'Địa chỉ email hiển thị trong ô "Từ:" khi khách nhận email',
          },
          {
            key: 'mail_from_name',
            label: 'Tên người gửi',
            type: 'text',
            required: false,
            placeholder: 'Tên shop của bạn',
            description: 'Tên hiển thị trong ô "Từ:" bên cạnh địa chỉ email',
          },
        ],
      },
      ses: {
        label: 'Amazon SES',
        description: 'Dịch vụ gửi email của Amazon — phù hợp volume lớn, chi phí thấp',
        fields: [
          {
            key: 'mail_ses_key',
            label: 'Access Key ID',
            type: 'text',
            required: true,
            placeholder: 'AKIAIOSFODNN7EXAMPLE',
            description: 'AWS Access Key ID từ IAM Console',
          },
          {
            key: 'mail_ses_secret',
            label: 'Secret Access Key',
            type: 'password',
            required: true,
            placeholder: '••••••••',
            description: 'AWS Secret Access Key tương ứng với Access Key ID trên',
          },
          {
            key: 'mail_ses_region',
            label: 'Region',
            type: 'select',
            required: true,
            options: ['us-east-1', 'us-west-2', 'ap-southeast-1', 'eu-west-1'],
            description: 'AWS region nơi SES của bạn được kích hoạt. Chọn "ap-southeast-1" nếu dùng Singapore',
          },
          {
            key: 'mail_from_address',
            label: 'Email người gửi (đã verify)',
            type: 'text',
            required: true,
            placeholder: 'noreply@yourdomain.com',
            description: 'Email này phải được verify trong AWS SES trước khi dùng',
          },
          {
            key: 'mail_from_name',
            label: 'Tên người gửi',
            type: 'text',
            required: false,
            placeholder: 'Tên shop của bạn',
            description: 'Tên hiển thị trong ô "Từ:" bên cạnh địa chỉ email',
          },
        ],
      },
      mailgun: {
        label: 'Mailgun',
        description: 'Dịch vụ email API dành cho developer — độ tin cậy cao',
        fields: [
          {
            key: 'mail_mailgun_domain',
            label: 'Domain',
            type: 'text',
            required: true,
            placeholder: 'mg.yourdomain.com',
            description: 'Domain đã thêm và verify trên Mailgun dashboard',
          },
          {
            key: 'mail_mailgun_secret',
            label: 'API Key',
            type: 'password',
            required: true,
            placeholder: 'key-••••••••',
            description: 'Private API Key lấy từ Mailgun dashboard → Settings → API Keys',
          },
          {
            key: 'mail_mailgun_endpoint',
            label: 'Endpoint',
            type: 'select',
            required: false,
            options: ['api.mailgun.net', 'api.eu.mailgun.net'],
            description: 'Dùng "api.eu.mailgun.net" nếu domain đăng ký ở EU region',
          },
          {
            key: 'mail_from_address',
            label: 'Email người gửi',
            type: 'text',
            required: true,
            placeholder: 'noreply@yourdomain.com',
            description: 'Địa chỉ email hiển thị trong ô "Từ:"',
          },
          {
            key: 'mail_from_name',
            label: 'Tên người gửi',
            type: 'text',
            required: false,
            placeholder: 'Tên shop của bạn',
            description: 'Tên hiển thị trong ô "Từ:" bên cạnh địa chỉ email',
          },
        ],
      },
      sendgrid: {
        label: 'SendGrid',
        description: 'Dịch vụ email phổ biến, hỗ trợ tracking và analytics',
        fields: [
          {
            key: 'mail_sendgrid_api_key',
            label: 'API Key',
            type: 'password',
            required: true,
            placeholder: 'SG.••••••••',
            description: 'API Key tạo từ SendGrid dashboard → Settings → API Keys. Cần quyền "Mail Send"',
          },
          {
            key: 'mail_from_address',
            label: 'Email người gửi (đã verify)',
            type: 'text',
            required: true,
            placeholder: 'noreply@yourdomain.com',
            description: 'Email phải được xác minh trong SendGrid (Sender Authentication)',
          },
          {
            key: 'mail_from_name',
            label: 'Tên người gửi',
            type: 'text',
            required: false,
            placeholder: 'Tên shop của bạn',
            description: 'Tên hiển thị trong ô "Từ:"',
          },
        ],
      },
      log: {
        label: 'Log (Môi trường dev)',
        description: 'Không gửi email thật — chỉ ghi vào file log. Dùng khi phát triển / test',
        fields: [],
      },
    },
  },


  // ─── SMS ─────────────────────────────────────────────────────────────────────
  sms: {
    label: 'SMS / OTP',
    icon: 'MessageSquare',
    description: 'Gửi SMS xác minh OTP, thông báo đơn hàng qua điện thoại',
    driverKey: 'sms_driver',
    services: {
      disabled: {
        label: 'Tắt SMS',
        description: 'Không gửi SMS — khách hàng sẽ không nhận thông báo qua tin nhắn',
        fields: [],
      },
      speedsms: {
        label: 'SpeedSMS',
        description: 'Nhà cung cấp SMS Việt Nam — hỗ trợ Brandname, giá cạnh tranh',
        fields: [
          {
            key: 'sms_speedsms_token',
            label: 'Access Token',
            type: 'password',
            required: true,
            placeholder: '••••••••',
            description: 'Token xác thực lấy từ SpeedSMS dashboard → Tài khoản → Access Token',
          },
          {
            key: 'sms_speedsms_sender',
            label: 'Brandname / Đầu số',
            type: 'text',
            required: true,
            placeholder: 'SHOPNAME',
            description: 'Tên Brandname đã đăng ký hoặc đầu số gửi SMS (ví dụ: FASHION VN)',
          },
        ],
      },
      esms: {
        label: 'eSMS',
        description: 'Dịch vụ SMS Việt Nam — hỗ trợ OTP, chăm sóc khách hàng',
        fields: [
          {
            key: 'sms_esms_api_key',
            label: 'API Key',
            type: 'text',
            required: true,
            placeholder: '••••••••',
            description: 'API Key lấy từ trang quản trị eSMS → Tài khoản API',
          },
          {
            key: 'sms_esms_api_secret',
            label: 'API Secret',
            type: 'password',
            required: true,
            placeholder: '••••••••',
            description: 'API Secret tương ứng với API Key',
          },
          {
            key: 'sms_esms_brand_name',
            label: 'Brandname',
            type: 'text',
            required: true,
            placeholder: 'SHOPNAME',
            description: 'Tên Brandname đã đăng ký với nhà mạng qua eSMS',
          },
        ],
      },
      twilio: {
        label: 'Twilio',
        description: 'Nền tảng SMS quốc tế — hỗ trợ SMS toàn cầu',
        fields: [
          {
            key: 'sms_twilio_sid',
            label: 'Account SID',
            type: 'text',
            required: true,
            placeholder: 'ACxxxxxxxxxxxxxxxx',
            description: 'Account SID lấy từ Twilio Console dashboard',
          },
          {
            key: 'sms_twilio_token',
            label: 'Auth Token',
            type: 'password',
            required: true,
            placeholder: '••••••••',
            description: 'Auth Token lấy từ Twilio Console dashboard (cạnh Account SID)',
          },
          {
            key: 'sms_twilio_from',
            label: 'Số điện thoại gửi',
            type: 'text',
            required: true,
            placeholder: '+84xxxxxxxxx',
            description: 'Số Twilio đã mua — phải ở định dạng quốc tế có dấu +',
          },
        ],
      },
    },
  },
}

/**
 * Trả về danh sách tên service keys cho một group
 * @param {string} group - 'mail' | 'cache' | 'queue' | 'sms'
 * @returns {string[]}
 */
export function getServiceKeys(group) {
  return Object.keys(CONFIG_SCHEMA[group]?.services ?? {})
}

/**
 * Trả về tất cả field keys của một service
 * @param {string} group
 * @param {string} serviceKey
 * @returns {string[]}
 */
export function getFieldKeys(group, serviceKey) {
  return (CONFIG_SCHEMA[group]?.services[serviceKey]?.fields ?? []).map(f => f.key)
}

/**
 * Tự động nhận diện service đang dùng dựa vào giá trị driver key trong DB
 * @param {string} group
 * @param {Object} dbValues - { [key]: value } từ API
 * @returns {string} serviceKey
 */
export function detectCurrentService(group, dbValues) {
  const schema = CONFIG_SCHEMA[group]
  if (!schema) return null
  const driver = dbValues[schema.driverKey]
  if (driver && schema.services[driver]) return driver
  // fallback: service đầu tiên
  return Object.keys(schema.services)[0]
}
