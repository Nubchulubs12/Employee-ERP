import Home from './pages/Home'
import CompaniesPage from './pages/CompaniesPage';
import EmployeesPage from './pages/EmployeesPage';
import Login from './pages/Login';
import Register from './pages/Register';
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
        path: '/register',
        element: <Register />,
      },
    ],
  },
]);
function App() {
  return <RouterProvider router={router} />
}

export default App


