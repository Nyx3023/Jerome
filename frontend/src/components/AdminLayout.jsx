import React from 'react';
import Sidebar from './Sidebar';

const AdminLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 md:pl-64 pl-0">
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout; 
