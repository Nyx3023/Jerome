import React from 'react';
import Header from './header';

const UserLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-red-50">
      <Header />
      <div className="pt-20">
        {children}
      </div>
    </div>
  );
};

export default UserLayout; 