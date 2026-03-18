// frontend/src/hooks/useManagementData.ts

import { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/apiClient';
import { mapUser, mapSupplier, type FrontendUser, type FrontendSupplier } from '../services/dataMappers';

// Employee HR record — matches employees table schema
export interface EmployeeRecord {
  id: string;
  employeeCode: string;
  fullName: string;
  position: string;
  baseHourlyRate: number;
  holidayRateMultiplier: number;
  overtimeRateMultiplier: number;
  hireDate: string;
  hireDateRaw: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function mapEmployee(e: any): EmployeeRecord {
  return {
    id: e.id,
    employeeCode: e.employee_code || '',
    fullName: e.full_name || '',
    position: e.position || '',
    baseHourlyRate: Number(e.base_hourly_rate) || 0,
    holidayRateMultiplier: Number(e.holiday_rate_multiplier) || 2.0,
    overtimeRateMultiplier: Number(e.overtime_rate_multiplier) || 1.5,
    hireDate: e.hire_date ? new Date(e.hire_date).toLocaleDateString() : '',
    hireDateRaw: e.hire_date || '',
    isActive: e.is_active ?? true,
    createdAt: e.created_at ? new Date(e.created_at).toLocaleDateString() : '',
    updatedAt: e.updated_at ? new Date(e.updated_at).toLocaleDateString() : '',
  };
}

export function useManagementData() {
  const [users, setUsers] = useState<FrontendUser[]>([]);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [suppliers, setSuppliers] = useState<FrontendSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, empRes, suppRes] = await Promise.all([
        apiClient.get('/api/users'),
        apiClient.get('/api/employees'),
        apiClient.get('/api/suppliers?status=all'),
      ]);
      if (usersRes.success && usersRes.data) setUsers(usersRes.data.map(mapUser));
      if (empRes.success && empRes.data) setEmployees(empRes.data.map(mapEmployee));
      if (suppRes.success && suppRes.data) setSuppliers(suppRes.data.map(mapSupplier));
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // User Account operations
  const createUser = async (form: { firstName: string; lastName: string; email: string; username: string; password: string; role: string; phoneNumber: string; }) => {
    const res = await apiClient.post('/api/users', { first_name: form.firstName, last_name: form.lastName, email: form.email, username: form.username, password: form.password, role: form.role.toLowerCase(), contact_number: form.phoneNumber });
    if (res.success) { await fetchAll(); return { success: true }; }
    return { success: false, error: res.error || 'Failed to create account' };
  };

  const updateUser = async (id: string, form: { firstName: string; lastName: string; email: string; phoneNumber: string; role: string; }) => {
    const res = await apiClient.put(`/api/users/${id}`, { first_name: form.firstName, last_name: form.lastName, email: form.email, contact_number: form.phoneNumber, role: form.role.toLowerCase() });
    if (res.success) { await fetchAll(); return { success: true }; }
    return { success: false, error: res.error || 'Failed to update account' };
  };

  const deactivateUsers = async (ids: string[]) => {
    const res = await apiClient.patch('/api/users/deactivate', { ids });
    if (res.success) { await fetchAll(); return { success: true }; }
    return { success: false, error: res.error || 'Failed to deactivate' };
  };

  // Employee HR Record operations
  const createEmployee = async (form: { employeeCode: string; fullName: string; position: string; baseHourlyRate: number; hireDate: string; }) => {
    const res = await apiClient.post('/api/employees', { employee_code: form.employeeCode, full_name: form.fullName, position: form.position, base_hourly_rate: form.baseHourlyRate, hire_date: form.hireDate });
    if (res.success) { await fetchAll(); return { success: true }; }
    return { success: false, error: res.error || 'Failed to create employee' };
  };

  const updateEmployee = async (id: string, form: { fullName: string; position: string; baseHourlyRate: number; holidayMultiplier: number; overtimeMultiplier: number; }) => {
    const res = await apiClient.put(`/api/employees/${id}`, { full_name: form.fullName, position: form.position, base_hourly_rate: form.baseHourlyRate, holiday_rate_multiplier: form.holidayMultiplier, overtime_rate_multiplier: form.overtimeMultiplier });
    if (res.success) { await fetchAll(); return { success: true }; }
    return { success: false, error: res.error || 'Failed to update employee' };
  };

  const deactivateEmployee = async (id: string) => {
    const res = await apiClient.patch(`/api/employees/${id}/deactivate`);
    if (res.success) { await fetchAll(); return { success: true }; }
    return { success: false, error: res.error || 'Failed to deactivate' };
  };

  // Supplier operations
  const createSupplier = async (form: { name: string; phone: string; email: string; }) => {
    const res = await apiClient.post('/api/suppliers', form);
    if (res.success) { await fetchAll(); return { success: true }; }
    return { success: false, error: res.error || 'Failed to create supplier' };
  };

  const flagSupplier = async (id: string, isFlagged: boolean, flagReason?: string) => {
    const res = await apiClient.patch(`/api/suppliers/${id}/flag`, { is_flagged: isFlagged, flag_reason: flagReason || '' });
    if (res.success) { await fetchAll(); return { success: true }; }
    return { success: false, error: res.error || 'Failed to update flag' };
  };

  const deactivateSuppliers = async (ids: string[]) => {
    const res = await apiClient.patch('/api/suppliers/deactivate', { ids });
    if (res.success) { await fetchAll(); return { success: true }; }
    return { success: false, error: res.error || 'Failed to deactivate' };
  };

  return {
    users, employees, suppliers, loading, error, refresh: fetchAll,
    createUser, updateUser, deactivateUsers,
    createEmployee, updateEmployee, deactivateEmployee,
    createSupplier, flagSupplier, deactivateSuppliers,
  };
}