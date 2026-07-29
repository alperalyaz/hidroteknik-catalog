/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  trailingSlash: false,
  async redirects() {
    return [
      // Bu sayfa yanlış kurulmuştu: içindekilerin tamamı pnömatik döner dirsekti.
      // İçerik pnomatik-rakor'a taşındı; eski adres kalıcı olarak oraya yönlendirilir.
      { source: '/:lang/hidrolik-dirsek', destination: '/:lang/pnomatik-rakor', permanent: true },
    ]
  },
}
export default nextConfig
