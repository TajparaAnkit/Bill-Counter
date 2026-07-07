import { useAuth } from '../../hooks/useAuth';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
import { FaIcon } from './FaIcon';

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
        <FaIcon icon="fa-solid fa-user" size={18} />
        <span className="text-gray-700 font-medium">{user?.email}</span>
      </div>
      <button
        onClick={handleLogout}
        className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-red-600 transition-colors"
      >
        <FaIcon icon="fa-solid fa-right-from-bracket" size={18} />
        <span>Logout</span>
      </button>
    </div>
  );
};
