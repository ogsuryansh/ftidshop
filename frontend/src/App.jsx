import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardLayout from './components/DashboardLayout';
import BoxFallingAnimation from './components/BoxFallingAnimation';
import Home from './pages/Home';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import FtidSubmitOrder from './pages/FtidSubmitOrder';
import FtidMyOrders from './pages/FtidMyOrders';
import ReceiptsSubmitOrder from './pages/ReceiptsSubmitOrder';
import ReceiptsMyOrders from './pages/ReceiptsMyOrders';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import './App.css';

function App() {
  useEffect(() => {
    const timer = setTimeout(() => {
      const loader = document.querySelector('.landing_loader');
      if (loader) loader.remove();
      document.body.style.overflow = 'initial';
    }, 3200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <div className="landing_loader" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#090b0e' }}>
        <BoxFallingAnimation />
        <div style={{ marginTop: '-15px', textAlign: 'center', zIndex: 10 }}>
          <img src="/assets/images/brand_logo.png" alt="FTID.SHOP" style={{ height: '32px', width: 'auto', display: 'block', margin: '0 auto 6px auto', mixBlendMode: 'screen' }} />
          <div style={{ color: '#00f2fe', fontSize: '11px', letterSpacing: '1.5px', fontWeight: '600' }}>LOADING SERVICES...</div>
        </div>
      </div>
      
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<SignIn />} />
            <Route path="register" element={<SignUp />} />
          </Route>
          
          {/* Dashboard Route */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="ftid/submit" element={<FtidSubmitOrder />} />
            <Route path="ftid/orders" element={<FtidMyOrders />} />
            <Route path="receipts/submit" element={<ReceiptsSubmitOrder />} />
            <Route path="receipts/orders" element={<ReceiptsMyOrders />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin/login" element={<Layout />}>
             <Route index element={<AdminLogin />} />
          </Route>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
