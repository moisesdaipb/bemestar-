import React, { useState, useEffect } from 'react';
import { Screen, Company } from './types';
import { AuthProvider, useAuth } from './AuthContext';
import Home from './components/Home';
import BookingScreen from './components/BookingScreen';
import AdminDashboard from './components/AdminDashboard';
import ProgramForm from './components/ProgramForm';
import MyBookings from './components/MyBookings';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import Confirmation from './components/Confirmation';
import LoginScreen from './components/LoginScreen';
import RegisterScreen from './components/RegisterScreen';
import EmailVerificationScreen from './components/EmailVerificationScreen';
import CompleteProfileScreen from './components/CompleteProfileScreen';
import ResetPasswordScreen from './components/ResetPasswordScreen';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import CompanyForm from './components/CompanyForm';
import UserManagement from './components/UserManagement';
import CompanySelect from './components/CompanySelect';
import CreateUserForm from './components/CreateUserForm';
import CompanySettings from './components/CompanySettings';

const AppContent: React.FC = () => {
  const { user, isLoading, isAdmin, isSuperAdmin, logout, needsProfileCompletion, markProfileComplete, isPasswordRecovery, clearPasswordRecovery } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('reset_password') === 'true' || window.location.hash.includes('type=recovery')) {
      return Screen.RESET_PASSWORD;
    }
    return Screen.LOGIN;
  });
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedCompanyForRegister, setSelectedCompanyForRegister] = useState<Company | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [prefilledEmail, setPrefilledEmail] = useState<string | null>(null);

  // Redirect to reset password screen if in password recovery mode
  useEffect(() => {
    if (isPasswordRecovery) {
      setCurrentScreen(Screen.RESET_PASSWORD);
    }
  }, [isPasswordRecovery]);

  // Redirect to complete profile if needed
  useEffect(() => {
    if (user && needsProfileCompletion && !isPasswordRecovery) {
      setCurrentScreen(Screen.COMPLETE_PROFILE);
    }
  }, [user, needsProfileCompletion, isPasswordRecovery]);

  // Redirect to home if logged in and on login/register screen
  React.useEffect(() => {
    // Don't redirect if in reset password or complete profile flow
    if (isPasswordRecovery || needsProfileCompletion) return;

    if (user && (currentScreen === Screen.LOGIN || currentScreen === Screen.REGISTER || currentScreen === Screen.SELECT_COMPANY || currentScreen === Screen.EMAIL_VERIFY)) {
      setCurrentScreen(Screen.HOME);
    }
    if (!user && ![Screen.LOGIN, Screen.REGISTER, Screen.SELECT_COMPANY, Screen.EMAIL_VERIFY, Screen.RESET_PASSWORD].includes(currentScreen)) {
      setCurrentScreen(Screen.LOGIN);
    }
  }, [user, currentScreen, isPasswordRecovery, needsProfileCompletion]);

  const navigateTo = (screen: Screen, id?: string) => {
    // Block non-admin from accessing admin screens
    if (!isAdmin && (screen === Screen.ADMIN || screen === Screen.ADMIN_PROGRAM_FORM || screen === Screen.ADMIN_BOOKINGS)) {
      return;
    }
    // Block non-super_admin from accessing super admin screens
    if (!isSuperAdmin && (screen === Screen.SUPER_ADMIN || screen === Screen.SUPER_ADMIN_COMPANIES || screen === Screen.SUPER_ADMIN_COMPANY_FORM || screen === Screen.ADMIN_USERS)) {
      return;
    }
    if (id !== undefined) {
      if (screen === Screen.SUPER_ADMIN_COMPANY_FORM) {
        setSelectedCompanyId(id);
      } else {
        setSelectedProgramId(id);
      }
    }
    setCurrentScreen(screen);
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    if (currentScreen === Screen.BOOKING || currentScreen === Screen.PROGRAM_DETAILS) {
      setCurrentScreen(Screen.HOME);
    } else if (currentScreen === Screen.ADMIN_PROGRAM_FORM || currentScreen === Screen.ADMIN_BOOKINGS || currentScreen === Screen.COMPANY_SETTINGS) {
      setCurrentScreen(Screen.ADMIN);
    } else if (currentScreen === Screen.SUPER_ADMIN_COMPANY_FORM) {
      setCurrentScreen(Screen.SUPER_ADMIN);
    } else if (currentScreen === Screen.ADMIN_USERS || currentScreen === Screen.CREATE_USER) {
      setCurrentScreen(Screen.SUPER_ADMIN);
    } else if (currentScreen === Screen.CONFIRMATION) {
      setCurrentScreen(Screen.HOME);
    } else if (currentScreen === Screen.SELECT_COMPANY || currentScreen === Screen.EMAIL_VERIFY) {
      setCurrentScreen(Screen.LOGIN);
    } else if (currentScreen === Screen.REGISTER) {
      if (prefilledEmail) {
        setPrefilledEmail(null);
        setCurrentScreen(Screen.LOGIN);
      } else if (selectedCompanyForRegister) {
        setCurrentScreen(Screen.SELECT_COMPANY);
      } else {
        setCurrentScreen(Screen.LOGIN);
      }
    } else {
      setCurrentScreen(Screen.HOME);
    }
  };

  const handleProgramFormSave = () => {
    setCurrentScreen(Screen.ADMIN);
  };

  const handleCompanyFormSave = () => {
    setSelectedCompanyId(null);
    setCurrentScreen(Screen.SUPER_ADMIN);
  };

  const handleLogout = async () => {
    await logout();
    setSelectedCompanyForRegister(null);
    setCurrentScreen(Screen.LOGIN);
  };

  const handleSelectCompanyForRegister = (company: Company) => {
    setSelectedCompanyForRegister(company);
    setCurrentScreen(Screen.REGISTER);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="text-center">
          <div className="size-12 rounded-xl bg-primary flex items-center justify-center text-white mx-auto mb-4">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
          </div>
          <p className="text-text-muted">Carregando...</p>
        </div>
      </div>
    );
  }

  // Show reset password screen if in reset password flow (may or may not have user)
  if (isPasswordRecovery || currentScreen === Screen.RESET_PASSWORD) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark font-display flex justify-center">
        <div className="w-full max-w-md">
          <ResetPasswordScreen
            onComplete={() => {
              clearPasswordRecovery();
              setCurrentScreen(user ? Screen.HOME : Screen.LOGIN);
            }}
            onCancel={() => {
              clearPasswordRecovery();
              setCurrentScreen(user ? Screen.HOME : Screen.LOGIN);
            }}
          />
        </div>
      </div>
    );
  }

  // Show complete profile screen for users who need to set password/name
  // This can happen when user comes from magic link (may or may not have user loaded yet)
  if (needsProfileCompletion && user) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark font-display flex justify-center">
        <div className="w-full max-w-md">
          <CompleteProfileScreen
            onComplete={() => {
              markProfileComplete();
              setCurrentScreen(Screen.HOME);
            }}
            userEmail={user.email}
          />
        </div>
      </div>
    );
  }

  // Show login/register/company select screens if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark font-display flex justify-center">
        <div className="w-full max-w-md">
          {currentScreen === Screen.SELECT_COMPANY ? (
            <CompanySelect
              onSelectCompany={handleSelectCompanyForRegister}
              onBack={handleBack}
            />
          ) : currentScreen === Screen.EMAIL_VERIFY ? (
            <EmailVerificationScreen
              onNavigate={navigateTo}
              onEmailVerified={(email, company) => {
                setPrefilledEmail(email);
                setSelectedCompanyForRegister(company);
                navigateTo(Screen.REGISTER);
              }}
            />
          ) : currentScreen === Screen.REGISTER ? (
            <RegisterScreen
              onNavigate={navigateTo}
              selectedCompany={selectedCompanyForRegister}
              prefilledEmail={prefilledEmail}
            />
          ) : (
            <LoginScreen
              onNavigate={navigateTo}
              onSelectCompany={() => setCurrentScreen(Screen.SELECT_COMPANY)}
            />
          )}
        </div>
      </div>
    );
  }

  // Super Admin without company - redirect to super admin panel
  if (isSuperAdmin && !user.companyId && currentScreen === Screen.HOME) {
    setCurrentScreen(Screen.SUPER_ADMIN);
  }

  // Determine if bottom nav should be visible
  const showBottomNav = [Screen.HOME, Screen.ADMIN, Screen.MY_BOOKINGS, Screen.SUPER_ADMIN].includes(currentScreen);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-display flex justify-center">
      <div className="w-full max-w-md bg-white dark:bg-background-dark shadow-xl min-h-screen flex flex-col relative overflow-hidden">

        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onNavigate={(screen) => {
            setIsSidebarOpen(false);
            navigateTo(screen);
          }}
          user={user}
          onLogout={handleLogout}
        />

        {currentScreen === Screen.HOME && (
          <Home
            onOpenSidebar={() => setIsSidebarOpen(true)}
            onNavigate={navigateTo}
          />
        )}

        {currentScreen === Screen.PROGRAM_DETAILS && selectedProgramId && (
          <BookingScreen
            programId={selectedProgramId}
            onBack={handleBack}
            onConfirm={() => navigateTo(Screen.CONFIRMATION, selectedProgramId)}
          />
        )}

        {currentScreen === Screen.CONFIRMATION && (
          <Confirmation
            programId={selectedProgramId || undefined}
            onHome={() => navigateTo(Screen.HOME)}
          />
        )}

        {currentScreen === Screen.MY_BOOKINGS && (
          <MyBookings onBack={handleBack} />
        )}

        {currentScreen === Screen.ADMIN && isAdmin && (
          <AdminDashboard onNavigate={navigateTo} />
        )}

        {currentScreen === Screen.ADMIN_PROGRAM_FORM && isAdmin && (
          <ProgramForm
            onBack={handleBack}
            onSave={handleProgramFormSave}
            editProgramId={selectedProgramId}
          />
        )}

        {currentScreen === Screen.COMPANY_SETTINGS && isAdmin && (
          <CompanySettings
            onBack={handleBack}
            onSave={() => navigateTo(Screen.ADMIN)}
          />
        )}

        {/* Super Admin Screens */}
        {currentScreen === Screen.SUPER_ADMIN && isSuperAdmin && (
          <SuperAdminDashboard
            onBack={() => navigateTo(Screen.HOME)}
            onManageCompany={(companyId) => navigateTo(Screen.SUPER_ADMIN_COMPANY_FORM, companyId)}
            onCreateCompany={() => {
              setSelectedCompanyId(null);
              navigateTo(Screen.SUPER_ADMIN_COMPANY_FORM);
            }}
            onManageUsers={() => navigateTo(Screen.ADMIN_USERS)}
            onLogout={handleLogout}
          />
        )}

        {currentScreen === Screen.SUPER_ADMIN_COMPANY_FORM && isSuperAdmin && (
          <CompanyForm
            onBack={handleBack}
            onSave={handleCompanyFormSave}
            editCompanyId={selectedCompanyId}
          />
        )}

        {currentScreen === Screen.ADMIN_USERS && isSuperAdmin && (
          <UserManagement
            onBack={handleBack}
            onCreateUser={() => navigateTo(Screen.CREATE_USER)}
          />
        )}

        {currentScreen === Screen.CREATE_USER && isSuperAdmin && (
          <CreateUserForm
            onBack={handleBack}
            onSave={() => navigateTo(Screen.ADMIN_USERS)}
          />
        )}

        {/* Bottom Navigation */}
        {showBottomNav && (
          <BottomNav
            currentScreen={currentScreen}
            onNavigate={navigateTo}
            isAdmin={isAdmin}
            isSuperAdmin={isSuperAdmin}
          />
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
