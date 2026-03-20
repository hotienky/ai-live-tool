<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Events\Tenant\SettingsChanged;
use App\Repositories\SystemConfig\SystemConfigRepositoryInterface;
use App\Traits\ApiResponse;
use App\Traits\LogsActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Symfony\Component\Mailer\Transport\Smtp\EsmtpTransport;

class SystemConfigController extends Controller
{
    use ApiResponse, LogsActivity;

    public function __construct(private SystemConfigRepositoryInterface $repo) {}

    public function index()
    {
        $group = request()->input('group');
        return $this->successResponse($this->repo->getAll($group));
    }

    public function store(Request $request)
    {
        try {
            $items  = $request->input('items', []);
            $userId = $request->attributes->get('auth_user')->id ?? 0;

            $this->repo->upsertItems($items);
            $this->logActivity('settings.updated', 'system_config', null, ['count' => count($items)]);

            // Thông báo: cấu hình thay đổi
            $changedKeys = array_column($items, 'key');
            if (!empty($changedKeys)) {
                event(new SettingsChanged('general', $changedKeys, $userId));
            }

            return $this->successResponse(null, 'Config saved');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function showGroup($group)
    {
        return $this->successResponse($this->repo->getByGroup($group));
    }

    public function updateGroup(Request $request, $group)
    {
        try {
            $items  = $request->input('items', []);
            $userId = $request->attributes->get('auth_user')->id ?? 0;

            $this->repo->updateGroup($group, $items);
            $this->logActivity('settings.updated', 'system_config', null, ['group' => $group]);

            // Thông báo: cấu hình nhóm thay đổi
            $changedKeys = array_column($items, 'key');
            if (!empty($changedKeys)) {
                event(new SettingsChanged($group, $changedKeys, $userId));
            }

            return $this->successResponse(null, 'Config updated');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    /**
     * Test kết nối email với thông tin gửi lên (chưa cần lưu vào DB).
     * Hỗ trợ: smtp, ses, mailgun, sendgrid
     */
    public function testMail(Request $request)
    {
        $driver = $request->input('mail_driver', 'smtp');
        $to     = $request->input('test_email');

        if (!$to) {
            return $this->errorResponse('Vui lòng cung cấp địa chỉ email nhận thử');
        }

        try {
            if ($driver === 'smtp') {
                $host       = $request->input('mail_host');
                $port       = (int) $request->input('mail_port', 587);
                $encryption = $request->input('mail_encryption', 'tls');
                $username   = $request->input('mail_username');
                $password   = $request->input('mail_password');
                $fromAddr   = $request->input('mail_from_address', $username);
                $fromName   = $request->input('mail_from_name', 'System Test');

                if (!$host || !$username || !$password) {
                    return $this->errorResponse('Thiếu thông tin: host, username hoặc password');
                }

                // Tạo transport tạm với thông tin từ request
                $tls       = $encryption === 'ssl';
                $transport = new EsmtpTransport($host, $port, $tls);
                $transport->setUsername($username);
                $transport->setPassword($password);

                $mailer  = new \Symfony\Component\Mailer\Mailer($transport);
                $message = (new \Symfony\Component\Mime\Email())
                    ->from(new \Symfony\Component\Mime\Address($fromAddr, $fromName))
                    ->to($to)
                    ->subject('[Test] Kết nối SMTP thành công')
                    ->html('<p>Email test từ hệ thống. Nếu bạn nhận được email này, cấu hình SMTP đã hoạt động đúng.</p>');

                $mailer->send($message);

                return $this->successResponse(null, "Đã gửi email test tới {$to}. Vui lòng kiểm tra hộp thư.");
            }

            if ($driver === 'ses') {
                // Kiểm tra credentials bằng SES SendEmail API
                $key    = $request->input('mail_ses_key');
                $secret = $request->input('mail_ses_secret');
                $region = $request->input('mail_ses_region', 'ap-southeast-1');
                $from   = $request->input('mail_from_address');

                if (!$key || !$secret || !$from) {
                    return $this->errorResponse('Thiếu thông tin: Access Key, Secret Key hoặc From Email');
                }

                $client = new \Aws\Ses\SesClient([
                    'region'      => $region,
                    'version'     => 'latest',
                    'credentials' => ['key' => $key, 'secret' => $secret],
                ]);

                $client->sendEmail([
                    'Source'      => $from,
                    'Destination' => ['ToAddresses' => [$to]],
                    'Message'     => [
                        'Subject' => ['Data' => '[Test] Kết nối Amazon SES thành công'],
                        'Body'    => ['Html' => ['Data' => '<p>Email test từ hệ thống qua Amazon SES.</p>']],
                    ],
                ]);

                return $this->successResponse(null, "Đã gửi email test tới {$to} qua Amazon SES.");
            }

            if ($driver === 'mailgun') {
                $domain   = $request->input('mail_mailgun_domain');
                $secret   = $request->input('mail_mailgun_secret');
                $endpoint = $request->input('mail_mailgun_endpoint', 'api.mailgun.net');
                $from     = $request->input('mail_from_address');

                if (!$domain || !$secret || !$from) {
                    return $this->errorResponse('Thiếu thông tin: Domain, API Key hoặc From Email');
                }

                $response = \Illuminate\Support\Facades\Http::withBasicAuth('api', $secret)
                    ->post("https://{$endpoint}/v3/{$domain}/messages", [
                        'from'    => $from,
                        'to'      => $to,
                        'subject' => '[Test] Kết nối Mailgun thành công',
                        'html'    => '<p>Email test từ hệ thống qua Mailgun.</p>',
                    ]);

                if (!$response->successful()) {
                    return $this->errorResponse('Mailgun lỗi: ' . ($response->json('message') ?? $response->body()));
                }

                return $this->successResponse(null, "Đã gửi email test tới {$to} qua Mailgun.");
            }

            if ($driver === 'sendgrid') {
                $apiKey = $request->input('mail_sendgrid_api_key');
                $from   = $request->input('mail_from_address');

                if (!$apiKey || !$from) {
                    return $this->errorResponse('Thiếu thông tin: API Key hoặc From Email');
                }

                $response = \Illuminate\Support\Facades\Http::withToken($apiKey)
                    ->post('https://api.sendgrid.com/v3/mail/send', [
                        'personalizations' => [['to' => [['email' => $to]]]],
                        'from'             => ['email' => $from],
                        'subject'          => '[Test] Kết nối SendGrid thành công',
                        'content'          => [['type' => 'text/html', 'value' => '<p>Email test từ hệ thống qua SendGrid.</p>']],
                    ]);

                if ($response->status() !== 202) {
                    $errors = $response->json('errors.0.message') ?? $response->body();
                    return $this->errorResponse('SendGrid lỗi: ' . $errors);
                }

                return $this->successResponse(null, "Đã gửi email test tới {$to} qua SendGrid.");
            }

            return $this->errorResponse("Driver '{$driver}' không hỗ trợ test kết nối");
        } catch (\Exception $e) {
            return $this->errorResponse('Kết nối thất bại: ' . $e->getMessage());
        }
    }

    /**
     * Test kết nối Redis với thông tin gửi lên.
     */
    public function testRedis(Request $request)
    {
        $host     = $request->input('redis_host', '127.0.0.1');
        $port     = (int) $request->input('redis_port', 6379);
        $password = $request->input('redis_password');
        $db       = (int) $request->input('redis_db', 0);

        try {
            $redis = new \Redis();

            if (!@$redis->connect($host, $port, 3)) {
                return $this->errorResponse("Không thể kết nối tới Redis tại {$host}:{$port}");
            }

            if ($password) {
                if (!$redis->auth($password)) {
                    return $this->errorResponse('Xác thực Redis thất bại — sai password');
                }
            }

            if ($db > 0) {
                $redis->select($db);
            }

            $pong = $redis->ping('test');
            $redis->close();

            if ($pong !== 'test' && $pong !== true) {
                return $this->errorResponse('Redis phản hồi không đúng');
            }

            return $this->successResponse(
                ['host' => $host, 'port' => $port],
                "Kết nối Redis thành công tới {$host}:{$port}"
            );
        } catch (\Exception $e) {
            return $this->errorResponse('Kết nối Redis thất bại: ' . $e->getMessage());
        }
    }
}
