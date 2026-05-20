<?php
/*
 * HeyGen routes
 *   GET  /api/heygen/avatars          list available avatars
 *   GET  /api/heygen/voices           list available voices
 *   POST /api/heygen/video            generate a new avatar video
 *   GET  /api/heygen/video/{id}       poll video status + get URL
 */
require_once __DIR__ . '/../lib/heygen.php';

function route_heygen(array $parts, string $method): void {
  requirePaidAccess();

  $sub = $parts[0] ?? '';

  if ($sub === 'avatars' && $method === 'GET') {
    $res = heygen_list_avatars();
    if (!empty($res['error'])) err($res['error'], 503);
    json_out(['items' => $res['data']['avatar_list'] ?? $res['data'] ?? []]);
  }

  if ($sub === 'voices' && $method === 'GET') {
    $res = heygen_list_voices();
    if (!empty($res['error'])) err($res['error'], 503);
    json_out(['items' => $res['data']['voices'] ?? $res['data'] ?? []]);
  }

  if ($sub === 'video' && empty($parts[1]) && $method === 'POST') {
    $b = required(['avatar_id', 'script']);
    $res = heygen_create_video(
      $b['avatar_id'],
      $b['script'],
      $b['voice_id']   ?? 'en-US-Matthew',
      $b['dimension']  ?? ['width' => 720, 'height' => 1280]
    );
    if (!empty($res['error'])) err($res['error'], 503);
    $video_id = $res['data']['video_id'] ?? null;
    if (!$video_id) err('HeyGen did not return a video_id', 502);
    json_out(['ok' => true, 'video_id' => $video_id, 'status' => 'processing'], 202);
  }

  if ($sub === 'video' && !empty($parts[1]) && $method === 'GET') {
    $res = heygen_video_status($parts[1]);
    if (!empty($res['error'])) err($res['error'], 503);
    $d = $res['data'] ?? $res;
    json_out([
      'video_id'  => $parts[1],
      'status'    => $d['status']    ?? 'unknown',
      'video_url' => $d['video_url'] ?? null,
      'duration'  => $d['duration']  ?? null,
    ]);
  }

  err('HeyGen route not found', 404);
}
