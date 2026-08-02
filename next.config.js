/** @type {import('next').NextConfig} */

// Hosts allowed to load dev-only resources (HMR, /_next/*). Next 16 blocks
// cross-origin dev requests by default, which breaks testing on a real phone
// through a tunnel or a custom hostname. The LAN address that `next dev` prints
// works without being listed here.
//
// Supply your own at startup, comma-separated:
//   NEXT_DEV_ORIGINS=my-tunnel.example.com npm run dev
const allowedDevOrigins =
  process.env.NEXT_DEV_ORIGINS?.split(',')
    .map((host) => host.trim())
    .filter(Boolean) ?? []

module.exports = {
  allowedDevOrigins,
}
