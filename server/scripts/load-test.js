/**
 * k6 load test for Kaam247 API (deployed).
 *
 * Install k6: https://k6.io/docs/get-started/installation/
 *   macOS: brew install k6
 *
 * Run (from repo root):
 *   k6 run server/scripts/load-test.js
 *
 * Override base URL:
 *   k6 run -e BASE_URL=https://kaam247.onrender.com server/scripts/load-test.js
 */

import http from 'k6/http'
import { check, sleep } from 'k6'

const BASE_URL = __ENV.BASE_URL || 'https://kaam247.onrender.com'

export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Ramp to 10 concurrent users
    { duration: '30s', target: 20 },  // Ramp to 20
    { duration: '30s', target: 50 },   // Ramp to 50
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],     // Error rate < 1%
    http_req_duration: ['p(95)<3000'],  // 95% of requests < 3s
  },
}

export default function () {
  const res = http.get(`${BASE_URL}/health`)
  check(res, { 'health status 200': (r) => r.status === 200 })
  sleep(0.5 + Math.random() * 0.5) // 0.5–1s between requests per VU
}
