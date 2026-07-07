import { useAuth } from '../../hooks/useAuth';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
import { LogOut, User } from 'lucide-react';

export const UserMenu: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to logout. Please try again.');
    }
  };

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2 text-sm">
        <User size={18} />
        <span className="text-gray-700 font-medium">{user?.email}</span>
      </div>
      <button
        onClick={handleLogout}
        className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-red-600 transition-colors"
      >
        <LogOut size={18} />
        <span>Logout</span>
      </button>
    </div>
  );
};
