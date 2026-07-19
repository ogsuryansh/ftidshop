import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardLayout from './components/DashboardLayout';
import Home from './pages/Home';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import FtidSubmitOrder from './pages/FtidSubmitOrder';
import FtidMyOrders from './pages/FtidMyOrders';
import ReceiptsSubmitOrder from './pages/ReceiptsSubmitOrder';
import ReceiptsMyOrders from './pages/ReceiptsMyOrders';
import './App.css';

function App() {
  useEffect(() => {
    const timer = setTimeout(() => {
      const loader = document.querySelector('.landing_loader');
      if (loader) loader.remove();
      document.body.style.overflow = 'initial';
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <div className="landing_loader">
          <div className="scene">
              <div className="cube cube_count_1">
                  <div className="cube__face cube__face--front"></div>
                  <div className="cube__face cube__face--back"></div>
                  <div className="cube__face cube__face--right"></div>
                  <div className="cube__face cube__face--left"></div>
                  <div className="cube__face cube__face--top"></div>
                  <div className="cube__face cube__face--bottom"></div>
              </div>
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
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
