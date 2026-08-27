import React, { useState } from 'react';
import { FiUser, FiMapPin, FiLock, FiPlus, FiTrash2 } from 'react-icons/fi';
import Button from '../components/Button';
import { Input } from '../components/Input';
import { notifySuccess } from '../components/Toast';
import Breadcrumb from '../components/Breadcrumb';

interface Address {
  id: string;
  type: string;
  street: string;
  city: string;
  postalCode: string;
  isDefault: boolean;
}

export const ProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'info' | 'password' | 'addresses'>('info');

  const [personalInfo, setPersonalInfo] = useState({
    name: 'Jane Doe',
    email: 'jane.doe@eshop.com',
    phone: '555-0199',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [addresses, setAddresses] = useState<Address[]>([
    {
      id: 'addr-1',
      type: 'Home Address',
      street: '123 E-Commerce Way',
      city: 'San Jose, CA',
      postalCode: '95112',
      isDefault: true,
    },
    {
      id: 'addr-2',
      type: 'Office Address',
      street: '456 Tech Boulevard, Suite 500',
      city: 'San Francisco, CA',
      postalCode: '94103',
      isDefault: false,
    },
  ]);

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    notifySuccess('Personal profile information updated successfully!');
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      notifySuccess('Passwords do not match. Please verify.');
      return;
    }
    notifySuccess('Password changed successfully!');
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleRemoveAddress = (id: string, type: string) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
    notifySuccess(`Removed ${type} from address book!`);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <Breadcrumb items={[{ label: 'Profile', href: '/profile' }]} />

      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Account Settings</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
        {/* Navigation Sidebar Tabs */}
        <div className="flex flex-col gap-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-3 rounded-2xl shadow-sm">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === 'info'
                ? 'bg-primary-50 text-primary-600 dark:bg-primary-950/50 dark:text-primary-400'
                : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-850'
            }`}
          >
            <FiUser className="h-4.5 w-4.5" />
            Personal Profile
          </button>
          <button
            onClick={() => setActiveTab('addresses')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === 'addresses'
                ? 'bg-primary-50 text-primary-600 dark:bg-primary-950/50 dark:text-primary-400'
                : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-850'
            }`}
          >
            <FiMapPin className="h-4.5 w-4.5" />
            Address Book
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === 'password'
                ? 'bg-primary-50 text-primary-600 dark:bg-primary-950/50 dark:text-primary-400'
                : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-850'
            }`}
          >
            <FiLock className="h-4.5 w-4.5" />
            Security & Password
          </button>
        </div>

        {/* Tab content panel */}
        <div className="md:col-span-3">
          {activeTab === 'info' && (
            <form
              onSubmit={handleInfoSubmit}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-2xl shadow-sm space-y-4"
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3">
                Personal Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Display Name"
                  value={personalInfo.name}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, name: e.target.value })}
                  required
                />
                <Input
                  label="Email Address"
                  type="email"
                  value={personalInfo.email}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                  required
                />
                <div className="sm:col-span-2">
                  <Input
                    label="Mobile Number"
                    value={personalInfo.phone}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="pt-2">
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          )}

          {activeTab === 'addresses' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Registered Addresses</h3>
                <Button
                  size="sm"
                  onClick={() => notifySuccess('Add Address form overlay is coming soon!')}
                  leftIcon={<FiPlus />}
                >
                  New Address
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-gray-950 dark:text-white">
                          {address.type}
                        </span>
                        {address.isDefault && (
                          <span className="text-[10px] font-bold text-primary-700 bg-primary-50 dark:bg-primary-950 px-1.5 py-0.5 rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{address.street}</p>
                      <p className="text-xs text-gray-500">{address.city}, {address.postalCode}</p>
                    </div>

                    <div className="flex items-center justify-end border-t border-gray-50 dark:border-gray-850/50 pt-3 mt-4">
                      <button
                        onClick={() => handleRemoveAddress(address.id, address.type)}
                        className="text-gray-400 hover:text-red-500 p-1 hover:bg-red-50 dark:hover:bg-red-950/20 rounded"
                        aria-label="Delete Address"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'password' && (
            <form
              onSubmit={handlePasswordSubmit}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-2xl shadow-sm space-y-4"
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3">
                Security Password
              </h3>
              <div className="space-y-4">
                <Input
                  label="Current Password"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                  }
                  required
                />
                <Input
                  label="New Password"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                  }
                  required
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                  }
                  required
                />
              </div>
              <div className="pt-2">
                <Button type="submit">Update Password</Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
