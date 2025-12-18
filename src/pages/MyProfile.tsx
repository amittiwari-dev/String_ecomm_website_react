import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ProfileService, ProfileResponse, OrderService, OrderResponse, ProfileStatistics } from '@/services/api';
import { toast } from 'sonner';
import { Loader2, User as UserIcon, Mail, Calendar, ShoppingBag, DollarSign, Clock, Package, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProfileSkeleton, ProfileErrorState } from '@/components/ui/profile-skeleton';

const MyProfile = () => {
  const { state: authState } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [statistics, setStatistics] = useState<ProfileStatistics | null>(null);
  const [recentOrders, setRecentOrders] = useState<OrderResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Authentication is handled by RouteWrapper

  // Fetch logged-in profile with statistics
  const fetchProfile = async (showToast = true, retryCount = 0) => {
    if (!authState.token) {
      setError('Authentication required. Please log in to view your profile.');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch profile, statistics, and orders in parallel with individual error handling
      const [profileResult, statisticsResult, ordersResult] = await Promise.allSettled([
        ProfileService.getProfile(authState.token),
        ProfileService.getProfileStatistics(authState.token),
        OrderService.getOrders(authState.token, 1)
      ]);

      // Handle profile data (required)
      if (profileResult.status === 'fulfilled') {
        setProfile(profileResult.value);
        setFormData({
          name: profileResult.value.name,
          email: profileResult.value.email,
        });
      } else {
        throw profileResult.reason;
      }

      // Handle statistics data with fallback values
      if (statisticsResult.status === 'fulfilled') {
        setStatistics(statisticsResult.value);
      } else {
        console.warn('Failed to load statistics, using fallback values:', statisticsResult.reason);
        // Provide fallback statistics from profile data or defaults
        const profileData = profileResult.value;
        setStatistics({
          totalOrders: profileData.total_orders || 0,
          totalSpent: profileData.total_spent || 0,
          pendingOrders: profileData.pending_orders || 0,
          averageOrderValue: profileData.average_order_value || 0,
          memberSince: profileData.member_since || profileData.created_at || new Date().toISOString(),
          favoriteCategories: profileData.favorite_categories || [],
          lastOrderDate: profileData.last_order_date
        });
      }

      // Handle orders data with fallback
      if (ordersResult.status === 'fulfilled' && ordersResult.value.data) {
        setRecentOrders(ordersResult.value.data.slice(0, 5));
      } else {
        console.warn('Failed to load recent orders:', ordersResult.status === 'rejected' ? ordersResult.reason : 'No data');
        setRecentOrders([]);
      }

      if (showToast) {
        toast.success('Profile loaded successfully');
      }
    } catch (error: any) {
      console.error('Failed to fetch profile:', error);
      const errorMessage = error.message || 'Failed to load profile data';
      setError(errorMessage);
      
      // Handle authentication errors
      if (errorMessage.includes('session has expired') || errorMessage.includes('Authentication required') || errorMessage.includes('Unauthenticated')) {
        if (showToast) {
          toast.error('Session expired', {
            description: 'Please log in again to continue',
          });
        }
        navigate('/login', { replace: true });
        return;
      }

      // Retry logic for network errors (max 2 retries)
      if (retryCount < 2 && (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('timeout'))) {
        console.log(`Retrying profile fetch (attempt ${retryCount + 1}/2)...`);
        setTimeout(() => {
          fetchProfile(false, retryCount + 1);
        }, 1000 * (retryCount + 1)); // Exponential backoff
        return;
      }
      
      if (showToast) {
        toast.error('Failed to load profile', {
          description: errorMessage,
          action: {
            label: 'Retry',
            onClick: () => fetchProfile(true, 0)
          }
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Real-time validation
  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'Name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        if (value.trim().length > 50) return 'Name must be less than 50 characters';
        if (!/^[a-zA-Z\s]+$/.test(value.trim())) return 'Name can only contain letters and spaces';
        return '';
      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
        if (value.length > 100) return 'Email must be less than 100 characters';
        return '';
      default:
        return '';
    }
  };

  // Handle form field changes with real-time validation
  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear existing error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Real-time validation (only show errors after user stops typing)
    const timeoutId = setTimeout(() => {
      const error = validateField(field, value);
      if (error) {
        setValidationErrors(prev => ({ ...prev, [field]: error }));
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  // Validate entire form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    const nameError = validateField('name', formData.name);
    if (nameError) errors.name = nameError;
    
    const emailError = validateField('email', formData.email);
    if (emailError) errors.email = emailError;

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Update user profile
  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      if (!authState.token) {
        toast.error('Please log in to update your profile');
        navigate('/login', { replace: true });
        return;
      }

      // Validate form before submission
      if (!validateForm()) {
        toast.error('Please fix the errors before submitting');
        return;
      }

      // Check if data has actually changed
      if (profile && formData.name === profile.name && formData.email === profile.email) {
        toast.info('No changes detected');
        setIsEditMode(false);
        return;
      }

      const updatedProfile = await ProfileService.updateProfile(authState.token, formData);
      setProfile(updatedProfile);
      setIsEditMode(false);
      setValidationErrors({});
      toast.success('Profile updated successfully!');
      
      // Refresh statistics after profile update
      fetchProfile(false);
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      
      // Parse validation errors from API
      if (err.message.includes(':')) {
        const errors: Record<string, string> = {};
        err.message.split(';').forEach((error: string) => {
          const [field, message] = error.split(':').map((s: string) => s.trim());
          if (field && message) {
            errors[field] = message;
          }
        });
        setValidationErrors(errors);
        toast.error('Please fix the errors and try again');
      } else {
        toast.error('Failed to update profile', {
          description: err.message,
        });
        
        // Handle authentication errors
        if (err.message.includes('session has expired') || err.message.includes('Authentication required')) {
          navigate('/login', { replace: true });
        }
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setValidationErrors({});
    if (profile) {
      setFormData({
        name: profile.name,
        email: profile.email,
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  useEffect(() => {
    if (authState.token) {
      fetchProfile(false); // Don't show toast on initial load
    }
  }, [authState.token]);

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (error || !profile) {
    return (
      <ProfileErrorState 
        error={error || 'Unable to load profile. Please try again later.'} 
        onRetry={() => fetchProfile(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">My Profile</h1>
                <p className="text-gray-600">Manage your account information and view your order statistics</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchProfile(true)}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-6 mb-8">
            {/* Order Statistics Cards */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ShoppingBag className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold">
                    {statistics?.totalOrders ?? profile?.total_orders ?? 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Spent</p>
                  <p className="text-2xl font-bold">
                    ₹{Number(statistics?.totalSpent ?? profile?.total_spent ?? 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pending Orders</p>
                  <p className="text-2xl font-bold">
                    {statistics?.pendingOrders ?? profile?.pending_orders ?? 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Avg Order Value</p>
                  <p className="text-2xl font-bold">
                    ₹{Number(statistics?.averageOrderValue ?? profile?.average_order_value ?? 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Information Card */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Profile Information</h2>
              {!isEditMode && (
                <Button onClick={() => setIsEditMode(true)} variant="outline">
                  Edit Profile
                </Button>
              )}
            </div>

            {isEditMode ? (
              <form onSubmit={updateProfile} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <UserIcon className="inline h-4 w-4 mr-1" />
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className={`w-full p-3 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                      validationErrors.name 
                        ? 'border-red-500 focus:border-red-500' 
                        : formData.name && !validateField('name', formData.name)
                        ? 'border-green-500 focus:border-green-500'
                        : 'border-gray-300 focus:border-primary'
                    }`}
                    value={formData.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    placeholder="Enter your full name"
                    maxLength={50}
                    autoComplete="name"
                  />
                  {validationErrors.name && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <span className="text-red-500">⚠</span>
                      {validationErrors.name}
                    </p>
                  )}
                  {formData.name && !validationErrors.name && !validateField('name', formData.name) && (
                    <p className="text-green-600 text-sm mt-1 flex items-center gap-1">
                      <span className="text-green-500">✓</span>
                      Looks good!
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Mail className="inline h-4 w-4 mr-1" />
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    className={`w-full p-3 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                      validationErrors.email 
                        ? 'border-red-500 focus:border-red-500' 
                        : formData.email && !validateField('email', formData.email)
                        ? 'border-green-500 focus:border-green-500'
                        : 'border-gray-300 focus:border-primary'
                    }`}
                    value={formData.email}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    placeholder="Enter your email address"
                    maxLength={100}
                    autoComplete="email"
                  />
                  {validationErrors.email && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <span className="text-red-500">⚠</span>
                      {validationErrors.email}
                    </p>
                  )}
                  {formData.email && !validationErrors.email && !validateField('email', formData.email) && (
                    <p className="text-green-600 text-sm mt-1 flex items-center gap-1">
                      <span className="text-green-500">✓</span>
                      Valid email address
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    type="submit" 
                    disabled={isUpdating || Object.keys(validationErrors).some(key => validationErrors[key])} 
                    className="flex-1"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Updating...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={isUpdating}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <UserIcon className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">{profile.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Mail className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{profile.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Member Since</p>
                    <p className="font-medium">
                      {profile.created_at
                        ? new Date(profile.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Profile Dashboard Section */}
          {statistics && (
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Favorite Categories */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  Favorite Categories
                </h3>
                {statistics?.favoriteCategories && statistics.favoriteCategories.length > 0 ? (
                  <div className="space-y-2">
                    {statistics.favoriteCategories.map((category, index) => (
                      <div key={`${category}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">{category}</span>
                        <Badge variant="secondary">#{index + 1}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-600 mb-3">No favorite categories yet</p>
                    <Link to="/">
                      <Button size="sm">Browse Books</Button>
                    </Link>
                  </div>
                )}
              </div>

              {/* Account Summary */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-primary" />
                  Account Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-600">Member Since</span>
                    </div>
                    <span className="font-medium">
                      {statistics?.memberSince 
                        ? new Date(statistics.memberSince).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                          })
                        : 'N/A'}
                    </span>
                  </div>
                  
                  {statistics?.lastOrderDate && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-600" />
                        <span className="text-sm text-gray-600">Last Order</span>
                      </div>
                      <span className="font-medium">
                        {new Date(statistics.lastOrderDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-600">Avg Order</span>
                    </div>
                    <span className="font-medium">
                      ₹{Number(statistics?.averageOrderValue ?? 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions Section */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link to="/order-history" className="group">
                <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-center">
                  <Package className="h-8 w-8 mx-auto mb-2 text-primary group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-medium">Order History</p>
                </div>
              </Link>
              
              <Link to="/" className="group">
                <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-center">
                  <ShoppingBag className="h-8 w-8 mx-auto mb-2 text-primary group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-medium">Browse Books</p>
                </div>
              </Link>
              
              <Link to="/cart" className="group">
                <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-center">
                  <svg className="h-8 w-8 mx-auto mb-2 text-primary group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m0 0h9" />
                  </svg>
                  <p className="text-sm font-medium">View Cart</p>
                </div>
              </Link>
              
              <div className="group cursor-pointer" onClick={() => fetchProfile(true)}>
                <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-center">
                  <RefreshCw className="h-8 w-8 mx-auto mb-2 text-primary group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-medium">Refresh Data</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Orders Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Package className="h-6 w-6" />
                Recent Orders
              </h2>
              <Link to="/order-history">
                <Button variant="outline">View All Orders</Button>
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">No orders yet</p>
                <Link to="/">
                  <Button>Start Shopping</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-semibold">Order #{order.order_number}</p>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {new Date(order.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                        {' • '}
                        {order.items?.length || 0} item(s)
                        {' • '}
                        <span className="font-semibold">₹{Number(order.total || 0).toFixed(2)}</span>
                      </p>
                    </div>
                    <Link to="/order-history">
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
