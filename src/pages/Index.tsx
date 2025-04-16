
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to the main app
    navigate('/');
  }, [navigate]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-biashara-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-biashara-primary mb-4">Biashara Yangu</h1>
        <p className="text-xl text-gray-600">Loading your business dashboard...</p>
      </div>
    </div>
  );
};

export default Index;
