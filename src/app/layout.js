import './globals.css'
import NavBar from '@/components/NavBar'

export const metadata = {
  title: 'PadelMatch',
  description: 'Finde Padel Gegner in deiner Nähe',
}

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>
        <div className="container">
          <NavBar />
          {children}
        </div>
      </body>
    </html>
  )
}
