import Home from './pages/Home'
import CompaniesPage from './pages/CompaniesPage';
import EmployeesPage from './pages/EmployeesPage';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Register from './pages/Register';
import Pricing from './pages/Pricing.jsx';
import Layout from './components/Layout';
import {createBrowserRouter,RouterProvider,} from 'react-router-dom'

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        path: '/',
        element: <Home />,
      },
      {
        path: '/companies/:id',
        element: <CompaniesPage />,
      },
      {
        path: '/employees/:id',
        element: <EmployeesPage />,
      },
      {
        path: '/login',
        element: <Login />,
      },
      {
        path: '/login/company',
        element: <Login defaultType="company" />,
      },
      {
        path: '/forgot-password',
        element: <ForgotPassword />,
      },
      {
        path: '/register',
        element: <Register />,
      },
      {
        path: '/pricing',
        element: <Pricing />,
      },
    ],
  },
]);
function App() {
  return <RouterProvider router={router} />
}

export default App
