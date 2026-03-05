import React from 'react';
import DoctorSidebar from './DoctorSidebar';

const DoctorLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <DoctorSidebar />
      <main className="flex-1 md:pl-64 pl-0 min-h-screen bg-gray-100">
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DoctorLayout; 
