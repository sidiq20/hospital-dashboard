import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { Login } from '@/pages/Login';
import { Signup } from '@/pages/Signup';
import { Dashboard } from '@/pages/Dashboard';
import { Patients } from '@/pages/Patients';
import { AddPatient } from '@/pages/AddPatient';
import { PatientDetails } from '@/pages/PatientDetails';
import { EditPatient } from '@/pages/EditPatient';
import { MyPatients } from '@/pages/MyPatients';
import { MyCases } from '@/pages/MyCases';
import { Consultants } from '@/pages/Consultants';
import { Staff } from '@/pages/Staff';
import { Reports } from '@/pages/Reports';
import { Toaster } from '@/components/ui/sonner';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  return currentUser ? <>{children}</> : <Navigate to="/login" />;
}

function AppContent() {
  const { currentUser } = useAuth();

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={currentUser ? <Navigate to="/" /> : <Login />}
        />
        <Route
          path="/signup"
          element={currentUser ? <Navigate to="/" /> : <Signup />}
        />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/patients" element={<Patients />} />
                  <Route path="/patients/new" element={<AddPatient />} />
                  <Route path="/patients/:id" element={<PatientDetails />} />
                  <Route path="/patients/:id/edit" element={<EditPatient />} />
                  <Route path="/my-patients" element={<MyPatients />} />
                  <Route path="/my-cases" element={<MyCases />} />
                  <Route path="/consultants" element={<Consultants />} />
                  <Route path="/staff" element={<Staff />} />
                  <Route path="/reports" element={<Reports />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
      <Toaster />
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;