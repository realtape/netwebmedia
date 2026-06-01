<?php
/*
 * HeyGen API helper
 *
 * Config keys (in /home/webmed6/.netwebmedia-config.php):
 *   heygen_api_key  — HeyGen API key (Settings → API)
 *
 * Usage:
 *   heygen_create_video($avatar_id, $script, $voice_id)  → job array
 *   heygen_video_status($video_id)                        → status array
 *   heygen_list_avatars()                                 → avatar list
 *   heygen_list_voices()                                  → voice list
 */

function heygen_api(string $method, string $path, array $body = []): array {
  $cfg = config();
  $key = $cfg['heygen_api_key'] ?? '';
  if (!$key) return ['error' => 'heygen_api_key not configured'];

  $ch = curl_init('https://api.heygen.com' . $path);
  $opts = [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 30,
    CURLOPT_HTTPHEADER     => [
      'X-Api-Key: ' . $key,
      'Content-Type: application/json',
    ],
  ];

  if ($method === 'POST') {
    $opts[CURLOPT_POST]       = true;
    $opts[CURLOPT_POSTFIELDS] = json_encode($body);
  } elseif ($method !== 'GET') {
    $opts[CURLOPT_CUSTOMREQUEST] = $method;
    if ($body) $opts[CURLOPT_POSTFIELDS] = json_encode($body);
  }

  curl_setopt_array($ch, $opts);
  $resp = curl_exec($ch);
  $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);

  $j = json_decode($resp, true) ?: [];
  if ($code >= 300) $j['_http'] = $code;
  return $j;
}

/*
 * Create a talking-avatar video.
 *
 * $avatar_id  — from heygen_list_avatars() or HeyGen dashboard
 * $script     — text the avatar will say (max ~500 words per clip)
 * $voice_id   — from heygen_list_voices(); defaults to en-US Matthew
 * $dimension  — ['width'=>720,'height'=>1280] for 9:16 Reels
 */
function heygen_create_video(
  string $avatar_id,
  string $script,
  string $voice_id  = 'en-US-Matthew',
  array  $dimension = ['width' => 720, 'height' => 1280]
): array {
  return heygen_api('POST', '/v2/video/generate', [
    'video_inputs' => [[
      'character' => [
        'type'      => 'avatar',
        'avatar_id' => $avatar_id,
        'avatar_style' => 'normal',
      ],
      'voice' => [
        'type'     => 'text',
        'input_text' => $script,
        'voice_id'   => $voice_id,
      ],
    ]],
    'dimension'  => $dimension,
    'test'       => false,
  ]);
}

/*
 * Poll video status.
 * Possible statuses: processing | completed | failed
 * On 'completed', response includes 'video_url'.
 */
function heygen_video_status(string $video_id): array {
  return heygen_api('GET', '/v1/video_status.get?video_id=' . urlencode($video_id));
}

/* List available avatars for this account */
function heygen_list_avatars(): array {
  return heygen_api('GET', '/v2/avatars');
}

/* List available voices */
function heygen_list_voices(): array {
  return heygen_api('GET', '/v2/voices');
}
