import React, { createContext, useContext, useState, useEffect } from 'react';
import { userService } from '../services/api';
import { useAuth } from './AuthContext';
import { useDataSync } from './DataSyncContext';

const UserDataContext = createContext();

export const UserDataProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const dataSync = useDataSync ? (() => {
    try {
      return useDataSync();
    } catch {
      return null;
    }
  })() : null;

  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    birthday: '',
    gender: ''
  });
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserData();
    } else {
      resetUserData();
    }
  }, [isAuthenticated, user]);

  const resetUserData = () => {
    setProfile({
      fullName: '',
      email: '',
      phone: '',
      birthday: '',
      gender: ''
    });
    setAddresses([]);
  };

  const loadUserData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        loadProfile(),
        loadAddresses()
      ]);
    } catch (err) {
      console.error('Error loading user data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async () => {
    try {
      const data = await userService.getProfile();

      const p = {
        fullName: data.fullName || user?.username || '',
        email: data.email || user?.email || '',
        phone: data.phone || '',
        birthday: data.birthday || '',
        gender: data.gender || ''
      };

      setProfile(p);

      // ✅ đồng bộ ra LocalStorage để CheckoutPage có thể auto-fill
      try {
        localStorage.setItem(
          'anta_user_profile',
          JSON.stringify({
            fullName: p.fullName,
            email: p.email,
            phoneNumber: p.phone
          })
        );
      } catch { }
    } catch (err) {
      console.error('Error loading profile:', err);

      const p = {
        fullName: user?.username || '',
        email: user?.email || '',
        phone: '',
        birthday: '',
        gender: ''
      };

      setProfile(p);

      // ✅ vẫn ghi ra LocalStorage để các trang khác đọc được
      try {
        localStorage.setItem(
          'anta_user_profile',
          JSON.stringify({
            fullName: p.fullName,
            email: p.email,
            phoneNumber: p.phone
          })
        );
      } catch { }
    }
  };
  const loadAddresses = async () => {
    try {
      const data = await userService.getAddresses();
      setAddresses(data);

      // ✅ đồng bộ ra LocalStorage để CheckoutPage đọc
      try {
        localStorage.setItem('anta_user_addresses', JSON.stringify(data));
      } catch { }
    } catch (err) {
      console.error('Error loading addresses:', err);
      setAddresses([]);

      // ✅ vẫn đảm bảo có key trong LS
      try {
        localStorage.setItem('anta_user_addresses', '[]');
      } catch { }
    }
  };

  const updateProfile = async (profileData) => {
    setLoading(true);
    setError(null);

    try {
      // ⛳️ Tùy API của bạn:
      // Nếu backend trả về profile mới:
      const updated = await userService.updateProfile(profileData);

      const p = {
        fullName: updated?.fullName ?? profileData.fullName ?? profile.fullName ?? user?.username ?? '',
        email: updated?.email ?? profileData.email ?? profile.email ?? user?.email ?? '',
        phone: updated?.phone ?? profileData.phone ?? profile.phone ?? '',
        birthday: updated?.birthday ?? profileData.birthday ?? profile.birthday ?? '',
        gender: updated?.gender ?? profileData.gender ?? profile.gender ?? ''
      };

      setProfile(p);

      // ✅ đồng bộ ra LocalStorage để các trang khác auto-fill
      try {
        localStorage.setItem(
          'anta_user_profile',
          JSON.stringify({
            fullName: p.fullName,
            email: p.email,
            phoneNumber: p.phone
          })
        );
      } catch { }

      if (dataSync) {
        dataSync.emitUserDataUpdate({ action: 'updateProfile', profile: p });
      }

      return p;
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (passwordData) => {
    try {
      await userService.changePassword(passwordData);
      if (dataSync) {
        dataSync.emitUserDataUpdate({ action: 'changePassword' });
      }
      return true;
    } catch (err) {
      console.error('Error changing password:', err);
      throw err;
    }
  };

  const addAddress = async (addressData) => {
    try {
      const newAddress = await userService.addAddress(addressData);
      await loadAddresses();
      if (dataSync) {
        dataSync.emitUserDataUpdate({ action: 'addAddress', address: newAddress });
      }
      return newAddress;
    } catch (err) {
      console.error('Error adding address:', err);
      throw err;
    }
  };

  const updateAddress = async (id, addressData) => {
    try {
      await userService.updateAddress(id, addressData);
      await loadAddresses();
      if (dataSync) {
        dataSync.emitUserDataUpdate({ action: 'updateAddress', id, data: addressData });
      }
      return true;
    } catch (err) {
      console.error('Error updating address:', err);
      throw err;
    }
  };

  const deleteAddress = async (id) => {
    try {
      await userService.deleteAddress(id);
      await loadAddresses();
      if (dataSync) {
        dataSync.emitUserDataUpdate({ action: 'deleteAddress', id });
      }
      return true;
    } catch (err) {
      console.error('Error deleting address:', err);
      throw err;
    }
  };

  const setDefaultAddress = async (id) => {
    try {
      await userService.setDefaultAddress(id);
      await loadAddresses();
      if (dataSync) {
        dataSync.emitUserDataUpdate({ action: 'setDefaultAddress', id });
      }
      return true;
    } catch (err) {
      console.error('Error setting default address:', err);
      throw err;
    }
  };

  const refreshUserData = () => {
    if (isAuthenticated && user) {
      loadUserData();
    }
  };

  const getDefaultAddress = () => {
    return addresses.find(addr => addr.isDefault);
  };

  const value = {
    profile,
    addresses,
    loading,
    error,
    updateProfile,
    changePassword,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    refreshUserData,
    getDefaultAddress,
    totalAddresses: addresses.length
  };

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  );
};

export const useUserData = () => {
  const context = useContext(UserDataContext);
  if (!context) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
};
