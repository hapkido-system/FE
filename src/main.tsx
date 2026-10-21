import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Link, RouterProvider, createBrowserRouter } from 'react-router'
import './index.css'
import Layout from './components/Layout'
import { RequireRole } from './components/Guards'
import { ADMIN_NAV, MY_NAV, SectionNav } from './components/SectionNav'
import { useAuth } from './store/auth'
import Home from './pages/Home'
import NoticeDetail from './pages/NoticeDetail'
import TournamentDetail from './pages/TournamentDetail'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ApplyForm from './pages/ApplyForm'
import MyHome from './pages/my/MyHome'
import MyDojang from './pages/my/MyDojang'
import MyStudents from './pages/my/MyStudents'
import MyApplications from './pages/my/MyApplications'
import MyResults from './pages/my/MyResults'
import AdminHome from './pages/admin/AdminHome'
import AdminMasters from './pages/admin/AdminMasters'
import AdminDojangs from './pages/admin/AdminDojangs'
import AdminTournaments from './pages/admin/AdminTournaments'
import AdminApplications from './pages/admin/AdminApplications'
import AdminBracket from './pages/admin/AdminBracket'
import AdminNotices from './pages/admin/AdminNotices'

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/notices/:id', element: <NoticeDetail /> },
      { path: '/tournaments/:id', element: <TournamentDetail /> },
      { path: '/login', element: <Login /> },
      { path: '/signup', element: <Signup /> },
      {
        element: <RequireRole role="MASTER" />,
        children: [
          { path: '/tournaments/:id/apply', element: <ApplyForm /> },
          {
            element: <SectionNav title="도장 관리" items={MY_NAV} />,
            children: [
              { path: '/my', element: <MyHome /> },
              { path: '/my/dojang', element: <MyDojang /> },
              { path: '/my/students', element: <MyStudents /> },
              { path: '/my/applications', element: <MyApplications /> },
              { path: '/my/results', element: <MyResults /> },
            ],
          },
        ],
      },
      {
        element: <RequireRole role="ADMIN" />,
        children: [
          {
            element: <SectionNav title="어드민" items={ADMIN_NAV} />,
            children: [
              { path: '/admin', element: <AdminHome /> },
              { path: '/admin/masters', element: <AdminMasters /> },
              { path: '/admin/dojangs', element: <AdminDojangs /> },
              { path: '/admin/tournaments', element: <AdminTournaments /> },
              { path: '/admin/tournaments/:id/applications', element: <AdminApplications /> },
              { path: '/admin/tournaments/:id/bracket', element: <AdminBracket /> },
              { path: '/admin/notices', element: <AdminNotices /> },
            ],
          },
        ],
      },
      {
        path: '*',
        element: (
          <div className="py-20 text-center">
            <p className="mb-4 text-slate-600">페이지를 찾을 수 없습니다.</p>
            <Link to="/" className="text-brand underline">메인으로</Link>
          </div>
        ),
      },
    ],
  },
])

// 로그인 상태를 먼저 불러온 뒤 렌더링 (라우트 가드가 정확히 판단하도록)
useAuth
  .getState()
  .load()
  .finally(() => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <RouterProvider router={router} />
      </StrictMode>,
    )
  })
