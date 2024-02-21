import { Outlet } from 'react-router-dom'
import Header from './Header'

export default function HomePage() {
  return (
    <div className="min-h-100">
      <Header />
      <div>
        <Outlet />
      </div>
    </div>
  )
}
